import { idbGet, idbSet } from './indexedDBStorage';
import { getSupabase } from './supabaseClient';

const PRODUCT_ANALYTICS_KEY = 'aura_kurti_product_analytics_v2';
// Per-session throttle: same product view counted max once per 5 minutes
const _viewThrottle = {};

/**
 * Gets all product analytics from localStorage
 */
export const getStoredProductAnalytics = () => {
  try {
    const raw = localStorage.getItem(PRODUCT_ANALYTICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch (e) {
    console.error("Failed to load product analytics", e);
  }
  return {};
};

/**
 * Saves analytics data to LocalStorage and IndexedDB
 */
export const saveStoredProductAnalytics = (data) => {
  try {
    localStorage.setItem(PRODUCT_ANALYTICS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Analytics localStorage quota exceeded", e);
  }
  idbSet(PRODUCT_ANALYTICS_KEY, data);
};

/**
 * Fetch analytics from Supabase and merge into localStorage
 * Returns merged map
 */
export const fetchAndMergeCloudAnalytics = async () => {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStoredProductAnalytics();

    const { data, error } = await supabase
      .from('analytics')
      .select('product_id, views, quick_views, cart_adds, orders, name, category, updated_at');

    if (error || !data) return getStoredProductAnalytics();

    const local = getStoredProductAnalytics();

    // Merge: take MAX of local vs cloud for each counter (prevents reset on other device)
    for (const row of data) {
      const pId = String(row.product_id);
      const localStat = local[pId] || {};
      local[pId] = {
        ...localStat,
        id: pId,
        name: row.name || localStat.name || '',
        category: row.category || localStat.category || '',
        views: Math.max(Number(localStat.views || 0), Number(row.views || 0)),
        quickViews: Math.max(Number(localStat.quickViews || 0), Number(row.quick_views || 0)),
        cartAdds: Math.max(Number(localStat.cartAdds || 0), Number(row.cart_adds || 0)),
        orders: Math.max(Number(localStat.orders || 0), Number(row.orders || 0)),
        lastActionAt: localStat.lastActionAt || row.updated_at || null,
        history: localStat.history || []
      };
    }

    saveStoredProductAnalytics(local);
    return local;
  } catch (e) {
    console.error("Failed to fetch cloud analytics", e);
    return getStoredProductAnalytics();
  }
};

/**
 * Track an interaction on a product
 * @param {string|number} productId 
 * @param {object} product - optional product info (name, category, price, image)
 * @param {'view'|'quick_view'|'cart_add'|'order'} actionType 
 */
export const trackProductAction = (productId, product = {}, actionType = 'view') => {
  if (!productId) return;
  const pId = String(productId);

  // Throttle: 'view' and 'quick_view' — max once per 5 min per product per session
  if (actionType === 'view' || actionType === 'quick_view') {
    const now = Date.now();
    const lastTime = _viewThrottle[pId] || 0;
    if (now - lastTime < 5 * 60 * 1000) return; // 5 minutes throttle
    _viewThrottle[pId] = now;
  }

  const current = getStoredProductAnalytics();
  const existing = current[pId] || {
    id: pId,
    name: product.name || 'Product ' + pId,
    category: product.category || 'Apparel',
    image: product.image || '',
    price: product.price || 0,
    views: 0,
    quickViews: 0,
    cartAdds: 0,
    orders: 0,
    lastActionAt: new Date().toISOString(),
    history: []
  };

  if (actionType === 'view') {
    existing.views = (existing.views || 0) + 1;
  } else if (actionType === 'quick_view') {
    existing.quickViews = (existing.quickViews || 0) + 1;
    existing.views = (existing.views || 0) + 1; // quick_view counts as a view too
  } else if (actionType === 'cart_add') {
    existing.cartAdds = (existing.cartAdds || 0) + 1;
  } else if (actionType === 'order') {
    existing.orders = (existing.orders || 0) + 1;
  }

  // Update metadata
  if (product.name) existing.name = product.name;
  if (product.category) existing.category = product.category;
  if (product.image) existing.image = product.image;
  if (product.price) existing.price = product.price;
  existing.lastActionAt = new Date().toISOString();

  // Keep last 20 timestamps for recent timeline
  existing.history = [
    { type: actionType, time: new Date().toISOString() },
    ...(existing.history || []).slice(0, 19)
  ];

  current[pId] = existing;
  saveStoredProductAnalytics(current);

  // Background Cloud Sync
  try {
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('analytics').upsert({
        product_id: pId,
        views: existing.views,
        quick_views: existing.quickViews,
        cart_adds: existing.cartAdds,
        orders: existing.orders,
        name: existing.name,
        category: existing.category,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id' }).catch(() => {});
    }
  } catch {}
};

/**
 * Get summary stats across all products (from localStorage)
 */
export const getProductAnalyticsList = (allProducts = []) => {
  const analyticsMap = getStoredProductAnalytics();
  
  const combined = allProducts.map(p => {
    const pId = String(p.id);
    const stat = analyticsMap[pId] || {};
    const views = Number(stat.views || 0);
    const quickViews = Number(stat.quickViews || 0);
    const cartAdds = Number(stat.cartAdds || 0);
    const orders = Number(stat.orders || 0);
    
    const conversionRate = views > 0 ? ((orders / views) * 100).toFixed(1) : '0.0';
    const cartRate = views > 0 ? ((cartAdds / views) * 100).toFixed(1) : '0.0';

    return {
      id: pId,
      name: p.name,
      category: p.category,
      price: p.price,
      image: p.image || (Array.isArray(p.images) ? p.images[0] : ''),
      views,
      quickViews,
      cartAdds,
      orders,
      conversionRate: parseFloat(conversionRate),
      cartRate: parseFloat(cartRate),
      lastActionAt: stat.lastActionAt || null,
      history: stat.history || []
    };
  });

  return combined;
};

/**
 * Reset all analytics
 */
export const resetProductAnalytics = () => {
  localStorage.removeItem(PRODUCT_ANALYTICS_KEY);
  idbSet(PRODUCT_ANALYTICS_KEY, {});
};
