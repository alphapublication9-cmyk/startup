/**
 * Utility functions for generating dynamic Order and Inquiry Redirect URLs
 * Supports both WhatsApp and Telegram channels seamlessly.
 */

export const cleanWhatsAppPhone = (phone = "") => {
  return (phone || "919876543210").replace(/[^0-9]/g, '');
};

export const cleanTelegramHandle = (handle = "") => {
  if (!handle) return "radhikakurticollection";
  let cleaned = handle.trim();
  // Remove full url prefix if user entered https://t.me/username
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?t\.me\//i, '');
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?telegram\.me\//i, '');
  // Remove leading @
  cleaned = cleaned.replace(/^@/, '');
  // Remove trailing slashes or queries
  cleaned = cleaned.split('/')[0].split('?')[0];
  return cleaned || "radhikakurticollection";
};

/**
 * Builds formatted text order message
 */
export const buildOrderMessage = ({ 
  customer, 
  cartItems, 
  totalPrice, 
  settings, 
  discount = 0,
  timerDiscount = 0,
  couponDiscount = 0,
  appliedPromo = ''
}) => {
  const itemsListText = cartItems.map((item, idx) => {
    const itemTotal = item.price * item.quantity;
    return `${idx + 1}. 👗 *${item.name}*\n   • Size: ${item.selectedSize || 'Standard'}\n   • Qty: ${item.quantity}\n   • Price: ₹${item.price.toLocaleString('en-IN')} (₹${itemTotal.toLocaleString('en-IN')})`;
  }).join('\n\n');

  // Build itemized discount lines
  const discountLines = [];
  if (timerDiscount > 0) {
    discountLines.push(`• ⚡ 15-Min Rush Flash Discount: -₹${timerDiscount.toLocaleString('en-IN')}`);
  }
  if (couponDiscount > 0 && appliedPromo) {
    discountLines.push(`• 🏷️ Promo Code (${appliedPromo}): -₹${couponDiscount.toLocaleString('en-IN')}`);
  } else if (discount > 0 && !(timerDiscount > 0)) {
    discountLines.push(`• Discount Applied: -₹${discount.toLocaleString('en-IN')}`);
  }

  const totalQty = cartItems.reduce((a, c) => a + c.quantity, 0);
  const luckyDrawQualified = totalQty >= 3;
  const luckyDrawText = luckyDrawQualified ? `🎁 *FESTIVE LUCKY DRAW:* 100% QUALIFIED (Order of ${totalQty} items entered for Grand Banarasi Saree Giveaway!)\n━━━━━━━━━━━━━━━━━━━━\n` : '';

  return `✨ *NEW BOUTIQUE ORDER - ${settings.storeName || 'RADHIKA KURTI COLLECTION'}* ✨
━━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER DETAILS*
• Name: ${customer.name || 'Not provided'}
• Phone: ${customer.phone || 'Not provided'}
• Delivery Address: ${customer.address || 'Not provided'}
• City/State: ${customer.city || ''} ${customer.state || ''}
• Pincode: ${customer.pincode || 'Not provided'}
${customer.paymentMethod ? `• Payment Mode: ${customer.paymentMethod}\n` : ''}${customer.notes ? `• Special Notes: ${customer.notes}\n` : ''}━━━━━━━━━━━━━━━━━━━━
🛍️ *ITEMS IN CART (${totalQty} Items)*

${itemsListText}

━━━━━━━━━━━━━━━━━━━━
💵 *BILL BREAKDOWN*
• Item Subtotal: ₹${effectiveSubtotal.toLocaleString('en-IN')}
${discountText}• Delivery Charges: Confirmed on WhatsApp (as per location)
⭐ *ITEM TOTAL:* *₹${totalPrice.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
${luckyDrawText}💬 *Please confirm item availability, dispatch schedule & share tracking details! Thank you!* 🙏🌸`;
};

/**
 * Builds single product inquiry message
 */
export const buildSingleProductMessage = ({ product, selectedSize, settings }) => {
  return `✨ *INQUIRY / DIRECT ORDER - ${settings.storeName || 'RADHIKA KURTI COLLECTION'}* ✨
━━━━━━━━━━━━━━━━━━━━
Hello! I would like to order this item:

👗 *Product:* ${product.name}
📏 *Selected Size:* ${selectedSize || product.sizes?.[0] || 'M'}
💰 *Price:* ₹${product.price.toLocaleString('en-IN')} ${product.originalPrice ? `(MRP: ₹${product.originalPrice.toLocaleString('en-IN')})` : ''}
🧵 *Fabric:* ${product.fabric || 'Pure Silk / Cotton'}
🎨 *Color:* ${product.color || 'As pictured'}

Please check size availability and let me know how to proceed with payment and delivery! 🙏`;
};

/**
 * Formats order details and generates a clean WhatsApp redirect URL
 */
export const generateWhatsAppOrderUrl = ({ 
  customer, 
  cartItems, 
  totalPrice, 
  settings, 
  discount = 0,
  timerDiscount = 0,
  couponDiscount = 0,
  appliedPromo = ''
}) => {
  const cleanPhone = cleanWhatsAppPhone(settings.whatsappNumber);
  const message = buildOrderMessage({ 
    customer, 
    cartItems, 
    totalPrice, 
    settings, 
    discount,
    timerDiscount,
    couponDiscount,
    appliedPromo 
  });
  const encodedMessage = encodeURIComponent(message);
  return {
    url: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
    rawMessage: message
  };
};

/**
 * Formats order details and generates a clean Telegram redirect URL
 */
export const generateTelegramOrderUrl = ({ 
  customer, 
  cartItems, 
  totalPrice, 
  settings, 
  discount = 0,
  timerDiscount = 0,
  couponDiscount = 0,
  appliedPromo = ''
}) => {
  const cleanHandle = cleanTelegramHandle(settings.telegramUsername);
  const message = buildOrderMessage({ 
    customer, 
    cartItems, 
    totalPrice, 
    settings, 
    discount,
    timerDiscount,
    couponDiscount,
    appliedPromo 
  });
  const encodedMessage = encodeURIComponent(message);
  return {
    url: `https://t.me/${cleanHandle}?text=${encodedMessage}`,
    rawMessage: message
  };
};

/**
 * Direct 1-Click Buy on WhatsApp for single product
 */
export const generateSingleProductWhatsAppUrl = ({ product, selectedSize, settings }) => {
  const cleanPhone = cleanWhatsAppPhone(settings.whatsappNumber);
  const message = buildSingleProductMessage({ product, selectedSize, settings });
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
};

/**
 * Direct 1-Click Buy on Telegram for single product
 */
export const generateSingleProductTelegramUrl = ({ product, selectedSize, settings }) => {
  const cleanHandle = cleanTelegramHandle(settings.telegramUsername);
  const message = buildSingleProductMessage({ product, selectedSize, settings });
  return `https://t.me/${cleanHandle}?text=${encodeURIComponent(message)}`;
};

/**
 * Dynamic Channel Order URL Generator based on chosen/configured channel
 */
export const generateOrderUrlByChannel = ({ 
  channel, 
  customer, 
  cartItems, 
  totalPrice, 
  settings, 
  discount = 0,
  timerDiscount = 0,
  couponDiscount = 0,
  appliedPromo = ''
}) => {
  const targetChannel = channel || settings.orderChannel || 'whatsapp';
  if (targetChannel === 'telegram') {
    return generateTelegramOrderUrl({ 
      customer, 
      cartItems, 
      totalPrice, 
      settings, 
      discount,
      timerDiscount,
      couponDiscount,
      appliedPromo 
    });
  }
  return generateWhatsAppOrderUrl({ 
    customer, 
    cartItems, 
    totalPrice, 
    settings, 
    discount,
    timerDiscount,
    couponDiscount,
    appliedPromo 
  });
};

/**
 * Dynamic Single Product URL Generator based on chosen/configured channel
 */
export const generateSingleProductChannelUrl = ({ channel, product, selectedSize, settings }) => {
  const targetChannel = channel || settings.orderChannel || 'whatsapp';
  if (targetChannel === 'telegram') {
    return generateSingleProductTelegramUrl({ product, selectedSize, settings });
  }
  return generateSingleProductWhatsAppUrl({ product, selectedSize, settings });
};

/**
 * Direct contact channel link (for Navbar, Hero, Floating button, Footer)
 */
export const getDirectChannelLink = (settings, customText = "Hello! I am interested in your luxury Women Fashion Collection") => {
  const channel = settings.orderChannel || 'whatsapp';
  const encoded = encodeURIComponent(customText);

  if (channel === 'telegram') {
    const handle = cleanTelegramHandle(settings.telegramUsername);
    return `https://t.me/${handle}?text=${encoded}`;
  }

  const phone = cleanWhatsAppPhone(settings.whatsappNumber);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
};
