/**
 * Promo Code & Reward Threshold Resolver
 * Resolves discount type, discount value, minimum order threshold, and qualification progress
 * for Spin Wheel Rewards, Custom Coupons, and Free Gifts (Amazon / Flipkart E-Commerce Cart Logic).
 */

export const resolvePromoDetails = (promo, coupons = [], subtotal = 0) => {
  if (!promo) return null;
  const promoCode = (typeof promo === 'string' ? promo : promo.code || '').trim().toUpperCase();
  if (!promoCode) return null;

  // 1. Check if defined in store custom coupons
  const matchedCoupon = coupons.find(c => (c.code || '').toUpperCase() === promoCode);

  let discountType = matchedCoupon?.discountType || matchedCoupon?.type || promo?.discountType || 'flat';
  let discountValue = Number(matchedCoupon?.discountValue ?? matchedCoupon?.discount ?? promo?.discountValue ?? 0);
  let minOrderAmount = Number(matchedCoupon?.minOrderAmount ?? matchedCoupon?.minOrder ?? promo?.minOrderAmount ?? 0);
  let description = matchedCoupon?.description || promo?.description || '';
  let freeGiftTitle = promo?.freeGiftTitle || matchedCoupon?.freeGiftTitle || '';

  // 2. Spin Wheel & Standard Known Code Defaults if not explicitly set
  if (promoCode === 'ROYAL300' || promoCode === 'SPIN300') {
    discountType = 'flat';
    discountValue = 300;
    minOrderAmount = minOrderAmount || 1499;
    description = 'VIP Spin Reward: Flat ₹300 OFF on orders above ₹1,499';
  } else if (promoCode === 'SPIN500' || promoCode === 'LUXE500') {
    discountType = 'flat';
    discountValue = 500;
    minOrderAmount = minOrderAmount || 1999;
    description = 'VIP Spin Reward: Flat ₹500 OFF on orders above ₹1,999';
  } else if (promoCode === 'LUCKY25' || promoCode === 'FAST25') {
    discountType = 'percentage';
    discountValue = 25;
    minOrderAmount = minOrderAmount || 2499;
    description = 'VIP Spin Reward: Extra 25% OFF on orders above ₹2,499';
  } else if (promoCode === 'FREEDUPATTA') {
    discountType = 'gift';
    freeGiftTitle = 'Banarasi Silk Dupatta (Worth ₹1,499)';
    minOrderAmount = minOrderAmount || 2999;
    description = 'VIP Spin Reward: Free Banarasi Silk Dupatta Free Gift with orders above ₹2,999';
  } else if (promoCode === 'FREEKURTI') {
    discountType = 'gift';
    freeGiftTitle = 'Pure Silk Kurti (Worth ₹2,499)';
    minOrderAmount = minOrderAmount || 3499;
    description = 'VIP Spin Reward: Free Pure Silk Kurti Free Gift with orders above ₹3,499';
  } else if (promoCode === 'KUNDANGIFT') {
    discountType = 'gift';
    freeGiftTitle = 'Kundan Jewelry Set (Worth ₹1,999)';
    minOrderAmount = minOrderAmount || 2999;
    description = 'VIP Spin Reward: Free Bridal Kundan Jewelry Set Free Gift with orders above ₹2,999';
  } else if (promoCode === 'WINANARKALI') {
    discountType = 'gift';
    freeGiftTitle = 'Velvet Anarkali Suit Set (Worth ₹3,999)';
    minOrderAmount = minOrderAmount || 4999;
    description = 'Grand Prize: Free Velvet Anarkali Suit Set with orders above ₹4,999';
  } else if (promoCode === 'FREESHIP') {
    discountType = 'shipping';
    discountValue = 150;
    minOrderAmount = minOrderAmount || 999;
    description = '100% Free Express Shipping on orders above ₹999';
  } else if (promoCode === 'ROYAL10' || promoCode === 'FESTIVE10') {
    discountType = 'percentage';
    discountValue = 10;
    minOrderAmount = minOrderAmount || 999;
    description = '10% OFF on orders above ₹999';
  } else if (promoCode === 'FESTIVE20') {
    discountType = 'percentage';
    discountValue = 20;
    minOrderAmount = minOrderAmount || 1999;
    description = '20% OFF Festive Discount on orders above ₹1,999';
  } else if (promoCode === 'FIRSTBUY') {
    discountType = 'flat';
    discountValue = 200;
    minOrderAmount = minOrderAmount || 1299;
    description = 'First Order Special ₹200 OFF on orders above ₹1,299';
  }

  // 3. Calculate Threshold Eligibility
  const isEligible = subtotal >= minOrderAmount;
  const shortAmount = Math.max(0, minOrderAmount - subtotal);
  const progressPercent = minOrderAmount > 0 ? Math.min(100, Math.round((subtotal / minOrderAmount) * 100)) : 100;

  let discountAmount = 0;
  if (isEligible) {
    if (discountType === 'percentage') {
      discountAmount = Math.min(Math.round((subtotal * discountValue) / 100), 1000); // capped at max ₹1,000 for % coupons
    } else if (discountType === 'flat') {
      discountAmount = Math.min(subtotal, discountValue);
    } else if (discountType === 'shipping') {
      discountAmount = discountValue;
    }
  }

  return {
    code: promoCode,
    discountType,
    discountValue,
    minOrderAmount,
    description,
    freeGiftTitle,
    isEligible,
    shortAmount,
    progressPercent,
    discountAmount
  };
};
