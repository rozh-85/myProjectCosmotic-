
# Luxe Cosmetics - E-commerce Platform

A comprehensive, high-end beauty e-commerce management system and storefront. This project features a robust admin panel for inventory and order management, paired with a modern, responsive storefront for a premium shopping experience.
## 🚀 Features
### Admin Panel
- **Dashboard**: Real-time overview of products, categories, and order status.
- **Product Management**: Full CRUD operations for products, including support for multiple images and variants (colors, sizes, etc.).
- **Category Management**: Organize products into categories with visibility toggles.
- **Order Tracking**: Manage customer orders and update shipping status.
- **Banner Management**: Customize the storefront's hero sections and promotional banners.
- **Settings**: Global store configuration and branding.

### Storefront
- **Responsive Design**: Optimized for both mobile and desktop users.
- **Product Details**: Deep-dive into product specifics with variant selection (e.g., shades, sizes).
- **Shopping Cart**: Seamless add-to-cart experience with persistent storage.
- **Direct Ordering**: Quick checkout process for customers.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Routing**: React Router 7

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Supabase account and project

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd LuxeCosmotic
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**:
   Run the provided `setup_database.sql` script in your Supabase SQL Editor to create the necessary tables and schema.

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📄 License

This project is licensed under the MIT License.

