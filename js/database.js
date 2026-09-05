// Local-first database adapter with optional Supabase synchronization.
const PRODUCT_CATEGORIES = Object.freeze(["electronics", "wearables", "accessories"]);
class Database {
  constructor() {
    this.keys = {
      users: "db-users",
      products: "db-products",
      transactions: "db-transactions",
      reviews: "db-reviews"
    };
    this.remoteTables = {
      users: "users",
      products: "products",
      transactions: "transactions",
      reviews: "reviews"
    };
  }

  read(table) {
    const value = localStorage.getItem(this.keys[table]);
    return value ? JSON.parse(value) : [];
  }

  write(table, rows) {
    localStorage.setItem(this.keys[table], JSON.stringify(rows));
    this.push(table, rows);
    window.dispatchEvent(new CustomEvent("databaseUpdated", { detail: { table } }));
    return rows;
  }

  nextId(rows) {
    return rows.reduce((highest, row) => Math.max(highest, Number(row.id) || 0), 0) + 1;
  }

  normalizeProduct(product) {
    const normalizeCategory = category => String(category || "").trim().toLowerCase();
    const categories = Array.isArray(product.categories)
      ? product.categories.map(normalizeCategory).filter(category => PRODUCT_CATEGORIES.includes(category))
      : PRODUCT_CATEGORIES.includes(normalizeCategory(product.category)) ? [normalizeCategory(product.category)] : [];
    const { category, ...productWithoutLegacyCategory } = product;
    return { ...productWithoutLegacyCategory, categories };
  }

  syncProducts(seedProducts) {
    const stored = this.read("products");
    if (stored.length) {
      this.pull("products");
      return stored.map(product => this.normalizeProduct(product));
    }

    const seeded = seedProducts.map(product => this.normalizeProduct({
      ...product,
      price_php: product.price,
      active: true,
      created_at: new Date().toISOString()
    }));
    return this.write("products", seeded);
  }

  async pull(table) {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabaseClient
      .from(this.remoteTables[table])
      .select("*");
    if (error) {
      console.warn(`Supabase ${table} sync failed:`, error.message);
      return;
    }
    if (data && data.length) {
      localStorage.setItem(this.keys[table], JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("databaseUpdated", { detail: { table } }));
    }
  }

  async push(table, rows) {
    if (!isSupabaseConfigured || !rows.length) return;
    const { error } = await supabaseClient
      .from(this.remoteTables[table])
      .upsert(rows);
    if (error) console.warn(`Supabase ${table} save failed:`, error.message);
  }

  getProducts() { return this.read("products").map(product => this.normalizeProduct(product)); }
  saveProducts(products) {
    const normalizedProducts = products.map(product => this.normalizeProduct(product));
    if (!normalizedProducts.every(product => product.categories.length > 0)) {
      throw new Error("Every product must have at least one valid category.");
    }
    return this.write("products", normalizedProducts);
  }
  getTransactions() { return this.read("transactions"); }
  getReviews() { return this.read("reviews"); }
}

const database = new Database();
