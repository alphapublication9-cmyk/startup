import { idbGet, idbSet } from './indexedDBStorage';
import { getSupabase } from './supabaseClient';

const PRODUCT_ANALYTICS_KEY = 'aura_kurti_product_analytics_v2';

/**
 * Gets all product analytics from memory/storage
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
 * Track an interaction on a product
 * @param {string|number} productId 
 * @param {object} product - optional product info (name, category, price, image)
 * @param {'view'|'quick_view'|'cart_add'|'order'} actionType 
 */
export const trackProductAction = (productId, product = {}, actionType = 'view') => {
  if (!productId) return;
  const pId = String(productId);
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
    existing.views = (existing.views || 0) + 1; // Quick view also counts as product view
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
 * Get summary stats across all products
 */
export const getProductAnalyticsList = (allProducts = []) => {
  const analyticsMap = getStoredProductAnalytics();
  
  // Combine all products from catalog with analytics stats
  const combined = allProducts.map(p => {
    const pId = String(p.id);
    const stat = analyticsMap[pId] || {};
    const views = Number(stat.views || 0);
    const quickViews = Number(stat.quickViews || 0);
    const cartAdds = Number(stat.cartAdds || 0);
    const orders = Number(stat.orders || 0);
    
    // Calculate conversion rate %
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
