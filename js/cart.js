// Shopping Cart System
class CartManager {
  constructor() {
    this.cartKey = "shopping-cart";
    this.ordersKey = "user-orders";
    this.cart = this.loadCart();
  }

  loadCart() {
    const cart = localStorage.getItem(this.cartKey);
    return cart ? JSON.parse(cart) : [];
  }

  saveCart() {
    localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
    this.dispatchCartUpdate();
  }

  addToCart(product, quantity = 1) {
    const existingItem = this.cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.push({
        ...product,
        quantity,
        addedAt: new Date().toISOString()
      });
    }

    this.saveCart();
    return { success: true, message: `${product.name} added to cart` };
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
  }

  updateQuantity(productId, quantity) {
    const item = this.cart.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.saveCart();
      }
    }
  }

  getCart() {
    return this.cart;
  }

  getCartCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  async syncOrdersFromSupabase() {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabaseClient.from("orders").select("*");
      if (error || !data || !data.length) return;
      const existing = this.getAllOrders();
      const merged = [...existing];
      for (const remoteOrder of data) {
        if (!merged.some(o => o.id === remoteOrder.id)) {
          merged.push(remoteOrder);
        }
      }
      localStorage.setItem(this.ordersKey, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { cart: this.cart, count: this.getCartCount() } }));
    } catch (e) {
      console.warn("Supabase orders sync failed:", e.message);
    }
  }

  checkout(shippingDetails) {
    if (!authManager.isLoggedIn()) {
      return { success: false, error: "Please log in to checkout" };
    }

    if (this.cart.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const order = {
      id: Date.now(),
      userId: authManager.getCurrentUser().id,
      items: [...this.cart],
      total: this.getCartTotal(),
      shippingDetails,
      status: "completed",
      createdAt: new Date().toISOString(),
      orderNumber: `ORD-${Date.now()}`
    };

    const transactionRows = database.getTransactions();
    const productRows = database.getProducts();
    for (const item of this.cart) {
      const product = productRows.find(row => row.id === item.id);
      if (!product || product.stock < item.quantity) {
        return { success: false, error: `${item.name} does not have enough stock` };
      }
      product.stock -= item.quantity;
      transactionRows.push({
        id: database.nextId(transactionRows),
        user_id: authManager.getCurrentUser().id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price_paid: item.price * item.quantity,
        transaction_date: order.createdAt,
        status: "completed"
      });
    }
    database.saveProducts(productRows);
    database.write("transactions", transactionRows);

    const orders = this.getAllOrders();
    salesManager.recordOrder(order);
    orders.push(order);
    localStorage.setItem(this.ordersKey, JSON.stringify(orders));

    if (isSupabaseConfigured) {
      supabaseClient.from("orders").upsert({
        id: order.id,
        userId: order.userId,
        items: order.items,
        total: order.total,
        shippingDetails: order.shippingDetails,
        status: order.status,
        createdAt: order.createdAt,
        orderNumber: order.orderNumber
      }).then(({ error }) => {
        if (error) console.warn("Supabase order save failed:", error.message);
      });
    }

    this.clearCart();

    return { success: true, order };
  }

  getAllOrders() {
    const orders = localStorage.getItem(this.ordersKey);
    return orders ? JSON.parse(orders) : [];
  }

  getUserOrders() {
    if (!authManager.isLoggedIn()) return [];
    const userId = authManager.getCurrentUser().id;
    return this.getAllOrders().filter(order => order.userId === userId);
  }

  getOrder(orderId) {
    return this.getAllOrders().find(order => order.id == orderId);
  }

  dispatchCartUpdate() {
    window.dispatchEvent(new CustomEvent("cartUpdated", {
      detail: { cart: this.cart, count: this.getCartCount() }
    }));
  }
}

class SalesManager {
  constructor() {
    this.salesKey = "product-sales-counts";
    this.sales = this.loadSales();
  }

  loadSales() {
    const sales = localStorage.getItem(this.salesKey);
    return sales ? JSON.parse(sales) : {};
  }

  saveSales() {
    localStorage.setItem(this.salesKey, JSON.stringify(this.sales));
  }

  getSalesCount(productId) {
    return this.sales[productId] || 0;
  }

  recordOrder(order) {
    order.items.forEach(item => {
      this.sales[item.id] = this.getSalesCount(item.id) + item.quantity;
    });
    this.saveSales();
  }
}

// Review Management System
class ReviewManager {
  constructor() {
    this.reviewsKey = "product-reviews";
    this.resetKey = "product-reviews-reset-v1";
    if (!localStorage.getItem(this.resetKey)) {
      localStorage.removeItem(this.reviewsKey);
      localStorage.setItem(this.resetKey, "true");
    }
    this.reviews = this.loadReviews();
  }

  loadReviews() {
    const reviews = database.getReviews();
    if (reviews.length) return reviews;
    const legacyReviews = localStorage.getItem(this.reviewsKey);
    return legacyReviews ? JSON.parse(legacyReviews) : [];
  }

  saveReviews() {
    database.write("reviews", this.reviews);
    localStorage.setItem(this.reviewsKey, JSON.stringify(this.reviews));
  }

  // Check if user has verified purchase for this product
  async hasRemoteVerifiedPurchase(productId) {
    if (!isSupabaseConfigured || !authManager.isLoggedIn()) return false;
    try {
      const { data, error } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("user_id", authManager.getCurrentUser().id)
        .eq("product_id", productId)
        .eq("status", "completed");
      if (error) return false;
      return (data && data.length) > 0;
    } catch (e) {
      return false;
    }
  }

  async canUserReview(productId) {
    if (!authManager.isLoggedIn()) return false;
    
    const currentUser = authManager.getCurrentUser();
    const localTransactions = database.getTransactions();
    const hasVerifiedPurchase = localTransactions.some(transaction =>
      transaction.user_id === currentUser.id && transaction.product_id === productId && transaction.status === "completed"
    );
    
    if (!hasVerifiedPurchase && isSupabaseConfigured) {
      const remote = await this.hasRemoteVerifiedPurchase(productId);
      if (!remote) return false;
    }
    
    const alreadyReviewed = this.reviews.some(
      review => review.userId === currentUser.id && review.productId === productId
    );
    
    return !alreadyReviewed;
  }

  async submitReview(productId, rating, comment) {
    if (!authManager.isLoggedIn()) {
      return { success: false, error: "Please log in to submit a review" };
    }

    if (!(await this.canUserReview(productId))) {
      return { success: false, error: "You are not eligible to review this product" };
    }

    const currentUser = authManager.getCurrentUser();
    const review = {
      id: Date.now(),
      productId,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      rating: parseFloat(rating),
      rating_stars: parseInt(rating, 10),
      comment,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.reviews.push(review);
    this.saveReviews();
    if (isSupabaseConfigured) {
      try {
        await supabaseClient.from("reviews").upsert(review);
      } catch (e) {
        console.warn("Supabase review sync failed:", e.message);
      }
    }
    return { success: true, review };
  }

  // Get reviews for a specific product
  getProductReviews(productId) {
    return this.reviews.filter(review => review.productId === productId);
  }

  // Calculate average rating from reviews
  getProductAverageRating(productId) {
    const productReviews = this.getProductReviews(productId);
    if (productReviews.length === 0) return 0;
    
    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / productReviews.length).toFixed(1);
  }

  // Delete review (only by owner or admin)
  deleteReview(reviewId) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) return { success: false, error: "Review not found" };

    const currentUser = authManager.getCurrentUser();
    if (!currentUser || review.userId !== currentUser.id) {
      return { success: false, error: "You can only delete your own reviews" };
    }

    this.reviews = this.reviews.filter(r => r.id !== reviewId);
    this.saveReviews();
    return { success: true };
  }
}

const salesManager = new SalesManager();
const cartManager = new CartManager();
const reviewManager = new ReviewManager();
