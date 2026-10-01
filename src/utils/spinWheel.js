import { idbGet, idbSet } from './indexedDBStorage';
import { getSupabase } from './supabaseClient';
import { getCustomerAuthSession, getLuckyDrawUsers, saveLuckyDrawUsers } from './luckyDraw';

const SPIN_WHEEL_CONFIG_KEY = 'aura_kurti_spin_wheel_config_v1';
const SPIN_WHEEL_WINS_KEY = 'aura_kurti_spin_wheel_wins_v1';
const DEVICE_SPIN_TIMESTAMP_KEY = 'aura_kurti_last_spin_time_v1';

export const DEFAULT_WHEEL_SLICES = [
  {
    id: 'slice-1',
    label: 'Banarasi Silk Dupatta',
    subtext: 'Free Gift on Order',
    type: 'product',
    couponCode: 'FREEDUPATTA',
    worth: '₹1,499',
    color: '#700b1d',
    textColor: '#fde047',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
    description: 'Handcrafted royal gold zari Banarasi silk dupatta free with your order!'
  },
  {
    id: 'slice-2',
    label: 'Flat ₹500 OFF',
    subtext: 'Min order ₹1,999',
    type: 'coupon',
    couponCode: 'SPIN500',
    worth: '₹500',
    color: '#d97706',
    textColor: '#ffffff',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80',
    description: 'Instant ₹500 discount on your order at checkout.'
  },
  {
    id: 'slice-3',
    label: 'Pure Silk Kurti',
    subtext: 'Win Free Outfit',
    type: 'product',
    couponCode: 'FREEKURTI',
    worth: '₹2,499',
    color: '#15803d',
    textColor: '#ffffff',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80',
    description: 'Designer Chanderi embroidered kurti with handcrafted neckline.'
  },
  {
    id: 'slice-4',
    label: 'Extra 25% OFF',
    subtext: 'All Collections',
    type: 'discount',
    couponCode: 'LUCKY25',
    worth: '25% OFF',
    color: '#b45309',
    textColor: '#ffffff',
    image: '',
    description: 'Special 25% festive discount coupon valid on all items.'
  },
  {
    id: 'slice-5',
    label: 'Kundan Jewelry Set',
    subtext: 'Free Luxury Gift',
    type: 'product',
    couponCode: 'KUNDANGIFT',
    worth: '₹1,999',
    color: '#831843',
    textColor: '#fde047',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80',
    description: 'Handmade bridal Kundan necklace & earring set.'
  },
  {
    id: 'slice-6',
    label: 'Flat ₹300 OFF',
    subtext: 'No Minimum',
    type: 'coupon',
    couponCode: 'ROYAL300',
    worth: '₹300',
    color: '#0f766e',
    textColor: '#ffffff',
    image: '',
    description: 'Direct flat ₹300 savings coupon on your entire cart.'
  },
  {
    id: 'slice-7',
    label: 'Velvet Anarkali Suit',
    subtext: 'Grand Prize',
    type: 'product',
    couponCode: 'WINANARKALI',
    worth: '₹3,999',
    color: '#4c0519',
    textColor: '#fde047',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80',
    description: 'Heavy designer festive Anarkali suit set with dupatta.'
  },
  {
    id: 'slice-8',
    label: 'Free Express Shipping',
    subtext: 'Zero Delivery Fee',
    type: 'coupon',
    couponCode: 'FREESHIP',
    worth: '₹150',
    color: '#1d4ed8',
    textColor: '#ffffff',
    image: '',
    description: '100% Free doorstep air express delivery across all pin-codes in India.'
  }
];

export const DEFAULT_SPIN_CONFIG = {
  isEnabled: true,
  autoOpenOnVisit: true,
  autoOpenDelaySeconds: 1.5,
  title: "🎡 Spin the Royal Wheel to Win!",
  subtitle: "Spin now for exclusive designer products, free gifts & VIP discount vouchers!",
  slices: DEFAULT_WHEEL_SLICES
};

/**
 * Get Spin Wheel Config
 */
export const getSpinWheelConfig = () => {
  try {
    const raw = localStorage.getItem(SPIN_WHEEL_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SPIN_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load spin wheel config", e);
  }
  return DEFAULT_SPIN_CONFIG;
};

/**
 * Save Spin Wheel Config
 */
export const saveSpinWheelConfig = (config) => {
  try {
    localStorage.setItem(SPIN_WHEEL_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Storage warning for spin config", e);
  }
  idbSet(SPIN_WHEEL_CONFIG_KEY, config);

  // Sync to Supabase if configured
  try {
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('settings').upsert({
        id: 'spin_wheel_config',
        data: config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).catch(() => {});
    }
  } catch {}
};

/**
 * Get all Spin Win Records (Admin audit)
 */
export const getSpinWinsHistory = () => {
  try {
    const raw = localStorage.getItem(SPIN_WHEEL_WINS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load spin wins", e);
  }
  return [];
};

/**
 * Save a spin win record
 */
export const recordSpinWin = ({ prize, user = null }) => {
  const now = new Date().toISOString();
  const record = {
    id: `spin-${Date.now()}`,
    prizeTitle: prize.label,
    prizeWorth: prize.worth,
    prizeType: prize.type,
    couponCode: prize.couponCode,
    prizeImage: prize.image || '',
    userPhone: user?.phone || 'Guest',
    userName: user?.name || 'Guest Visitor',
    userCity: user?.city || '',
    claimed: !!user,
    wonAt: now
  };

  const current = getSpinWinsHistory();
  const updated = [record, ...current.slice(0, 99)];
  try {
    localStorage.setItem(SPIN_WHEEL_WINS_KEY, JSON.stringify(updated));
    localStorage.setItem(DEVICE_SPIN_TIMESTAMP_KEY, Date.now().toString());
  } catch {}
  idbSet(SPIN_WHEEL_WINS_KEY, updated);

  return record;
};

/**
 * Link guest spin win to a logged-in/newly registered customer
 */
export const linkSpinWinToCustomer = (user, wonPrize) => {
  if (!user || !wonPrize) return;

  const users = getLuckyDrawUsers();
  const target = users.find(u => u.phone === user.phone);
  if (target) {
    const currentRewards = Array.isArray(target.savedRewards) ? target.savedRewards : [];
    const updatedUser = {
      ...target,
      savedRewards: [
        {
          id: `rew-${Date.now()}`,
          title: wonPrize.label,
          worth: wonPrize.worth,
          couponCode: wonPrize.couponCode,
          image: wonPrize.image || '',
          claimedAt: new Date().toISOString()
        },
        ...currentRewards
      ]
    };
    const updatedUsers = users.map(u => u.id === target.id ? updatedUser : u);
    saveLuckyDrawUsers(updatedUsers);
  }
};
