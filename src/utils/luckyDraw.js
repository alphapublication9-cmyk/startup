import { idbGet, idbSet } from './indexedDBStorage';
import { getSupabase } from './supabaseClient';
import { getStoredOrders } from './storage';

const LUCKY_DRAW_CONFIG_KEY = 'aura_kurti_lucky_draw_config_v2';
const LUCKY_DRAW_USERS_KEY = 'aura_kurti_lucky_draw_users_v2';
const LUCKY_DRAW_AUTH_KEY = 'aura_kurti_lucky_draw_auth_session_v2';

export const DEFAULT_LUCKY_DRAW_CONFIG = {
  isActive: true,
  title: "Festive Mega Royal Lucky Draw 🎁",
  tagline: "Order minimum 3 Boutique Apparel Items to Enter the Mega Giveaway!",
  minProductsRequired: 3,
  announcementDate: "2026-11-15",
  terms: "1. Customer must order a minimum of 3 apparel products.\n2. Free express doorstep delivery for the chosen prize item.\n3. Winner will be chosen via fair transparent draw and contacted directly on WhatsApp.\n4. Admin reserves the right to verify genuine order dispatch.",
  prizes: [
    {
      id: 'pz-1',
      title: 'Heritage Pure Katan Banarasi Silk Saree',
      worth: '₹4,999',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      description: 'Authentic royal Banarasi zari silk saree handcrafted by master weavers with blouse piece.'
    },
    {
      id: 'pz-2',
      title: 'Chikankari Embroidered Anarkali Velvet Suit Set',
      worth: '₹3,499',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      description: 'Heavy designer festive Anarkali with intricate Lucknowi threadwork and organza dupatta.'
    },
    {
      id: 'pz-3',
      title: 'Royal Kundan Jewelry Set & Store Gift Voucher',
      worth: '₹2,199',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
      description: 'Handmade bridal Kundan necklace with earrings + ₹1,000 Boutique Shopping Credit.'
    }
  ],
  winner: null // { ticketNumber, name, phone, prizeTitle, declaredAt, notes }
};

/**
 * Get Lucky Draw Config
 */
export const getLuckyDrawConfig = () => {
  try {
    const raw = localStorage.getItem(LUCKY_DRAW_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_LUCKY_DRAW_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load lucky draw config", e);
  }
  return DEFAULT_LUCKY_DRAW_CONFIG;
};

/**
 * Save Lucky Draw Config
 */
export const saveLuckyDrawConfig = (config) => {
  try {
    localStorage.setItem(LUCKY_DRAW_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Storage warning for lucky draw config", e);
  }
  idbSet(LUCKY_DRAW_CONFIG_KEY, config);

  // Sync to Supabase if available
  try {
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('settings').upsert({
        id: 'lucky_draw_config',
        data: config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).catch(() => {});
    }
  } catch {}
};

/**
 * Get all registered Lucky Draw Users
 */
export const getLuckyDrawUsers = () => {
  try {
    const raw = localStorage.getItem(LUCKY_DRAW_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load lucky draw users", e);
  }
  return [];
};

/**
 * Save all Lucky Draw Users
 */
export const saveLuckyDrawUsers = (users) => {
  try {
    localStorage.setItem(LUCKY_DRAW_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Storage quota warning for users", e);
  }
  idbSet(LUCKY_DRAW_USERS_KEY, users);
};

/**
 * Get Current Logged-in Customer Session
 */
export const getCustomerAuthSession = () => {
  try {
    const raw = localStorage.getItem(LUCKY_DRAW_AUTH_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load customer auth session", e);
  }
  return null;
};

/**
 * Set Customer Session
 */
export const setCustomerAuthSession = (user) => {
  try {
    if (user) {
      localStorage.setItem(LUCKY_DRAW_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LUCKY_DRAW_AUTH_KEY);
    }
  } catch (e) {
    console.error("Failed to set customer auth session", e);
  }
};

/**
 * Generate a unique golden ticket number
 */
const generateTicketNumber = () => {
  const randNum = Math.floor(10000 + Math.random() * 90000);
  return `RKC-DRAW-${randNum}`;
};

/**
 * Clean phone number to standard 10 digits
 */
const normalizePhone = (phone) => {
  return String(phone || '').replace(/[^\d]/g, '').slice(-10);
};

/**
 * Register a new Lucky Draw Participant (Create ID & Password)
 */
export const registerLuckyDrawUser = ({ name, phone, password, city = '', address = '' }) => {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number' };
  }
  if (!password || password.trim().length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long' };
  }
  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Please enter your full name' };
  }

  const users = getLuckyDrawUsers();
  const existing = users.find(u => normalizePhone(u.phone) === cleanPhone);

  if (existing) {
    return { 
      success: false, 
      error: 'An account with this Mobile Number already exists. Please enter your password to Login.' 
    };
  }

  const newTicket = generateTicketNumber();
  const now = new Date().toISOString();

  const newUser = {
    id: `user-${cleanPhone}`,
    name: name.trim(),
    phone: cleanPhone,
    password: password.trim(),
    city: city.trim() || 'Jaipur',
    address: address.trim(),
    ticketNumber: newTicket,
    registeredAt: now,
    lastLoginAt: now
  };

  const updatedUsers = [newUser, ...users];
  saveLuckyDrawUsers(updatedUsers);
  setCustomerAuthSession(newUser);

  // Sync to Supabase
  try {
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('customers').upsert({
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        city: newUser.city,
        address: newUser.address,
        last_active_at: now
      }, { onConflict: 'id' }).catch(() => {});
    }
  } catch {}

  return { success: true, user: newUser };
};

/**
 * Customer Login with Mobile Number + Password
 */
export const loginLuckyDrawUser = (phone, password) => {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password' };
  }

  const users = getLuckyDrawUsers();
  const user = users.find(u => normalizePhone(u.phone) === cleanPhone);

  if (!user) {
    return { 
      success: false, 
      error: 'No account found with this Mobile Number. Please Register first to generate your Lucky Draw ticket.' 
    };
  }

  if (user.password !== password.trim()) {
    return { success: false, error: 'Incorrect Password. Please check and try again.' };
  }

  // Update last login
  const now = new Date().toISOString();
  const updatedUser = { ...user, lastLoginAt: now };
  const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
  saveLuckyDrawUsers(updatedUsers);
  setCustomerAuthSession(updatedUser);

  return { success: true, user: updatedUser };
};

/**
 * Logout Customer Session
 */
export const logoutLuckyDrawUser = () => {
  setCustomerAuthSession(null);
};

/**
 * Calculate user's ordered products count to verify 3-item eligibility
 */
export const getUserDrawEligibility = (userPhone, minRequired = 3) => {
  const cleanPhone = normalizePhone(userPhone);
  if (!cleanPhone) return { count: 0, isEligible: false, minRequired };

  const allOrders = getStoredOrders();
  const matchingOrders = allOrders.filter(o => {
    const oPhone = normalizePhone(o.customer?.phone);
    return oPhone && oPhone === cleanPhone;
  });

  let totalItemsOrdered = 0;
  matchingOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(it => {
        totalItemsOrdered += Number(it.quantity || 1);
      });
    } else {
      totalItemsOrdered += 1;
    }
  });

  return {
    count: totalItemsOrdered,
    isEligible: totalItemsOrdered >= minRequired,
    minRequired,
    ordersCount: matchingOrders.length,
    remainingToUnlock: Math.max(0, minRequired - totalItemsOrdered)
  };
};
