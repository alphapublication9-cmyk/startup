import { INITIAL_PRODUCTS, DEFAULT_CATEGORIES } from '../data/initialProducts';
import { INITIAL_SETTINGS } from '../data/initialSettings';
import { INITIAL_COUPONS, INITIAL_REVIEWS } from '../data/initialCoupons';
import { idbGet, idbSet } from './indexedDBStorage';

const PRODUCTS_KEY = 'aura_kurti_products_v5';
const CATEGORIES_KEY = 'aura_kurti_categories_v5';
const SETTINGS_KEY = 'aura_kurti_settings_v5';
const ORDERS_KEY = 'aura_kurti_orders_v3';
const ADMIN_AUTH_KEY = 'aura_kurti_admin_auth_v3';
const COUPONS_KEY = 'aura_kurti_coupons_v3';
const REVIEWS_KEY = 'aura_kurti_reviews_v3';
const WISHLIST_KEY = 'aura_kurti_wishlist_v3';

// Synchronous initial getters (fallback to localStorage or Initial Data)
export const getStoredCategories = () => {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load categories from storage", e);
  }
  return DEFAULT_CATEGORIES;
};

export const saveStoredCategories = (categories) => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.warn("LocalStorage full, saving to IndexedDB instead", e);
  }
  idbSet(CATEGORIES_KEY, categories);
};

let inMemoryProductsCache = null;

export const getStoredProducts = () => {
  if (inMemoryProductsCache && inMemoryProductsCache.length > 0) {
    return inMemoryProductsCache;
  }
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryProductsCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load products from storage", e);
  }
  return INITIAL_PRODUCTS;
};

export const saveStoredProducts = (products) => {
  if (!Array.isArray(products)) return;
  inMemoryProductsCache = products;

  // 1. Always save full data to IndexedDB
  idbSet(PRODUCTS_KEY, products);

  // 2. Try saving to localStorage safely without truncating base64 into invalid URLs
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn("LocalStorage quota exceeded, full data preserved in IndexedDB & Memory", e);
    try {
      // Create a lightweight version that doesn't corrupt base64
      const lightCopy = products.map(p => {
        const isHugeBase64 = p.image && p.image.startsWith('data:') && p.image.length > 50000;
        return {
          ...p,
          image: isHugeBase64 ? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' : p.image,
          images: Array.isArray(p.images) ? p.images.map(img => (img && img.startsWith('data:') && img.length > 50000) ? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' : img) : [p.image]
        };
      });
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(lightCopy));
    } catch {
      // IndexedDB & in-memory cache remain the primary source of truth
    }
  }
};

export const getStoredSettings = () => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return INITIAL_SETTINGS;
};

export const saveStoredSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save settings to localStorage", e);
  }
  idbSet(SETTINGS_KEY, settings);
};

export const getStoredOrders = () => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load orders", e);
  }
  return [];
};

export const saveNewOrder = (order) => {
  try {
    const orders = getStoredOrders();
    const updated = [order, ...orders];
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    idbSet(ORDERS_KEY, updated);
    return updated;
  } catch (e) {
    console.error("Failed to save order", e);
    return [];
  }
};

export const getStoredCoupons = () => {
  try {
    const data = localStorage.getItem(COUPONS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load coupons", e);
  }
  return INITIAL_COUPONS;
};

export const saveStoredCoupons = (coupons) => {
  try {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  } catch (e) {
    console.warn(e);
  }
  idbSet(COUPONS_KEY, coupons);
};

export const getStoredReviews = () => {
  try {
    const data = localStorage.getItem(REVIEWS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load reviews", e);
  }
  return INITIAL_REVIEWS;
};

export const saveStoredReviews = (reviews) => {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.warn(e);
  }
  idbSet(REVIEWS_KEY, reviews);
};

export const getStoredWishlist = () => {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load wishlist", e);
  }
  return [];
};

export const saveStoredWishlist = (wishlist) => {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  } catch (e) {
    console.warn(e);
  }
  idbSet(WISHLIST_KEY, wishlist);
};

export const getAdminAuthStatus = () => {
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

export const setAdminAuthStatus = (status) => {
  try {
    if (status) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  } catch (e) {
    console.error("Failed to set admin auth", e);
  }
};

/**
 * Async Loader to hydrate app state from IndexedDB Database
 */
export const loadAllFromIndexedDB = async () => {
  try {
    const [idbProducts, idbCategories, idbSettings, idbOrders, idbCoupons, idbReviews] = await Promise.all([
      idbGet(PRODUCTS_KEY),
      idbGet(CATEGORIES_KEY),
      idbGet(SETTINGS_KEY),
      idbGet(ORDERS_KEY),
      idbGet(COUPONS_KEY),
      idbGet(REVIEWS_KEY)
    ]);
    return {
      products: idbProducts,
      categories: idbCategories,
      settings: idbSettings,
      orders: idbOrders,
      coupons: idbCoupons,
      reviews: idbReviews
    };
  } catch (err) {
    console.warn("Failed to load data from IndexedDB:", err);
    return {};
  }
};
