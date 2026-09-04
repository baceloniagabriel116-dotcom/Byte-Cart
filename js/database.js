// Local-first database adapter with optional Supabase synchronization.
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

  syncProducts(seedProducts) {
    const stored = this.read("products");
    if (stored.length) {
      this.pull("products");
      return stored;
    }

    const seeded = seedProducts.map(product => ({
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

  getProducts() { return this.read("products"); }
  saveProducts(products) { return this.write("products", products); }
  getTransactions() { return this.read("transactions"); }
  getReviews() { return this.read("reviews"); }
}

const database = new Database();