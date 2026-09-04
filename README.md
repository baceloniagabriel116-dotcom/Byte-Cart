# Byte Cart - E-Commerce Platform

A professional, fully-functional e-commerce website built with HTML, CSS, and JavaScript. No installation required!

## 🎯 Features

### ✅ Product Browsing
- Browse all products with high-quality images
- Filter by category (Electronics, Wearables, Accessories)
- Filter by price range
- Filter by rating
- Sort products (price, rating, newest)
- Detailed product pages with related items
- Product reviews and ratings

### 🛒 Shopping Cart
- Add items to cart (persists via local storage)
- Update item quantities
- Remove items
- Real-time cart count in navbar
- Cart summary with total calculations

### 🔐 Authentication System
- User registration with email/password
- User login with session persistence
- User profile management
- **Auth wall at checkout** - users must login to complete purchase
- Demo account for testing (demo@example.com / demo123)

### 💳 Checkout & Orders
- Shipping address form
- Payment method selection (demo mode)
- Order summary with itemized costs
- Tax calculation (10%)
- Free shipping
- Order confirmation page
- Order history in account

### 👤 User Account
- Profile information
- Order history with status tracking
- View order details
- Account settings
- Logout functionality

## 🌐 Deploy to GitHub Pages

This is a static HTML/CSS/JavaScript site, so it can be hosted free on GitHub Pages. A deployment workflow is included at `.github/workflows/deploy-pages.yml`.

1. Install Git from https://git-scm.com/downloads.
2. Create a new GitHub repository, for example `byte-cart`.
3. In this project folder, run:

```powershell
git init
git add .
git commit -m "Initial Byte Cart website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/byte-cart.git
git push -u origin main
```

4. On GitHub, open **Settings > Pages**.
5. Set **Source** to **GitHub Actions**.
6. Open the **Actions** tab and wait for `Deploy Byte Cart to GitHub Pages` to finish.
7. Your site will be available at:

```text
https://YOUR_USERNAME.github.io/byte-cart/
```

Do not commit Supabase service-role keys. The browser site may contain only the public anon key, protected by RLS policies.

### 🎨 UI/UX Design
- Professional, modern design
- Responsive mobile-friendly layout
- Smooth transitions and animations
- Accessibility-focused
- Consistent color scheme (blue primary)
- Clear call-to-action buttons

## 🚀 Quick Start

1. **Open the website:**
   - Simply open `index.html` in your web browser
   - No server or build process needed!

2. **Browse products:**
   - Click "Shop Now" or navigate to Products
   - Use filters and sorting to find items

3. **Add to cart:**
   - Click "Add" on any product
   - View cart from the shopping cart icon

4. **Checkout:**
   - Click "Proceed to Checkout" in cart
   - If not logged in, you'll be prompted to login
   - Complete shipping form
   - View order confirmation

5. **Login/Register:**
   - Click "Login" or "Register" in navbar
   - Use demo account: `demo@example.com` / `demo123`
   - Or create your own account

6. **View Account:**
   - Click username in top right after login
   - View order history and profile

## 📁 File Structure

```
IT-ELECTIVE/
├── index.html              # Home page
├── products.html           # Product listing with filters
├── product.html            # Product detail page
├── cart.html              # Shopping cart
├── checkout.html          # Checkout with auth wall ⭐
├── login.html             # Login & register forms
├── account.html           # User profile & orders
├── success.html           # Order confirmation
├── admin.html             # Role-guarded inventory and sales dashboard
│
├── css/
│   └── styles.css         # All styling
│
├── js/
│   ├── app.js             # Main app logic
│   ├── auth.js            # Authentication system
│   ├── cart.js             # Cart, transactions, and verified reviews
│   └── database.js         # Shared browser database adapter
│
└── data/
   ├── products.js         # Seed product records
   └── schema.sql          # Users, Products, Transactions, Reviews schema
```

## 🔑 Key Authentication Features

### Login/Register (`login.html`)
- Email validation
- Password confirmation
- Demo account available
- Error handling

### Checkout Auth Wall (`checkout.html`)
- ⭐ **Main feature:** Users MUST be logged in to checkout
- Redirects to login if not authenticated
- Returns to checkout after login
- Persists login session

### User Account (`account.html`)
- Protected page (requires login)
- View profile information
- Order history with status
- Account settings

## 💾 Data Storage

The static prototype uses a shared browser database adapter backed by **localStorage**:
- `currentUser` - Currently logged in user
- `db-users` - Registered users with role and password hash fields
- `db-products` - Inventory synchronized between storefront and admin dashboard
- `db-transactions` - One row per purchased product and quantity
- `db-reviews` - Verified purchase reviews and star ratings
- `shopping-cart` - Current cart items
- `user-orders` - All placed orders

The normalized production schema is in `data/schema.sql`. Replace the adapter methods in `js/database.js` with API calls when connecting a real server database.

### Supabase setup

The app now includes an optional Supabase sync layer. To activate it:

1. Create a Supabase project and run `data/schema.sql` in the SQL Editor.
2. Open `js/supabase.js` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the values from Project Settings > API.
3. Reload the site. Product, user, transaction, and review records will sync in the background while local storage remains available as a fallback.

Do not place a Supabase service-role key in this site. For production authentication and secure transaction writes, migrate the current local authentication to Supabase Auth and keep the included RLS policies enabled.

**Note:** Data persists between sessions until browser cache is cleared.

## 🧪 Demo Account

**Email:** `demo@example.com`
**Password:** `demo123`

**Admin email:** `admin@example.com`  
**Admin password:** `admin123`

This account is auto-created on first visit. Use it to test the full checkout flow!

## 🛠️ Technical Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling:** Custom CSS (no frameworks needed)
- **Storage:** Browser localStorage
- **Images:** External image URLs (Unsplash)

## ✨ Features Included

✅ 8 sample products with realistic data
✅ Product filtering and sorting
✅ Shopping cart with persistence
✅ User authentication & profile
✅ Checkout process with shipping form
✅ Order confirmation & tracking
✅ Responsive mobile design
✅ Accessibility compliance
✅ Smooth animations and transitions
✅ Error handling and validation

## 🔒 Security Notes

⚠️ **For Demo Only:**
- Passwords are base64 encoded (NOT secure for production)
- No actual payment processing
- All data stored in browser (not backed up)

For production, you'd need:
- Secure backend server (Node.js, Django, etc.)
- Real database (PostgreSQL, MongoDB)
- HTTPS encryption
- Secure password hashing (bcrypt, argon2)
- Payment gateway integration (Stripe, PayPal)

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 🎨 Customization

### Change Colors
Edit `css/styles.css`:
```css
/* Primary color (blue) */
--primary: #2563eb;
```

### Add More Products
Edit `data/products.js`:
```javascript
{
  id: 9,
  name: "Your Product",
  category: "electronics",
  price: 99.99,
  image: "image-url.jpg",
  ...
}
```

### Modify Styling
All CSS is in `css/styles.css`. Easy to customize!

## 📝 Testing Checklist

- ✅ Browse products
- ✅ Filter by category
- ✅ Add to cart
- ✅ Update cart quantities
- ✅ Try checkout without login (auth wall)
- ✅ Register new account
- ✅ Login with demo account
- ✅ Complete checkout
- ✅ View order history
- ✅ Test on mobile

## 🚀 Next Steps

Want to upgrade to production?
1. Replace with Next.js + React
2. Add Node.js/Express backend
3. Set up PostgreSQL database
4. Integrate Stripe payments
5. Add email notifications
6. Deploy to Vercel/AWS

## 📧 Support

This is a demo e-commerce platform. For issues or questions, refer to the code comments or improve the codebase!

---

**Built with ❤️ as a professional e-commerce solution**
