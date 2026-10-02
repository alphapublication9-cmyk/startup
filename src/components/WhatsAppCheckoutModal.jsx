import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  CheckCircle2, 
  MapPin, 
  User, 
  Phone, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateOrderUrlByChannel, cleanTelegramHandle } from '../utils/whatsapp';
import { saveNewOrder } from '../utils/storage';
import { recordCloudOrder } from '../utils/cloudSync';
import { recordCustomerLead } from '../utils/customerDirectory';
import { trackProductAction } from '../utils/productAnalytics';
import { getCustomerAuthSession } from '../utils/luckyDraw';
import { resolvePromoDetails } from '../utils/promoResolver';

export const WhatsAppCheckoutModal = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  appliedPromo, 
  settings = {}, 
  checkoutPricing = null,
  onOrderSuccess 
}) => {
  if (!isOpen || cartItems.length === 0) return null;

  const defaultChannel = settings.orderChannel === 'telegram' ? 'telegram' : 'whatsapp';
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);

  const subtotal = checkoutPricing?.subtotal ?? cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Calculate timer discount (from props or live timer deadline)
  let timerDiscount = 0;
  if (checkoutPricing && typeof checkoutPricing.timerDiscount === 'number') {
    timerDiscount = checkoutPricing.timerDiscount;
  } else if (settings.timerDiscountEnabled !== false && cartItems.length > 0) {
    try {
      const storedDeadline = localStorage.getItem('aura_kurti_cart_timer_deadline');
      const isExpired = storedDeadline ? (parseInt(storedDeadline, 10) - Date.now() <= 0) : false;
      if (!isExpired) {
        const tType = settings.timerDiscountType || 'percentage';
        const tVal = Number(settings.timerDiscountValue ?? 10);
        if (tType === 'percentage') {
          timerDiscount = Math.round((subtotal * tVal) / 100);
        } else {
          timerDiscount = Math.min(subtotal, tVal);
        }
      }
    } catch {}
  }

  // Resolve Promo Code & Free Gift with Minimum Order Thresholds
  const resolvedPromo = resolvePromoDetails(appliedPromo, [], subtotal);
  const freeGift = checkoutPricing?.freeGift || (resolvedPromo?.isEligible ? resolvedPromo.freeGiftTitle : null);

  // Calculate coupon discount
  let couponDiscount = 0;
  if (checkoutPricing && typeof checkoutPricing.couponDiscount === 'number') {
    couponDiscount = checkoutPricing.couponDiscount;
  } else if (resolvedPromo?.isEligible) {
    couponDiscount = resolvedPromo.discountAmount || 0;
  }

  const bundleDiscount = checkoutPricing?.bundleDiscount || 0;
  const discountAmount = checkoutPricing?.discountAmount ?? (timerDiscount + couponDiscount + bundleDiscount);
  const grandTotal = checkoutPricing?.grandTotal ?? Math.max(0, subtotal - discountAmount);

  const isTelegramActive = settings.orderChannel === 'telegram' || (settings.orderChannel === 'both' && selectedChannel === 'telegram');
  const activeChannelName = isTelegramActive ? 'Telegram' : 'WhatsApp';

  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_kurti_last_customer');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.name || parsed.phone)) {
          return {
            name: parsed.name || '',
            phone: parsed.phone || '',
            address: parsed.address || '',
            city: parsed.city || '',
            state: parsed.state || '',
            pincode: parsed.pincode || '',
            paymentMethod: parsed.paymentMethod || 'Prepaid Online (UPI / GPay / PhonePe / QR Code)',
            notes: parsed.notes || ''
          };
        }
      }
    } catch {}

    const auth = getCustomerAuthSession ? getCustomerAuthSession() : null;
    if (auth && (auth.name || auth.phone)) {
      return {
        name: auth.name || '',
        phone: auth.phone || '',
        address: auth.address || '',
        city: auth.city || '',
        state: auth.state || '',
        pincode: auth.pincode || '',
        paymentMethod: 'Prepaid Online (UPI / GPay / PhonePe / QR Code)',
        notes: ''
      };
    }

    return {
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      paymentMethod: 'Prepaid Online (UPI / GPay / PhonePe / QR Code)',
      notes: ''
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Auto-capture lead in real time to Supabase & localStorage whether checkout finishes or not
  const syncLeadRealTime = (custData) => {
    if (!custData) return;
    try {
      localStorage.setItem('aura_kurti_last_customer', JSON.stringify(custData));
    } catch {}
    
    // As soon as name (>= 2 chars) or phone (>= 10 digits) or address is entered, push lead to Supabase
    const hasPhone = custData.phone && custData.phone.replace(/[^\d]/g, '').length >= 10;
    const hasName = custData.name && custData.name.trim().length >= 2;
    if (hasPhone || hasName) {
      recordCustomerLead(custData, null);
    }
  };

  const handleInputChange = (field, value) => {
    const updated = { ...customer, [field]: value };
    setCustomer(updated);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    syncLeadRealTime(updated);
  };

  const handleInputBlur = () => {
    syncLeadRealTime(customer);
  };

  const validate = () => {
    const errs = {};
    if (!customer.name.trim()) errs.name = 'Please enter your full name';
    if (!customer.phone.trim() || customer.phone.length < 10) errs.phone = 'Please enter a valid 10-digit mobile number';
    if (!customer.address.trim()) errs.address = 'Please enter delivery address';
    if (!customer.pincode.trim() || customer.pincode.length < 6) errs.pincode = 'Please enter 6-digit pincode';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const targetChannel = settings.orderChannel === 'both' ? selectedChannel : (settings.orderChannel || 'whatsapp');

    const { url, rawMessage } = generateOrderUrlByChannel({
      channel: targetChannel,
      customer,
      cartItems,
      totalPrice: grandTotal,
      settings,
      discount: discountAmount,
      bundleDiscount,
      timerDiscount,
      couponDiscount,
      appliedPromo,
      freeGift
    });

    // Save order record
    const newOrder = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer,
      items: cartItems,
      totalAmount: grandTotal,
      discount: discountAmount,
      bundleDiscount,
      timerDiscount,
      couponDiscount,
      promoCode: appliedPromo,
      freeGift,
      channel: targetChannel,
      status: `${activeChannelName} Inquiry Sent`
    };
    saveNewOrder(newOrder);
    recordCloudOrder(newOrder);

    // Save full customer delivery profile in Customer Directory
    recordCustomerLead(customer, {
      orderId: newOrder.id,
      amount: grandTotal,
      items: cartItems,
      channel: targetChannel,
      date: newOrder.createdAt
    });

    // Track product orders in Product Analytics
    cartItems.forEach(item => {
      trackProductAction(item.id, item, 'order');
    });

    // Fire Confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.log("Confetti trigger", err);
    }

    // Open WhatsApp / Telegram
    window.open(url, '_blank');

    setOrderPlaced(true);
    setIsSubmitting(false);

    if (onOrderSuccess) {
      setTimeout(() => {
        onOrderSuccess();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-300/60 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 text-white flex items-center justify-between border-b ${
          isTelegramActive 
            ? 'bg-gradient-to-r from-sky-700 via-sky-800 to-stone-900 border-sky-500/40' 
            : 'royal-maroon-bg text-gold-100 border-gold-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm ${
              isTelegramActive ? 'bg-sky-500' : 'bg-emerald-500'
            }`}>
              {isTelegramActive ? <Send size={18} /> : <MessageCircle size={18} />}
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold tracking-wide">
                Direct {activeChannelName} Checkout
              </h2>
              <p className="text-[11px] opacity-90">
                1-Step Confirmation with Store Owner ({isTelegramActive ? `@${cleanTelegramHandle(settings.telegramUsername)}` : settings.whatsappNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {orderPlaced ? (
          /* Order Confirmation Success Screen */
          <div className="p-8 text-center space-y-5 animate-fadeIn">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${
              isTelegramActive ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <CheckCircle2 size={40} />
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Redirecting to {activeChannelName}!
              </h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto mt-2">
                Your order receipt has been prepared and {activeChannelName} has opened. Please tap <strong>Send</strong> in {activeChannelName} to submit your order to our boutique team.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 max-w-md mx-auto text-xs text-stone-700 space-y-1">
              <p className="font-bold text-amber-900">Order Reference: {customer.name}</p>
              <p>Total Bill: <strong>₹{grandTotal.toLocaleString('en-IN')}</strong></p>
              <p>Delivery To: {customer.address}, {customer.pincode}</p>
            </div>

            <button
              onClick={() => {
                setOrderPlaced(false);
                onClose();
              }}
              className="px-8 py-3 royal-maroon-bg text-gold-100 font-bold text-sm rounded-full shadow-lg hover:opacity-95 transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            {/* Quick Order Bill Strip */}
            <div className="bg-gold-50/70 border border-gold-300/80 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-brand-900" />
                  <span className="text-xs font-bold text-stone-800">
                    {cartItems.reduce((a, c) => a + c.quantity, 0)} Items in Order
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500">Subtotal: </span>
                  <span className="text-xs font-bold text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {timerDiscount > 0 && (
                <div className="flex justify-between items-center text-[11px] font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  <span>⚡ 15-Min Rush Flash Discount</span>
                  <span>-₹{timerDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between items-center text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  <span>🏷️ Promo Discount {appliedPromo ? `(${appliedPromo})` : ''}</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {freeGift && (
                <div className="flex justify-between items-center text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                  <span>🎁 Unlocked Free Gift: {freeGift}</span>
                  <span className="text-emerald-700 font-extrabold">FREE (₹0)</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1.5 border-t border-gold-300/60">
                <span className="text-xs font-extrabold text-stone-900">Total to Pay:</span>
                <span className="text-base font-extrabold text-brand-950">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Lucky Draw Status Chip */}
              {cartItems.reduce((a, c) => a + c.quantity, 0) >= 3 ? (
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2 mt-1">
                  <Sparkles size={15} className="text-emerald-600 shrink-0" />
                  <span>🎁 Festive Lucky Draw: 100% QUALIFIED for Grand Giveaway!</span>
                </div>
              ) : (
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2 mt-1">
                  <span className="text-sm">⏳</span>
                  <span>Add {3 - cartItems.reduce((a, c) => a + c.quantity, 0)} more item to qualify for Mega Lucky Draw!</span>
                </div>
              )}
            </div>

            {/* DUAL MODE CHANNEL SELECTOR (When 'both' is enabled by Admin) */}
            {settings.orderChannel === 'both' && (
              <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200 space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                  Select Your Preferred Ordering Channel:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('whatsapp')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedChannel === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('telegram')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedChannel === 'telegram'
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Send size={14} />
                    <span>Telegram</span>
                  </button>
                </div>
              </div>
            )}

            {/* Customer Inputs */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-800 flex items-center gap-1.5">
                <User size={14} />
                <span>1. Contact & Delivery Information</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sharma"
                    value={customer.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onBlur={handleInputBlur}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700 ${
                      errors.name ? 'border-rose-500' : 'border-stone-300'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] text-rose-500 mt-0.5">{errors.name}</p>}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={customer.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onBlur={handleInputBlur}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700 ${
                      errors.phone ? 'border-rose-500' : 'border-stone-300'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-rose-500 mt-0.5">{errors.phone}</p>}
                </div>
              </div>

              {/* Complete Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Delivery Address (House/Flat No, Street, Landmark) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Flat 402, Lotus Tower, Near Diamond Plaza"
                  value={customer.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700 ${
                    errors.address ? 'border-rose-500' : 'border-stone-300'
                  }`}
                />
                {errors.address && <p className="text-[10px] text-rose-500 mt-0.5">{errors.address}</p>}
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Jaipur"
                    value={customer.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    onBlur={handleInputBlur}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajasthan"
                    value={customer.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    onBlur={handleInputBlur}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 302001"
                    value={customer.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    onBlur={handleInputBlur}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700 ${
                      errors.pincode ? 'border-rose-500' : 'border-stone-300'
                    }`}
                  />
                  {errors.pincode && <p className="text-[10px] text-rose-500 mt-0.5">{errors.pincode}</p>}
                </div>
              </div>
            </div>

            {/* Payment Mode & COD Notice */}
            <div className="p-3.5 bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl border border-amber-300 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-stone-900 text-xs">
                <span className="flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>Payment Mode: 100% Safe UPI / Prepaid</span>
                </span>
                <span className="text-[10px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  ❌ COD Not Available
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Cash on Delivery (COD) is not available at this location. We accept all UPI Apps (Google Pay, PhonePe, Paytm, BHIM, QR Code) & Bank Transfer with free express insured delivery.
              </p>
            </div>

            {/* Direct Channel Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 text-white font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01] active:scale-[0.98] text-sm sm:text-base cursor-pointer ${
                  isTelegramActive
                    ? 'bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-600 hover:to-sky-800 border border-sky-300/40'
                    : 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 border border-emerald-400/40'
                }`}
              >
                {isTelegramActive ? (
                  <Send size={20} className="animate-bounce" />
                ) : (
                  <MessageCircle size={22} className="animate-bounce" />
                )}
                <span>Confirm & Send Order via {activeChannelName}</span>
                <ArrowRight size={18} />
              </button>

              <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-stone-500">
                <ShieldCheck size={14} className={isTelegramActive ? "text-sky-600" : "text-emerald-600"} />
                <span>Instant confirmation on {activeChannelName} with tracking details</span>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
