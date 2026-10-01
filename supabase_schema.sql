-- ==========================================
-- SUPABASE SCHEMA FOR AURA / RADHIKA KURTI
-- Copy and paste this in Supabase SQL Editor
-- ==========================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    image TEXT,
    offer TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
    fabric TEXT,
    color TEXT,
    badge TEXT,
    offer TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    rating NUMERIC DEFAULT 4.9,
    reviews_count INTEGER DEFAULT 42,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT,
    rating NUMERIC DEFAULT 5,
    date TEXT,
    product_name TEXT,
    comment TEXT,
    verified_buyer BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_city TEXT,
    customer_pincode TEXT,
    customer_notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC,
    discount NUMERIC DEFAULT 0,
    total NUMERIC,
    status TEXT DEFAULT 'Pending WhatsApp Confirmation',
    order_channel TEXT DEFAULT 'whatsapp',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS) & ALLOW PUBLIC ACCESS FOR DEMO / ANON
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
