import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { 
  getStoredProducts, 
  saveStoredProducts, 
  getStoredCategories, 
  saveStoredCategories, 
  getStoredSettings, 
  saveStoredSettings,
  getStoredCoupons,
  saveStoredCoupons,
  getStoredReviews,
  saveStoredReviews,
  getStoredOrders,
  saveNewOrder as saveLocalOrder
} from './storage';

/**
 * 1. PRODUCTS
 */
export const fetchCloudProducts = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredProducts();

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn("Supabase products fetch failed, falling back to local storage:", error?.message);
      return getStoredProducts();
    }

    if (data.length > 0) {
      // Map columns from snake_case to camelCase
      const mapped = data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: Number(item.price),
        originalPrice: item.original_price ? Number(item.original_price) : undefined,
        image: item.image,
        images: Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []),
        sizes: Array.isArray(item.sizes) ? item.sizes : ['S', 'M', 'L', 'XL'],
        fabric: item.fabric || '',
        color: item.color || '',
        badge: item.badge || '',
        offer: item.offer || '',
        inStock: item.in_stock !== false,
        rating: Number(item.rating || 4.9),
        reviewsCount: Number(item.reviews_count || 42),
        description: item.description || ''
      }));

      // Cache locally for offline/fast boot
      saveStoredProducts(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Cloud products load error:", err);
  }

  return getStoredProducts();
};

export const syncCloudProducts = async (products) => {
  saveStoredProducts(products); // Always save locally first

  const supabase = getSupabase();
  if (!supabase || !Array.isArray(products)) return;

  try {
    const rows = products.map(p => ({
      id: String(p.id),
      name: p.name,
      category: p.category,
      price: p.price,
      original_price: p.originalPrice || null,
      image: p.image,
      images: p.images || [p.image],
      sizes: p.sizes || ['S', 'M', 'L', 'XL'],
      fabric: p.fabric || null,
      color: p.color || null,
      badge: p.badge || null,
      offer: p.offer || null,
      in_stock: p.inStock !== false,
      rating: p.rating || 4.9,
      reviews_count: p.reviewsCount || 42,
      description: p.description || null
    }));

    const { error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error("Failed to upsert products to Supabase:", error);
    }
  } catch (err) {
    console.error("Error syncing products to Supabase:", err);
  }
};

export const deleteCloudProduct = async (productId) => {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('products').delete().eq('id', String(productId));
  } catch (err) {
    console.error("Error deleting cloud product:", err);
  }
};

/**
 * 2. CATEGORIES
 */
export const fetchCloudCategories = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredCategories();

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error || !data) {
      return getStoredCategories();
    }

    if (data.length > 0) {
      const mapped = data.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || '👗',
        image: c.image || '',
        offer: c.offer || 'Up to 50% OFF',
        description: c.description || ''
      }));
      saveStoredCategories(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Cloud categories load error:", err);
  }

  return getStoredCategories();
};

export const syncCloudCategories = async (categories) => {
  saveStoredCategories(categories);

  const supabase = getSupabase();
  if (!supabase || !Array.isArray(categories)) return;

  try {
    const rows = categories.map(c => ({
      id: String(c.id || c.name),
      name: c.name,
      icon: c.icon || '👗',
      image: c.image || null,
      offer: c.offer || null,
      description: c.description || null
    }));

    await supabase.from('categories').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.error("Error syncing categories to Supabase:", err);
  }
};

/**
 * 3. SETTINGS
 */
export const fetchCloudSettings = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredSettings();

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'store_config')
      .single();

    if (error || !data) {
      return getStoredSettings();
    }

    if (data && data.data) {
      saveStoredSettings(data.data);
      return data.data;
    }
  } catch (err) {
    console.error("Cloud settings load error:", err);
  }

  return getStoredSettings();
};

export const syncCloudSettings = async (settings) => {
  saveStoredSettings(settings);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('settings').upsert({
      id: 'store_config',
      data: settings,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err) {
    console.error("Error syncing settings to Supabase:", err);
  }
};

/**
 * 4. COUPONS
 */
export const fetchCloudCoupons = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredCoupons();

  try {
    const { data, error } = await supabase.from('coupons').select('*');
    if (!error && data && data.length > 0) {
      const mapped = data.map(c => ({
        id: c.id,
        code: c.code,
        discountType: c.discount_type,
        discountValue: Number(c.discount_value),
        minOrderAmount: Number(c.min_order_amount || 0),
        description: c.description || '',
        isActive: c.is_active !== false
      }));
      saveStoredCoupons(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Cloud coupons load error:", err);
  }
  return getStoredCoupons();
};

export const syncCloudCoupons = async (coupons) => {
  saveStoredCoupons(coupons);
  const supabase = getSupabase();
  if (!supabase || !Array.isArray(coupons)) return;

  try {
    const rows = coupons.map(c => ({
      id: String(c.id || c.code),
      code: c.code,
      discount_type: c.discountType,
      discount_value: c.discountValue,
      min_order_amount: c.minOrderAmount || 0,
      description: c.description || null,
      is_active: c.isActive !== false
    }));
    await supabase.from('coupons').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.error("Error syncing coupons:", err);
  }
};

/**
 * 5. REVIEWS
 */
export const fetchCloudReviews = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredReviews();

  try {
    const { data, error } = await supabase.from('reviews').select('*');
    if (!error && data && data.length > 0) {
      const mapped = data.map(r => ({
        id: r.id,
        name: r.name,
        city: r.city,
        rating: Number(r.rating || 5),
        date: r.date || 'Recent',
        productName: r.product_name,
        comment: r.comment,
        verifiedBuyer: r.verified_buyer !== false
      }));
      saveStoredReviews(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Cloud reviews load error:", err);
  }
  return getStoredReviews();
};

export const syncCloudReviews = async (reviews) => {
  saveStoredReviews(reviews);
  const supabase = getSupabase();
  if (!supabase || !Array.isArray(reviews)) return;

  try {
    const rows = reviews.map(r => ({
      id: String(r.id),
      name: r.name,
      city: r.city || '',
      rating: r.rating || 5,
      date: r.date || 'Recent',
      product_name: r.productName || '',
      comment: r.comment || '',
      verified_buyer: r.verifiedBuyer !== false
    }));
    await supabase.from('reviews').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.error("Error syncing reviews:", err);
  }
};

/**
 * 6. ORDERS
 */
export const fetchCloudOrders = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredOrders();

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped = data.map(o => ({
        id: o.id,
        customer: o.customer || {},
        items: o.items || [],
        grandTotal: Number(o.grand_total || 0),
        status: o.status || 'Received',
        createdAt: o.created_at
      }));
      return mapped;
    }
  } catch (err) {
    console.error("Cloud orders load error:", err);
  }
  return getStoredOrders();
};

export const recordCloudOrder = async (order) => {
  saveLocalOrder(order);
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('orders').insert({
      id: order.id,
      customer: order.customer,
      items: order.items,
      grand_total: order.grandTotal,
      status: order.status || 'Received',
      created_at: order.createdAt || new Date().toISOString()
    });
  } catch (err) {
    console.error("Error saving cloud order:", err);
  }
};

/**
 * Push all local data into Supabase Cloud Database with 1-click
 */
export const pushAllDataToSupabase = async () => {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase is not configured yet.' };
  }

  try {
    const products = getStoredProducts();
    const categories = getStoredCategories();
    const settings = getStoredSettings();
    const coupons = getStoredCoupons();
    const reviews = getStoredReviews();

    await syncCloudProducts(products);
    await syncCloudCategories(categories);
    await syncCloudSettings(settings);
    await syncCloudCoupons(coupons);
    await syncCloudReviews(reviews);

    return { 
      success: true, 
      message: `Successfully synced ${products.length} products, ${categories.length} categories, settings, coupons and reviews to Supabase Cloud!` 
    };
  } catch (err) {
    return { success: false, message: err.message || 'Failed to sync data to cloud.' };
  }
};

/**
 * Quick SQL setup script for user to copy-paste into Supabase SQL editor
 */
export const SUPABASE_SQL_SCHEMA = `-- 1. Enable UUID Extension (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '["S","M","L","XL"]'::jsonb,
  fabric TEXT,
  color TEXT,
  badge TEXT,
  offer TEXT,
  in_stock BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 42,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '👗',
  image TEXT,
  offer TEXT,
  description TEXT
);

-- 4. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  rating NUMERIC DEFAULT 5,
  date TEXT,
  product_name TEXT,
  comment TEXT,
  verified_buyer BOOLEAN DEFAULT true
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer JSONB,
  items JSONB,
  grand_total NUMERIC,
  status TEXT DEFAULT 'Received',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Enable Row Level Security (RLS) and Public Read/Write Access
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
DROP POLICY IF EXISTS "Allow all on products" ON public.products;
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all on categories" ON public.categories;
CREATE POLICY "Allow public read on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
CREATE POLICY "Allow public read on settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow all on coupons" ON public.coupons;
CREATE POLICY "Allow public read on coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow all on coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow all on reviews" ON public.reviews;
CREATE POLICY "Allow public read on reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow all on reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;
CREATE POLICY "Allow public read on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
`;
