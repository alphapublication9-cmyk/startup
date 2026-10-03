import { idbGet, idbSet } from './indexedDBStorage';
import { getSupabase } from './supabaseClient';

const PRODUCT_ANALYTICS_KEY = 'aura_kurti_product_analytics_v2';
// Per-session throttle: same product view counted max once per 45 seconds per session
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
 * Returns merged map with true aggregated counts
 */
export const fetchAndMergeCloudAnalytics = async () => {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStoredProductAnalytics();

    const { data, error } = await supabase
      .from('analytics')
      .select('product_id, views, quick_views, cart_adds, orders, name, category, updated_at');

    if (error || !data) {
      console.warn("Supabase analytics fetch error:", error?.message);
      return getStoredProductAnalytics();
    }

    const local = getStoredProductAnalytics();

    // Cloud is source of truth for cross-device aggregates
    for (const row of data) {
      const pId = String(row.product_id);
      const localStat = local[pId] || {};
      const cloudViews = Number(row.views || 0);
      const cloudQuickViews = Number(row.quick_views || 0);
      const cloudCartAdds = Number(row.cart_adds || 0);
      const cloudOrders = Number(row.orders || 0);

      local[pId] = {
        ...localStat,
        id: pId,
        name: row.name || localStat.name || '',
        category: row.category || localStat.category || '',
        views: Math.max(Number(localStat.views || 0), cloudViews),
        quickViews: Math.max(Number(localStat.quickViews || 0), cloudQuickViews),
        cartAdds: Math.max(Number(localStat.cartAdds || 0), cloudCartAdds),
        orders: Math.max(Number(localStat.orders || 0), cloudOrders),
        lastActionAt: row.updated_at || localStat.lastActionAt || null,
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
 * Increment cloud analytics count atomically on Supabase
 */
const syncIncrementToCloud = async (pId, product, actionType) => {
  const supabase = getSupabase();
  if (!supabase) return;

  const prodName = product.name || '';
  const prodCat = product.category || '';

  try {
    // 1. Try Supabase RPC 'increment_analytics' (if configured in Postgres)
    const { error: rpcError } = await supabase.rpc('increment_analytics', {
      p_product_id: pId,
      p_action: actionType,
      p_name: prodName,
      p_category: prodCat
    });

    if (!rpcError) return; // RPC succeeded!
  } catch {
    // RPC failed or not present, fall through to fallback
  }

  // 2. Resilient fallback: Fetch current cloud row, increment, and upsert
  try {
    const { data: currentCloudRow } = await supabase
      .from('analytics')
      .select('views, quick_views, cart_adds, orders, name, category')
      .eq('product_id', pId)
      .maybeSingle();

    const isView = actionType === 'view' || actionType === 'quick_view';
    const isQuickView = actionType === 'quick_view';
    const isCartAdd = actionType === 'cart_add';
    const isOrder = actionType === 'order';

    const newViews = (Number(currentCloudRow?.views) || 0) + (isView ? 1 : 0);
    const newQuickViews = (Number(currentCloudRow?.quick_views) || 0) + (isQuickView ? 1 : 0);
    const newCartAdds = (Number(currentCloudRow?.cart_adds) || 0) + (isCartAdd ? 1 : 0);
    const newOrders = (Number(currentCloudRow?.orders) || 0) + (isOrder ? 1 : 0);

    await supabase.from('analytics').upsert({
      product_id: pId,
      views: newViews,
      quick_views: newQuickViews,
      cart_adds: newCartAdds,
      orders: newOrders,
      name: prodName || currentCloudRow?.name || '',
      category: prodCat || currentCloudRow?.category || '',
      updated_at: new Date().toISOString()
    }, { onConflict: 'product_id' });
  } catch (err) {
    console.warn("Cloud analytics sync fallback error:", err);
  }
};

/**
 * Track an interaction on a product (views, quick views, cart additions, orders)
 * @param {string|number} productId 
 * @param {object} product - optional product info (name, category, price, image)
 * @param {'view'|'quick_view'|'cart_add'|'order'} actionType 
 */
export const trackProductAction = (productId, product = {}, actionType = 'view') => {
  if (!productId) return;
  const pId = String(productId);

  // Throttle per session: 'view' max once per 45s per product to prevent loop-inflation
  if (actionType === 'view') {
    const now = Date.now();
    const lastTime = _viewThrottle[pId] || 0;
    if (now - lastTime < 45 * 1000) return;
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
    existing.views = (existing.views || 0) + 1;
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

  // Keep last 20 timestamps for timeline
  existing.history = [
    { type: actionType, time: new Date().toISOString() },
    ...(existing.history || []).slice(0, 19)
  ];

  current[pId] = existing;
  saveStoredProductAnalytics(current);

  // Trigger atomic background Cloud Sync
  syncIncrementToCloud(pId, product, actionType).catch(() => {});
};

/**
 * Get summary stats across all products
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
 * Reset all analytics (Local + Cloud Supabase)
 */
export const resetProductAnalytics = async () => {
  localStorage.removeItem(PRODUCT_ANALYTICS_KEY);
  idbSet(PRODUCT_ANALYTICS_KEY, {});

  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('analytics').delete().neq('product_id', '_none_');
    }
  } catch (err) {
    console.warn("Supabase analytics reset error:", err);
  }
};
