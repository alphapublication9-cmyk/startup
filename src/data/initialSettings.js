export const applyEnvSettingsOverrides = (config = {}) => {
  const overrides = {};
  if (import.meta.env.VITE_STORE_NAME) {
    overrides.storeName = import.meta.env.VITE_STORE_NAME;
  }
  if (import.meta.env.VITE_WHATSAPP_NUMBER) {
    overrides.whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
  }
  if (import.meta.env.VITE_TELEGRAM_USERNAME) {
    overrides.telegramUsername = import.meta.env.VITE_TELEGRAM_USERNAME;
  }
  if (import.meta.env.VITE_ORDER_CHANNEL) {
    overrides.orderChannel = import.meta.env.VITE_ORDER_CHANNEL;
  }
  if (import.meta.env.VITE_SUPPORT_EMAIL) {
    overrides.supportEmail = import.meta.env.VITE_SUPPORT_EMAIL;
  }
  return { ...config, ...overrides };
};

export const INITIAL_SETTINGS = applyEnvSettingsOverrides({
  storeName: "RADHIKA KURTI COLLECTION",
  tagline: "Luxury Design & Handcrafted Women's Fashion",
  logoUrl: "/logo.png",
  companyAddress: "Plot No. 42, Hawa Mahal Road, Badi Chaupar",
  companyCity: "Jaipur, Rajasthan",
  companyPincode: "302002",
  companyGst: "08AABCA1234F1Z9",
  whatsappNumber: "+919876543210", // Owner's WhatsApp number (editable via Admin or overridden by VITE_WHATSAPP_NUMBER)
  telegramUsername: "radhikakurticollection", // Owner's Telegram Handle/Username (editable via Admin or overridden by VITE_TELEGRAM_USERNAME)
  orderChannel: "whatsapp", // 'whatsapp' | 'telegram' | 'both'
  currency: "₹",
  announcementText: "✨ FESTIVE SALE: Extra 10% OFF on Prepaid Orders | Pan-India Express Dispatch ✨",
  supportEmail: "info@radhikakurticollection.com",
  adminUser: "admin420",
  adminPass: "Radhika@420",
  invoicePrefix: "RKC/2026/",
  invoiceTerms: "1. 7-Day Hassle-Free Size Exchange on intact tags.\n2. Dry Clean recommended for all silk, zari, and embroidered apparel.\n3. All disputes subject to Jaipur, Rajasthan jurisdiction.",
  // ⚡ 15-Minute Sales Countdown Flash Discount Settings (Editable from Admin)
  timerDiscountEnabled: true,
  timerMinutes: 15,
  timerDiscountType: "percentage", // 'percentage' | 'fixed'
  timerDiscountValue: 10, // 10% or fixed ₹ discount
  timerOfferHeading: "⚡ FLASH SALE: Complete your order in under 15 minutes to unlock EXTRA discount!"
});

