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
import { applyEnvSettingsOverrides } from '../data/initialSettings';
import { getSpinWheelConfig, fetchCloudSpinWheelConfig, saveSpinWheelConfig } from './spinWheel';
import { getLuckyDrawConfig, fetchCloudLuckyDrawConfig, saveLuckyDrawConfig } from './luckyDraw';


/**
 * 1. PRODUCTS
 */
const mapProductToRow = (p) => ({
  id: String(p.id),
  name: p.name,
  category: p.category,
  price: p.price,
  original_price: p.originalPrice || null,
  image: p.image,
  images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
  sizes: Array.isArray(p.sizes) ? p.sizes : ['S', 'M', 'L', 'XL'],
  fabric: p.fabric || null,
  color: p.color || null,
  badge: p.badge || null,
  offer: p.offer || null,
  in_stock: p.inStock !== false,
  rating: p.rating || 4.9,
  reviews_count: p.reviewsCount || 42,
  description: p.description || null
});

const mapRowToProduct = (item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  price: Number(item.price),
  originalPrice: item.original_price ? Number(item.original_price) : undefined,
  image: item.image,
  images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []),
  sizes: Array.isArray(item.sizes) ? item.sizes : ['S', 'M', 'L', 'XL'],
  fabric: item.fabric || '',
  color: item.color || '',
  badge: item.badge || '',
  offer: item.offer || '',
  inStock: item.in_stock !== false,
  rating: Number(item.rating || 4.9),
  reviewsCount: Number(item.reviews_count || 42),
  description: item.description || ''
});

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
      const mapped = data.map(mapRowToProduct);
      saveStoredProducts(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Cloud products load error:", err);
  }

  return getStoredProducts();
};

/**
 * Saves or updates a SINGLE product directly to Supabase cloud immediately
 */
export const saveCloudProduct = async (product) => {
  if (!product || !product.id) return;
  const currentProds = getStoredProducts();
  const exists = currentProds.some(p => p.id === product.id);
  const updatedProds = exists 
    ? currentProds.map(p => p.id === product.id ? product : p)
    : [product, ...currentProds];

  saveStoredProducts(updatedProds);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const row = mapProductToRow(product);
    const { error } = await supabase.from('products').upsert([row], { onConflict: 'id' });
    if (error) {
      console.error("Failed to save product to Supabase:", error.message);
    }
  } catch (err) {
    console.error("Error saving product to Supabase:", err);
  }
};

/**
 * Deletes a SINGLE product from Supabase cloud immediately
 */
export const deleteCloudProduct = async (productId) => {
  if (!productId) return;
  const currentProds = getStoredProducts();
  const updated = currentProds.filter(p => String(p.id) !== String(productId));
  saveStoredProducts(updated);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('products').delete().eq('id', String(productId));
  } catch (err) {
    console.error("Error deleting cloud product:", err);
  }
};

export const syncCloudProducts = async (products) => {
  if (!Array.isArray(products)) return;
  saveStoredProducts(products);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const rows = products.map(mapProductToRow);
    const CHUNK_SIZE = 4;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('products')
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        for (const singleRow of chunk) {
          try {
            await supabase.from('products').upsert([singleRow], { onConflict: 'id' });
          } catch (rowErr) {
            console.error("Failed to upsert product row:", singleRow.id, rowErr);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error syncing products to Supabase:", err);
  }
};

/**
 * 2. CATEGORIES
 */
const mapCategoryToRow = (c) => ({
  id: String(c.id || c.name),
  name: c.name,
  icon: c.icon || '👗',
  image: c.image || null,
  offer: c.offer || null,
  description: c.description || null
});

const mapRowToCategory = (c) => ({
  id: c.id,
  name: c.name,
  icon: c.icon || '👗',
  image: c.image || '',
  offer: c.offer || 'Up to 50% OFF',
  description: c.description || ''
});

export const fetchCloudCategories = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredCategories();

  try {
    const { data, error } = await supabase.from('categories').select('*');
    if (!error && data && data.length > 0) {
      const mapped = data.map(mapRowToCategory);
      saveStoredCategories(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Cloud categories load error:", err);
  }

  return getStoredCategories();
};

export const saveCloudCategory = async (category) => {
  if (!category) return;
  const currentCats = getStoredCategories();
  const cName = typeof category === 'string' ? category : category.name;
  const exists = currentCats.some(c => (c.id && c.id === category.id) || (typeof c === 'string' ? c === cName : c.name === cName));
  const updatedCats = exists
    ? currentCats.map(c => ((c.id && c.id === category.id) || (typeof c === 'string' ? c === cName : c.name === cName)) ? category : c)
    : [...currentCats, category];

  saveStoredCategories(updatedCats);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('categories').upsert([mapCategoryToRow(category)], { onConflict: 'id' });
  } catch (err) {
    console.error("Error saving category to cloud:", err);
  }
};

export const deleteCloudCategory = async (categoryId, categoryName) => {
  const currentCats = getStoredCategories();
  const updated = currentCats.filter(c => {
    const name = typeof c === 'string' ? c : c.name;
    return c.id !== categoryId && name !== categoryName;
  });
  saveStoredCategories(updated);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    if (categoryId) {
      await supabase.from('categories').delete().eq('id', String(categoryId));
    }
    if (categoryName) {
      await supabase.from('categories').delete().eq('name', categoryName);
    }
  } catch (err) {
    console.error("Error deleting category from cloud:", err);
  }
};

export const syncCloudCategories = async (categories) => {
  if (!Array.isArray(categories)) return;
  saveStoredCategories(categories);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const rows = categories.map(mapCategoryToRow);
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

    if (!error && data && data.data) {
      const mergedSettings = applyEnvSettingsOverrides(data.data);
      saveStoredSettings(mergedSettings);
      return mergedSettings;
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
const mapCouponToRow = (c) => ({
  id: String(c.id || c.code),
  code: c.code,
  discount_type: c.discountType || c.discount_type,
  discount_value: Number(c.discountValue || c.discount_value || 0),
  min_order_amount: Number(c.minOrderAmount || c.min_order_amount || 0),
  description: c.description || null,
  is_active: c.isActive !== false && c.is_active !== false
});

const mapRowToCoupon = (c) => ({
  id: c.id,
  code: c.code,
  discountType: c.discount_type,
  discountValue: Number(c.discount_value),
  minOrderAmount: Number(c.min_order_amount || 0),
  description: c.description || '',
  isActive: c.is_active !== false
});

export const fetchCloudCoupons = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredCoupons();

  try {
    const { data, error } = await supabase.from('coupons').select('*');
    if (!error && data && data.length > 0) {
      const mapped = data.map(mapRowToCoupon);
      saveStoredCoupons(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Cloud coupons load error:", err);
  }
  return getStoredCoupons();
};

export const saveCloudCoupon = async (coupon) => {
  if (!coupon || !coupon.code) return;
  const current = getStoredCoupons();
  const updated = [coupon, ...current.filter(c => c.code !== coupon.code)];
  saveStoredCoupons(updated);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('coupons').upsert([mapCouponToRow(coupon)], { onConflict: 'id' });
  } catch (err) {
    console.error("Error saving coupon to cloud:", err);
  }
};

export const deleteCloudCoupon = async (code) => {
  const current = getStoredCoupons();
  const updated = current.filter(c => c.code !== code);
  saveStoredCoupons(updated);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('coupons').delete().eq('code', code);
  } catch (err) {
    console.error("Error deleting coupon from cloud:", err);
  }
};

export const syncCloudCoupons = async (coupons) => {
  if (!Array.isArray(coupons)) return;
  saveStoredCoupons(coupons);
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const rows = coupons.map(mapCouponToRow);
    await supabase.from('coupons').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.error("Error syncing coupons:", err);
  }
};

/**
 * 5. REVIEWS
 */
const mapReviewToRow = (r) => ({
  id: String(r.id),
  name: r.name,
  city: r.city || '',
  rating: Number(r.rating || 5),
  date: r.date || 'Recent',
  product_name: r.productName || r.product_name || '',
  comment: r.comment || '',
  verified_buyer: r.verifiedBuyer !== false && r.verified_buyer !== false
});

const mapRowToReview = (r) => ({
  id: r.id,
  name: r.name,
  city: r.city,
  rating: Number(r.rating || 5),
  date: r.date || 'Recent',
  productName: r.product_name,
  comment: r.comment,
  verifiedBuyer: r.verified_buyer !== false
});

export const fetchCloudReviews = async () => {
  const supabase = getSupabase();
  if (!supabase) return getStoredReviews();

  try {
    const { data, error } = await supabase.from('reviews').select('*');
    if (!error && data && data.length > 0) {
      const mapped = data.map(mapRowToReview);
      saveStoredReviews(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Cloud reviews load error:", err);
  }
  return getStoredReviews();
};

export const saveCloudReview = async (review) => {
  if (!review || !review.id) return;
  const current = getStoredReviews();
  const updated = [review, ...current.filter(r => r.id !== review.id)];
  saveStoredReviews(updated);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('reviews').upsert([mapReviewToRow(review)], { onConflict: 'id' });
  } catch (err) {
    console.error("Error saving review to cloud:", err);
  }
};

export const deleteCloudReview = async (id) => {
  const current = getStoredReviews();
  const updated = current.filter(r => r.id !== id);
  saveStoredReviews(updated);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('reviews').delete().eq('id', String(id));
  } catch (err) {
    console.error("Error deleting review from cloud:", err);
  }
};

export const syncCloudReviews = async (reviews) => {
  if (!Array.isArray(reviews)) return;
  saveStoredReviews(reviews);
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const rows = reviews.map(mapReviewToRow);
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
        totalAmount: Number(o.grand_total || 0),
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
  if (!order || !order.id) return;
  saveLocalOrder(order);
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('orders').upsert([{
      id: order.id,
      customer: order.customer || {},
      items: order.items || [],
      grand_total: Number(order.totalAmount || order.grandTotal || 0),
      status: order.status || 'Received',
      created_at: order.createdAt || new Date().toISOString()
    }], { onConflict: 'id' });
  } catch (err) {
    console.error("Error saving cloud order:", err);
  }
};

export const deleteCloudOrder = async (orderId) => {
  if (!orderId) return;
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('orders').delete().eq('id', String(orderId));
  } catch (err) {
    console.error("Error deleting cloud order:", err);
  }
};

export const updateCloudOrderStatus = async (orderId, newStatus) => {
  if (!orderId || !newStatus) return;
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('orders').update({ status: newStatus }).eq('id', String(orderId));
  } catch (err) {
    console.error("Error updating cloud order status:", err);
  }
};

/**
 * 7. REALTIME LIVE SYNC
 * Automatically updates connected devices whenever changes happen in Supabase
 */
export const subscribeToCloudChanges = (callbacks = {}) => {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        if (callbacks.onProductsChange) {
          const fresh = await fetchCloudProducts();
          callbacks.onProductsChange(fresh);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        if (callbacks.onCategoriesChange) {
          const fresh = await fetchCloudCategories();
          callbacks.onCategoriesChange(fresh);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, async (payload) => {
        const changedId = payload?.new?.id || payload?.old?.id;
        if (changedId === 'spin_wheel_config' && callbacks.onSpinWheelConfigChange) {
          const freshSpin = await fetchCloudSpinWheelConfig();
          callbacks.onSpinWheelConfigChange(freshSpin);
        } else if (changedId === 'lucky_draw_config' && callbacks.onLuckyDrawConfigChange) {
          const freshDraw = await fetchCloudLuckyDrawConfig();
          callbacks.onLuckyDrawConfigChange(freshDraw);
        } else if (callbacks.onSettingsChange) {
          const fresh = await fetchCloudSettings();
          callbacks.onSettingsChange(fresh);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, async () => {
        if (callbacks.onCouponsChange) {
          const fresh = await fetchCloudCoupons();
          callbacks.onCouponsChange(fresh);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, async () => {
        if (callbacks.onReviewsChange) {
          const fresh = await fetchCloudReviews();
          callbacks.onReviewsChange(fresh);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        if (callbacks.onOrdersChange) {
          const fresh = await fetchCloudOrders();
          callbacks.onOrdersChange(fresh);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Realtime subscription notice:", err);
    return () => {};
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
    const spinConfig = getSpinWheelConfig();
    const luckyConfig = getLuckyDrawConfig();

    await syncCloudProducts(products);
    await syncCloudCategories(categories);
    await syncCloudSettings(settings);
    await syncCloudCoupons(coupons);
    await syncCloudReviews(reviews);
    await saveSpinWheelConfig(spinConfig);
    await saveLuckyDrawConfig(luckyConfig);

    return { 
      success: true, 
      message: `Successfully synced ${products.length} products, ${categories.length} categories, Spin Wheel Studio, Lucky Draw, settings, coupons & reviews to Supabase Cloud!` 
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

-- 8. Customer Leads / Directory Table
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Product Engagement & View Analytics Table
CREATE TABLE IF NOT EXISTS public.analytics (
  product_id TEXT PRIMARY KEY,
  views INTEGER DEFAULT 0,
  quick_views INTEGER DEFAULT 0,
  cart_adds INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  name TEXT,
  category TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Enable Row Level Security (RLS) and Public Read/Write Access
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Allow public read on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all on customers" ON public.customers;
CREATE POLICY "Allow public read on customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow all on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on analytics" ON public.analytics;
DROP POLICY IF EXISTS "Allow all on analytics" ON public.analytics;
CREATE POLICY "Allow public read on analytics" ON public.analytics FOR SELECT USING (true);
CREATE POLICY "Allow all on analytics" ON public.analytics FOR ALL USING (true) WITH CHECK (true);
`;
