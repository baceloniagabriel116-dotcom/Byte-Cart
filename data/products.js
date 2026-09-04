// Product Database
const seedProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    category: "electronics",
    price: 11399,
    image_url: "assets/default-tech-placeholder.svg",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    rating: 0,
    reviews: 0,
    sales_count: 0,
    stock: 50
  },
  {
    id: 2,
    name: "Ultra HD 4K Camera",
    slug: "ultra-hd-4k-camera",
    category: "electronics",
    price: 28499,
    image_url: "assets/default-tech-placeholder.svg",
    description: "Professional 4K camera with advanced image stabilization and built-in WiFi.",
    rating: 0,
    reviews: 0,
    sales_count: 0,
    stock: 25
  },
  {
    id: 3,
    name: "Smart Watch Pro",
    slug: "smart-watch-pro",
    category: "wearables",
    price: 19949,
    image_url: "assets/default-tech-placeholder.svg",
    description: "Feature-rich smartwatch with health tracking, GPS, and 7-day battery.",
    rating: 0,
    reviews: 0,
    sales_count: 0,
    stock: 100
  },
  {
    id: 4,
    name: "Portable Power Bank 20000mAh",
    slug: "portable-power-bank",
    category: "accessories",
    price: 2849,
    image_url: "assets/default-tech-placeholder.svg",
    description: "Fast charging power bank with dual USB ports and LED display.",
    rating: 0,
    reviews: 0,
    sales_count: 0,
    stock: 200
  },
  {
    id: 5,
    name: "Wireless Charging Pad",
    slug: "wireless-charging-pad",
    category: "accessories",
    price: 1709,
    image_url: "assets/default-tech-placeholder.svg",
    description: "Fast 15W wireless charging pad compatible with all Qi devices.",
    rating: 0,
    reviews: 0,
    sales_count: 0,
    stock: 150
  },
  {
    id: 6,
    name: "Premium Bluetooth Speaker",
    slug: "premium-bluetooth-speaker",
    category: "electronics",
    price: 8549,
    image_url: "assets/default-tech-placeholder.svg",
    description: "Waterproof portable speaker with 12-hour battery and superior sound quality.",
    rating: 0,
    reviews: 0,
    sales_count: 0,
    stock: 80
  },
  {
    id: 7,
    name: "Fitness Tracker Band",
    slug: "fitness-tracker-band",
    category: "wearables",
    price: 4559,
    image_url: "assets/default-tech-placeholder.svg",
    description: "Advanced fitness tracking with heart rate monitor and sleep analysis.",
    rating: 0,
    reviews: 0,
    sales_count: 0,
    stock: 120
  },
  {
    id: 8,
    name: "USB-C Lightning Cable 3-Pack",
    slug: "usb-c-lightning-cable",
    category: "accessories",
    price: 1424,
    image_url: "assets/default-tech-placeholder.svg",
    description: "Durable fast-charging cables with lifetime warranty.",
    rating: 0,
    reviews: 0,
    sales_count: 0,
    stock: 300
  }
];

let products = database.syncProducts(seedProducts).filter(product => product.active !== false);

const categories = [
  { id: 1, name: "Electronics", slug: "electronics" },
  { id: 2, name: "Wearables", slug: "wearables" },
  { id: 3, name: "Accessories", slug: "accessories" }
];
