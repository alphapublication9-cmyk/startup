export const DEFAULT_HERO_BANNER = {
  tag: "Spring/Summer 2026 • Luxury Collection",
  heading: "Grace & Timeless",
  headingAccent: "Women's Couture",
  description: "Discover authentic handcrafted Lucknowi Chikankari, Banarasi Pure Silk Sarees, and breathable Jaipur Cotton Kurtis. Add to cart & place direct instant orders on WhatsApp / Telegram.",
  primaryCtaText: "Shop Collection",
  secondaryCtaText: "WhatsApp Catalog",
  trustTagline: "⚡ Instant Confirmation • Fast Pan-India Dispatch • 7-Day Easy Exchange",
  featuredCardTag: "TRENDING NOW",
  featuredCardTitle: "Chanderi Zari Anarkalis",
  featuredCardPrice: "From ₹999",
  featuredCardDiscount: "UP TO 50% OFF",
  featuredCardImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80"
};

export const DEFAULT_EDITORIAL_CAPSULES = [
  {
    id: 'capsule-1',
    category: 'Sarees',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    tag: 'TIMELESS CLASSICS',
    title: 'The Royal Silk Edit',
    desc: 'Pure Katan, Banarasi & Organza handloom sarees woven with pure metallic zari threads.',
    cta: 'Explore Capsule'
  },
  {
    id: 'capsule-2',
    category: 'Kurtis & Suits',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    tag: 'SIGNATURE CUTS',
    title: 'Flared Anarkalis & Sets',
    desc: 'Flowing silhouettes with intricate gota patti, mirror work and resham thread embroidery.',
    cta: 'Shop The Silhouette'
  },
  {
    id: 'capsule-3',
    category: 'Lehenga Choli',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    tag: 'BRIDAL & OCCASION',
    title: 'The Grand Celebration',
    desc: 'Statement bridal lehengas and velvet ensembles designed for unforgettable moments.',
    cta: 'View Wedding Edition'
  }
];

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
  "timerOfferHeading": "⚡ FLASH SALE: Complete your order in under 15 minutes to unlock EXTRA discount!",
  "heroBanner": DEFAULT_HERO_BANNER,
  "editorialCapsules": DEFAULT_EDITORIAL_CAPSULES
};

export const applyEnvSettingsOverrides = (settings = {}) => {
  return {
    ...INITIAL_SETTINGS,
    ...settings,
    heroBanner: {
      ...DEFAULT_HERO_BANNER,
      ...(settings?.heroBanner || {})
    },
    editorialCapsules: Array.isArray(settings?.editorialCapsules) && settings.editorialCapsules.length > 0 
      ? settings.editorialCapsules 
      : DEFAULT_EDITORIAL_CAPSULES
  };
};
