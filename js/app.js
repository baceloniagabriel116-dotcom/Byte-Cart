// Main Application Logic
class EcommerceApp {
  constructor() {
    this.init();
  }

  init() {
    products.forEach(product => {
      product.rating = Number(reviewManager.getProductAverageRating(product.id)) || 0;
      product.reviews = reviewManager.getProductReviews(product.id).length;
    });
    this.setupEventListeners();
    this.updateUI();
    this.setupScrollAnimations();
  }

  setupEventListeners() {
    // Cart updates
    window.addEventListener("cartUpdated", () => this.updateCartUI());
  }

  setupScrollAnimations() {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const revealSelector = ".hero-content, .product-card, .category-card, .footer-section, .admin-panel, .checkout-summary";
    this.scrollObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    const revealElements = root => {
      const elements = [];
      if (root.nodeType === Node.ELEMENT_NODE && root.matches(revealSelector)) elements.push(root);
      if (root.querySelectorAll) elements.push(...root.querySelectorAll(revealSelector));
      elements.forEach((element, index) => {
        if (element.classList.contains("reveal-on-scroll")) return;
        element.classList.add("reveal-on-scroll");
        element.style.setProperty("--reveal-delay", `${(index % 4) * 45}ms`);
        this.scrollObserver.observe(element);
      });
    };

    revealElements(document);
    this.animationMutationObserver = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => revealElements(node)));
    });
    this.animationMutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  updateUI() {
    this.updateCartUI();
    this.updateAuthUI();
  }

  updateCartUI() {
    const cartCount = document.getElementById("cartCount");
    if (cartCount) {
      cartCount.textContent = cartManager.getCartCount();
    }
  }

  updateAuthUI() {
    const userMenu = document.getElementById("userMenu");
    const authButtons = document.getElementById("authButtons");

    if (authManager.isLoggedIn()) {
      const user = authManager.getCurrentUser();
      if (userMenu) {
        userMenu.innerHTML = `
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-700">Welcome, ${user.firstName}!</span>
            <a href="account.html" class="text-blue-600 hover:text-blue-800">My Account</a>
            ${authManager.isAdmin() ? '<a href="admin.html" class="text-blue-600 hover:text-blue-800">Admin</a>' : ''}
            <button onclick="handleLogout()" class="text-red-600 hover:text-red-800">Logout</button>
          </div>
        `;
      }
      if (authButtons) authButtons.style.display = "none";
    } else {
      if (authButtons) {
        authButtons.innerHTML = `
          <a href="login.html" class="px-4 py-2 text-blue-600 hover:text-blue-800">Login</a>
          <a href="login.html" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Register</a>
        `;
      }
      if (userMenu) userMenu.innerHTML = "";
    }
  }

  displayProductDetail(product) {
    const container = document.getElementById("productDetail");
    if (!container) return;

    // Get dynamic reviews
    const productReviews = reviewManager.getProductReviews(product.id);
    const reviewCount = productReviews.length;
    const avgRating = reviewManager.getProductAverageRating(product.id);

    // Build rating display (only if reviews exist)
    let ratingHTML = "";
    if (reviewCount > 0) {
      const stars = '★'.repeat(Math.floor(avgRating)) + (avgRating % 1 >= 0.5 ? '★' : '');
      ratingHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            <span style="font-size: 1.25rem; color: #f59e0b; letter-spacing: -0.05em;">
              ${stars}${'☆'.repeat(5 - Math.floor(avgRating))}
            </span>
          </div>
          <span style="font-size: 1rem; font-weight: 600; color: #111;">${avgRating}</span>
          <span style="font-size: 0.9rem; color: #999;">(${reviewCount} review${reviewCount !== 1 ? 's' : ''})</span>
        </div>
      `;
    } else {
      ratingHTML = `
        <div style="margin-top: 1.5rem; padding: 0.75rem; background: #f9fafb; border-radius: 0.5rem; border-left: 3px solid #d1d5db;">
          <p style="font-size: 0.9rem; color: #666;">No reviews yet</p>
          <p style="font-size: 0.85rem; color: #999;">Be the first to review this product after purchase.</p>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start;">
        <!-- Left: Product Image -->
        <div style="position: sticky; top: 100px;">
          <div style="background: #f9fafb; border-radius: 1rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <img src="${product.image_url || 'assets/default-tech-placeholder.svg'}" alt="${product.name}" class="product-detail-image">
          </div>
        </div>

        <!-- Right: Product Details -->
        <div>
          <!-- Category Badge -->
          <div style="display: inline-block;">
            <span style="background: #f3f4f6; color: #666; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem 1rem; border-radius: 0.25rem;">${product.categories.join(", ")}</span>
          </div>

          <!-- Product Title -->
          <h1 style="font-size: 2.5rem; font-weight: 700; color: #111; margin-top: 1rem; line-height: 1.2;">
            ${product.name}
          </h1>

          <!-- Dynamic Rating Display -->
          ${ratingHTML}

          <!-- Price Section -->
          <div style="margin-top: 2rem; padding: 2rem 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: baseline; gap: 1rem;">
              <span style="font-size: 2.5rem; font-weight: 800; color: #2563eb;">₱${product.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
              <span style="font-size: 0.9rem; color: #999; text-decoration: line-through;">₱${(product.price * 1.2).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
            </div>
            <span class="product-sales">✓ ${salesManager.getSalesCount(product.id)} bought</span>

            <!-- Stock Badge -->
            <div style="margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.5rem; background: #ecfdf5; color: #166534; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600; font-size: 0.9rem;">
              <span style="font-size: 1.2rem;">●</span>
              <span>${product.stock} in stock</span>
            </div>
          </div>

          <!-- Product Description -->
          <p style="font-size: 1rem; color: #666; line-height: 1.7; margin-top: 2rem;">
            ${product.description}
          </p>


          <!-- Quantity Selector & CTA -->
          <div style="margin-top: 3rem; display: flex; gap: 1rem; align-items: center;">
            <!-- Quantity Selector -->
            <div style="display: flex; align-items: center; background: #f3f4f6; border-radius: 0.5rem; border: 1px solid #e5e7eb; width: fit-content;">
              <button onclick="decreaseQuantity()" style="background: none; border: none; padding: 0.75rem 1rem; cursor: pointer; font-size: 1.2rem; color: #666; transition: all 0.2s;">−</button>
              <input type="number" id="quantity" value="1" min="1" max="${product.stock}" style="width: 60px; text-align: center; border: none; background: transparent; font-weight: 600; font-size: 1rem; outline: none;">
              <button onclick="increaseQuantity(${product.stock})" style="background: none; border: none; padding: 0.75rem 1rem; cursor: pointer; font-size: 1.2rem; color: #666; transition: all 0.2s;">+</button>
            </div>

            <!-- Add to Cart Button -->
            <button onclick="addProductToCart(${product.id}, parseInt(document.getElementById('quantity').value))" style="flex: 1; padding: 1rem 2rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-size: 1.1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              <span style="font-size: 1.3rem;">🛒</span>
              <span>Add to Cart</span>
            </button>
          </div>

          <!-- Buy Now Button -->
          <button onclick="buyNowProduct(${product.id}, parseInt(document.getElementById('quantity').value))" style="width: 100%; margin-top: 1rem; padding: 1rem; background: white; color: #2563eb; border: 2px solid #2563eb; border-radius: 0.5rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">⚡</span>
            <span>Buy Now</span>
          </button>

        </div>
      </div>

      <style>
        @media (max-width: 768px) {
          #productDetail > div {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          #productDetail h1 {
            font-size: 1.75rem !important;
          }
        }
      </style>
    `;
  }

  displayCart() {
    const container = document.getElementById("cartContainer");
    if (!container) return;

    const cart = cartManager.getCart();

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <p class="text-2xl text-gray-600 mb-4">Your cart is empty</p>
          <a href="products.html" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Continue Shopping
          </a>
        </div>
      `;
      return;
    }

    const cartHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left">Product</th>
                  <th class="px-4 py-3 text-center">Quantity</th>
                  <th class="px-4 py-3 text-right">Price</th>
                  <th class="px-4 py-3 text-right">Total</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                ${cart.map(item => `
                  <tr class="border-t hover:bg-gray-50">
                    <td class="px-4 py-3">
                      <div class="flex gap-3">
                        <img src="${item.image_url || 'assets/default-tech-placeholder.svg'}" alt="${item.name}" class="product-thumbnail">
                        <div>
                          <p class="font-semibold text-gray-800">${item.name}</p>
                          <p class="text-sm text-gray-600">₱${item.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} each</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input type="number" value="${item.quantity}" min="1" onchange="updateCartItem(${item.id}, this.value)" class="w-16 px-2 py-1 border rounded text-center">
                    </td>
                    <td class="px-4 py-3 text-right">₱${item.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                    <td class="px-4 py-3 text-right font-semibold">₱${(item.price * item.quantity).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                    <td class="px-4 py-3 text-right">
                      <button onclick="removeCartItem(${item.id})" class="text-red-600 hover:text-red-800 text-sm font-semibold">Remove</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <div class="lg:col-span-1">
          <div class="border rounded-lg p-6 bg-gray-50 sticky top-4">
            <h2 class="text-xl font-bold mb-4">Order Summary</h2>
            <div class="space-y-2 mb-4 pb-4 border-b">
              <div class="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>₱${cartManager.getCartTotal().toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
              </div>
              <div class="flex justify-between text-gray-700">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div class="flex justify-between text-gray-700">
                <span>Tax:</span>
                <span>₱${(cartManager.getCartTotal() * 0.1).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
              </div>
            </div>
            <div class="flex justify-between text-xl font-bold mb-6">
              <span>Total:</span>
              <span class="text-blue-600">₱${(cartManager.getCartTotal() * 1.1).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
            </div>
            <button onclick="proceedToCheckout()" class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
              Proceed to Checkout
            </button>
            <a href="products.html" class="block text-center mt-3 text-blue-600 hover:text-blue-800 text-sm">
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = cartHTML;
  }
}

// Global function helpers
function addProductToCart(productId, quantity = 1) {
  const product = products.find(p => p.id === productId);
  if (product) {
    const result = cartManager.addToCart(product, quantity);
    showNotification(result.message, "success");
  }
}

function removeCartItem(productId) {
  cartManager.removeFromCart(productId);
  app.displayCart();
  showNotification("Item removed from cart", "success");
}

function updateCartItem(productId, quantity) {
  cartManager.updateQuantity(productId, parseInt(quantity));
  app.displayCart();
}

function proceedToCheckout() {
  if (!authManager.isLoggedIn()) {
    showLoginModal("Please log in to proceed with checkout");
  } else {
    window.location.href = "checkout.html";
  }
}

function handleLogout() {
  authManager.logout();
  showNotification("Logged out successfully", "success");
  setTimeout(() => window.location.href = "index.html", 1000);
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600"
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

function showLoginModal(message = "Please log in to continue") {
  const modal = document.getElementById("loginModal");
  if (modal) {
    document.getElementById("loginMessage").textContent = message;
    modal.classList.add("show");
  }
}

function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) modal.classList.remove("show");
}

// Quantity controls for product detail page
function decreaseQuantity() {
  const quantityInput = document.getElementById("quantity");
  if (quantityInput && parseInt(quantityInput.value) > 1) {
    quantityInput.value = parseInt(quantityInput.value) - 1;
  }
}

function increaseQuantity(maxStock) {
  const quantityInput = document.getElementById("quantity");
  if (quantityInput && parseInt(quantityInput.value) < maxStock) {
    quantityInput.value = parseInt(quantityInput.value) + 1;
  }
}

function buyNowProduct(productId, quantity) {
  const product = products.find(p => p.id === productId);
  if (product) {
    cartManager.addToCart(product, quantity);
    showNotification("Added to cart! Redirecting to checkout...", "success");
    setTimeout(() => {
      proceedToCheckout();
    }, 1000);
  }
}

// Initialize app when DOM is ready
// Review Section Functions
function displayReviewSection(productId) {
  const reviewSection = document.getElementById("reviewsSection");
  if (!reviewSection) return;

  const productReviews = reviewManager.getProductReviews(productId);
  const canReview = reviewManager.canUserReview(productId);
  const isLoggedIn = authManager.isLoggedIn();

  let reviewsHTML = `
    <div style="margin-top: 3rem; padding-top: 3rem; border-top: 2px solid #e5e7eb;">
      <h2 style="font-size: 1.75rem; font-weight: 700; color: #111; margin-bottom: 2rem;">Customer Reviews</h2>
  `;

  // Review submission form (only for verified buyers)
  if (isLoggedIn && canReview) {
    reviewsHTML += `
      <div style="background: #f9fafb; padding: 2rem; border-radius: 0.75rem; margin-bottom: 2rem; border: 1px solid #e5e7eb;">
        <h3 style="font-size: 1.25rem; font-weight: 600; color: #111; margin-bottom: 1rem;">Write a Review</h3>
        <form id="reviewForm" onsubmit="submitProductReview(event, ${productId})">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Rating <span style="color: #ef4444;">*</span></label>
            <div style="display: flex; gap: 0.5rem;">
              ${[1, 2, 3, 4, 5].map(star => `
                <input type="radio" id="rating${star}" name="rating" value="${star}" style="display: none;">
                <label for="rating${star}" style="font-size: 2rem; cursor: pointer; opacity: 0.4; transition: opacity 0.2s;" onmouseover="previewRating(${star})" onmouseout="resetRating()">★</label>
              `).join('')}
            </div>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Your Review <span style="color: #ef4444;">*</span></label>
            <textarea name="comment" placeholder="Share your experience with this product..." required style="width: 100%; min-height: 120px; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-family: inherit; font-size: 1rem; resize: vertical;"></textarea>
          </div>
          <button type="submit" style="padding: 0.75rem 2rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s;">Submit Review</button>
        </form>
      </div>
    `;
  } else if (isLoggedIn && !canReview) {
    reviewsHTML += `
      <div style="background: #fef3c7; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem; border-left: 4px solid #f59e0b;">
        <p style="font-size: 0.95rem; color: #92400e;"><strong>✓ Verified Buyer Eligible</strong></p>
        <p style="font-size: 0.9rem; color: #b45309; margin-top: 0.25rem;">You have already reviewed this product.</p>
      </div>
    `;
  } else if (!isLoggedIn) {
    reviewsHTML += `
      <div style="background: #eff6ff; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem; border-left: 4px solid #2563eb;">
        <p style="font-size: 0.95rem; color: #1e40af;"><strong>Only verified buyers can leave a review for this product.</strong></p>
        <p style="font-size: 0.9rem; color: #1e3a8a; margin-top: 0.5rem;"><a href="login.html" style="color: #2563eb; text-decoration: underline; font-weight: 600;">Log in</a> to review if you've purchased this item.</p>
      </div>
    `;
  }

  // Display existing reviews
  if (productReviews.length > 0) {
    reviewsHTML += `
      <div style="margin-top: 2rem;">
        <h3 style="font-size: 1.1rem; font-weight: 600; color: #111; margin-bottom: 1.5rem;">${productReviews.length} review${productReviews.length !== 1 ? 's' : ''}</h3>
        ${productReviews.map(review => `
          <div style="padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
              <div>
                <p style="font-weight: 600; color: #111;">${review.userName}</p>
                <p style="font-size: 0.85rem; color: #999;">${new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              <span style="font-size: 1.1rem; color: #f59e0b;">${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5 - Math.floor(review.rating))}</span>
            </div>
            <p style="color: #666; line-height: 1.6;">${review.comment}</p>
            ${review.userId === (authManager.isLoggedIn() ? authManager.getCurrentUser().id : null) ? `
              <button onclick="deleteProductReview(${review.id})" style="margin-top: 0.75rem; padding: 0.35rem 0.75rem; background: #fecaca; color: #dc2626; border: none; border-radius: 0.25rem; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">Delete</button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    reviewsHTML += `
      <div style="text-align: center; padding: 2rem; color: #999;">
        <p style="font-size: 0.95rem;">Be the first to review this product after purchase.</p>
      </div>
    `;
  }

  reviewsHTML += `</div>`;
  reviewSection.innerHTML = reviewsHTML;
}

function previewRating(rating) {
  const labels = document.querySelectorAll('label[for^="rating"]');
  labels.forEach((label, index) => {
    label.style.opacity = index < rating ? '1' : '0.4';
  });
}

function resetRating() {
  const labels = document.querySelectorAll('label[for^="rating"]');
  const checked = document.querySelector('input[name="rating"]:checked');
  if (!checked) {
    labels.forEach(label => label.style.opacity = '0.4');
  } else {
    labels.forEach((label, index) => {
      label.style.opacity = index < parseInt(checked.value) ? '1' : '0.4';
    });
  }
}

function submitProductReview(event, productId) {
  event.preventDefault();
  
  const form = event.target;
  const rating = form.querySelector('input[name="rating"]:checked')?.value;
  const comment = form.querySelector('textarea[name="comment"]').value;

  if (!rating) {
    showNotification("Please select a rating", "error");
    return;
  }

  if (!comment.trim()) {
    showNotification("Please write a review", "error");
    return;
  }

  const result = reviewManager.submitReview(productId, rating, comment);

  if (result.success) {
    showNotification("Review submitted successfully!", "success");
    form.reset();
    displayReviewSection(productId);
  } else {
    showNotification(result.error || "Failed to submit review", "error");
  }
}

function deleteProductReview(reviewId) {
  if (!confirm("Are you sure you want to delete this review?")) return;

  const result = reviewManager.deleteReview(reviewId);

  if (result.success) {
    showNotification("Review deleted successfully", "success");
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get("id"));
    displayReviewSection(productId);
  } else {
    showNotification(result.error || "Failed to delete review", "error");
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new EcommerceApp();
});
