export const INITIAL_SETTINGS = {
  "storeName": "RADHIKA KURTI COLLECTION",
  "tagline": "Luxury Design & Handcrafted Women's Fashion",
  "logoUrl": "/logo.png",
  "companyAddress": "Plot No. 42, Hawa Mahal Road, Badi Chaupar",
  "companyCity": "Jaipur, Rajasthan",
  "companyPincode": "302002",
  "companyGst": "08AABCA1234F1Z9",
  "whatsappNumber": "+919876543210",
  "telegramUsername": "radhikakurticollection",
  "orderChannel": "whatsapp",
  "currency": "₹",
  "announcementText": "✨ FESTIVE SALE: Extra 10% OFF on Prepaid Orders | Pan-India Express Dispatch ✨",
  "supportEmail": "info@radhikakurticollection.com",
  "adminUser": "admin420",
  "adminPass": "Radhika@420",
  "invoicePrefix": "RKC/2026/",
  "invoiceTerms": "1. 7-Day Hassle-Free Size Exchange on intact tags.\n2. Dry Clean recommended for all silk, zari, and embroidered apparel.\n3. All disputes subject to Jaipur, Rajasthan jurisdiction.",
  "timerDiscountEnabled": true,
  "timerMinutes": 15,
  "timerDiscountType": "percentage",
  "timerDiscountValue": 10,
  "timerOfferHeading": "⚡ FLASH SALE: Complete your order in under 15 minutes to unlock EXTRA discount!"
};

export const applyEnvSettingsOverrides = (settings = {}) => {
  return {
    ...INITIAL_SETTINGS,
    ...settings
  };
};

