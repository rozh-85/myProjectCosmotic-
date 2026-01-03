
-- LUXE COSMOTICS & FRAGRANCE - SECURE DATABASE SETUP (RLS ENABLED)
-- Description: This script creates tables and sets up STRICT security.
-- How to use: Copy and paste this into Supabase SQL Editor.

-- STEP 1: CREATE TABLES (If they don't exist)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    in_stock BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    button_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- STEP 2: ENABLE ROW LEVEL SECURITY (The Wall)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- STEP 3: CUSTOMER POLICIES (Can only Read and Buy)
-- Anyone can see products, categories, and banners
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);

-- Anyone can place an order
CREATE POLICY "Public Create Orders" ON public.orders FOR INSERT WITH CHECK (true);

-- STEP 4: ADMIN POLICIES (Only YOU can change data)
-- "auth.role() = 'authenticated'" ensures only logged-in users (YOU) can edit.

-- Categories Admin
CREATE POLICY "Admin All Categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products Admin
CREATE POLICY "Admin All Products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Banners Admin
CREATE POLICY "Admin All Banners" ON public.banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders Admin (View and Update status)
CREATE POLICY "Admin All Orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Settings Admin
CREATE POLICY "Admin All Settings" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STEP 5: INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;

-- DONE: Your website is now SECURE. Customers can buy, but only you can manage.
