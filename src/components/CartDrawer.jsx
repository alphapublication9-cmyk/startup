import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MessageCircle, 
  Sparkles, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Gift, 
  Check, 
  ChevronRight,
  Percent,
  Send,
  Timer,
  Clock,
  Flame,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { normalizeImageUrl } from '../utils/imageUrl';
import { getLuckyDrawConfig, getCustomerAuthSession } from '../utils/luckyDraw';

export const CartDrawer = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onProceedToCheckout,
  appliedPromo, 
  setAppliedPromo,
  coupons = [],
  settings = {}
}) => {
  if (!isOpen) return null;

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccessMsg, setPromoSuccessMsg] = useState('');
  const [isGiftWrap, setIsGiftWrap] = useState(false);

  // Flash Countdown Rush Discount Settings from Admin
  const timerEnabled = settings.timerDiscountEnabled !== false;
  const timerMinutes = Number(settings.timerMinutes || 15);
  const timerDiscountType = settings.timerDiscountType || 'percentage'; // 'percentage' | 'fixed'
  const timerDiscountValue = Number(settings.timerDiscountValue ?? 10);
  const timerOfferHeading = settings.timerOfferHeading || `⚡ FLASH DEAL: Complete order in under ${timerMinutes} mins to get EXTRA ${timerDiscountType === 'percentage' ? `${timerDiscountValue}%` : `₹${timerDiscountValue}`} OFF!`;

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const storedDeadline = localStorage.getItem('aura_kurti_cart_timer_deadline');
      if (storedDeadline) {
        const diff = Math.floor((parseInt(storedDeadline, 10) - Date.now()) / 1000);
        if (diff > 0) return diff;
      }
    } catch {}
    return timerMinutes * 60;
  });

  const [isTimerExpired, setIsTimerExpired] = useState(() => {
    try {
      const storedDeadline = localStorage.getItem('aura_kurti_cart_timer_deadline');
      if (storedDeadline) {
        const diff = Math.floor((parseInt(storedDeadline, 10) - Date.now()) / 1000);
        return diff <= 0;
      }
    } catch {}
    return false;
  });

  // Initialize or maintain deadline when cart has items
  useEffect(() => {
    if (!timerEnabled || cartItems.length === 0) return;

    try {
      const storedDeadline = localStorage.getItem('aura_kurti_cart_timer_deadline');
      const now = Date.now();
      if (!storedDeadline) {
        const newDeadline = now + (timerMinutes * 60 * 1000);
        localStorage.setItem('aura_kurti_cart_timer_deadline', newDeadline.toString());
        setTimeLeft(timerMinutes * 60);
        setIsTimerExpired(false);
      } else {
        const diff = Math.floor((parseInt(storedDeadline, 10) - now) / 1000);
        if (diff <= 0) {
          setTimeLeft(0);
          setIsTimerExpired(true);
        } else {
          setTimeLeft(diff);
          setIsTimerExpired(false);
        }
      }
    } catch {}
  }, [timerEnabled, timerMinutes, cartItems.length]);

  // Tick timer every second
  useEffect(() => {
    if (!timerEnabled || isTimerExpired || cartItems.length === 0) return;

    const interval = setInterval(() => {
      try {
        const storedDeadline = localStorage.getItem('aura_kurti_cart_timer_deadline');
        if (storedDeadline) {
          const diff = Math.floor((parseInt(storedDeadline, 10) - Date.now()) / 1000);
          if (diff <= 0) {
            setTimeLeft(0);
            setIsTimerExpired(true);
            clearInterval(interval);
          } else {
            setTimeLeft(diff);
          }
        }
      } catch {}
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnabled, isTimerExpired, cartItems.length]);

  const isTelegram = settings.orderChannel === 'telegram';
  const channelLabel = isTelegram ? 'Telegram' : (settings.orderChannel === 'both' ? 'Direct 1-Click' : 'WhatsApp');

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // 1. Calculate Coupon Discount based on active promo code
  let couponDiscount = 0;
  if (appliedPromo) {
    const coupon = coupons.find(c => c.code.toUpperCase() === appliedPromo.toUpperCase());
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        couponDiscount = Math.round((subtotal * coupon.discountValue) / 100);
      } else {
        couponDiscount = Math.min(subtotal, coupon.discountValue);
      }
    } else if (appliedPromo === 'ROYAL10' || appliedPromo === 'FESTIVE10') {
      couponDiscount = Math.round(subtotal * 0.10);
    }
  }

  // 2. Calculate Flash Countdown Rush Discount
  let timerDiscount = 0;
  const isFlashOfferActive = timerEnabled && !isTimerExpired && cartItems.length > 0;
  if (isFlashOfferActive) {
    if (timerDiscountType === 'percentage') {
      timerDiscount = Math.round((subtotal * timerDiscountValue) / 100);
    } else {
      timerDiscount = Math.min(subtotal, timerDiscountValue);
    }
  }

  // 3. Smart Multi-Item Bundle Savings (Buy 2 Save ₹200, Buy 3+ Save ₹400)
  const totalItemCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);
  let bundleDiscount = 0;
  if (totalItemCount === 2) {
    bundleDiscount = 200;
  } else if (totalItemCount >= 3) {
    bundleDiscount = 400;
  }

  const totalDiscount = couponDiscount + timerDiscount + bundleDiscount;
  const giftWrapFee = isGiftWrap ? 49 : 0;
  const shippingFee = 0; // Confirmed on WhatsApp
  const grandTotal = Math.max(0, subtotal - totalDiscount + giftWrapFee);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}
  };

  const handleApplyCouponCode = (code) => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find(c => c.code.toUpperCase() === cleanCode);

    if (coupon) {
      if (subtotal < coupon.minOrderAmount) {
        setPromoError(`Requires minimum order of ₹${coupon.minOrderAmount.toLocaleString('en-IN')}`);
        setPromoSuccessMsg('');
        return;
      }
      setAppliedPromo(cleanCode);
      setPromoError('');
      setPromoSuccessMsg(`🎉 Coupon "${cleanCode}" applied successfully!`);
      triggerConfetti();
    } else if (cleanCode === 'ROYAL10' || cleanCode === 'FESTIVE10') {
      setAppliedPromo(cleanCode);
      setPromoError('');
      setPromoSuccessMsg(`🎉 Coupon "${cleanCode}" applied for 10% OFF!`);
      triggerConfetti();
    } else {
      setPromoError('Invalid coupon code. Try ROYAL10 or select a coupon below.');
      setPromoSuccessMsg('');
    }
  };

  const handleApplyPromoForm = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    handleApplyCouponCode(promoInput);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoSuccessMsg('');
    setPromoError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full sm:w-screen max-w-md bg-[#fdfcf9] shadow-2xl border-l border-gold-400 flex flex-col justify-between overflow-hidden"
        >
          
          {/* 1. DRAWER HEADER */}
          <div className="p-4 sm:p-5 royal-maroon-bg text-gold-100 flex items-center justify-between border-b border-gold-500/40">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-gold-300" />
              <h2 className="font-serif text-lg font-bold tracking-wide">
                Your Shopping Bag
              </h2>
              <span className="text-xs bg-gold-400 text-brand-950 font-extrabold px-2.5 py-0.5 rounded-full ml-1 shadow-sm">
                {cartItems.reduce((a, c) => a + c.quantity, 0)} Items
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gold-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* 2. LUXURY ASSURANCE STRIP */}
          <div className="bg-amber-50/90 px-4 py-2.5 border-b border-amber-200/80 text-xs">
            <div className="flex items-center justify-between font-bold text-amber-950">
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Truck size={14} className="text-[#700b1d]" />
                <span>⚡ Fast Pan-India Dispatch & Quality Guarantee</span>
              </span>
              <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                7-Day Exchange
              </span>
            </div>
          </div>

          {/* 3. DRAWER BODY - ITEMS LIST */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="space-y-4 py-2">
                <div className="text-center py-6 px-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                    <ShoppingBag size={24} className="text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900">Your shopping bag is empty</h3>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto mt-0.5">
                      Explore our handcrafted designer Kurtis, Sarees, and Anarkalis.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#700b1d] to-[#4c0519] text-gold-100 text-xs font-bold rounded-full shadow-md hover:opacity-95 transition-all cursor-pointer border border-gold-400/40"
                  >
                    Explore Collection
                  </button>
                </div>

                {/* Lucky Draw Grand Giveaway Showcase in Empty Cart */}
                <div className="p-4 bg-gradient-to-br from-amber-50 via-gold-50/60 to-amber-100/70 rounded-3xl border-2 border-amber-300 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-200 text-amber-950 flex items-center justify-center font-black text-xs">
                        🎁
                      </div>
                      <div>
                        <h4 className="font-heading text-xs font-black text-amber-950 uppercase tracking-wider">
                          Festive Mega Lucky Draw
                        </h4>
                        <span className="text-[10px] text-amber-900/80 font-bold block">
                          Order min 3 items to qualify
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-300">
                      3 Items to Enter
                    </span>
                  </div>

                  {/* Grand Prize Preview Card */}
                  <div className="bg-white p-3 rounded-2xl border border-amber-200/80">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-20 rounded-xl overflow-hidden border border-amber-300 bg-stone-50 shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
                          alt="Heritage Pure Katan Banarasi Silk Saree"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md uppercase">
                          Grand Prize (Worth ₹4,999)
                        </span>
                        <h5 className="font-heading text-xs font-bold text-stone-900 mt-0.5 line-clamp-1">
                          Heritage Pure Katan Banarasi Silk Saree
                        </h5>
                        <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5">
                          Handcrafted pure zari silk saree with designer blouse piece free for lucky winner.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* ⚡ 15-MINUTE SALES COUNTDOWN RUSH DISCOUNT BANNER */}
                {timerEnabled && (
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    isTimerExpired
                      ? 'bg-stone-100/90 border-stone-300 text-stone-700'
                      : 'bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-amber-300/90 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                          isTimerExpired 
                            ? 'bg-stone-300 text-stone-600' 
                            : 'bg-gradient-to-tr from-amber-600 to-rose-600 text-white animate-pulse'
                        }`}>
                          {isTimerExpired ? <Clock size={18} /> : <Flame size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                              {isTimerExpired ? '⏳ Flash Offer Ended' : '⚡ 15-Min Rush Deal!'}
                            </span>
                            {!isTimerExpired && (
                              <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                                {timerDiscountType === 'percentage' ? `${timerDiscountValue}% OFF` : `₹${timerDiscountValue} OFF`}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600 font-medium line-clamp-2 mt-0.5 leading-tight">
                            {isTimerExpired
                              ? 'Rush discount expired. Complete order now before selected sizes run out!'
                              : (settings.timerOfferHeading || `Order in under ${timerMinutes} mins to save ₹${timerDiscount.toLocaleString('en-IN')} on your shopping bag!`)}
                          </p>
                        </div>
                      </div>

                      {/* Digital Countdown Timer Display */}
                      <div className="text-right shrink-0">
                        {!isTimerExpired ? (
                          <div className="inline-flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-brand-950 bg-white/95 border border-amber-300 px-2.5 py-1.5 rounded-xl shadow-xs">
                            <Clock size={13} className="text-rose-600 animate-spin" style={{ animationDuration: '4s' }} />
                            <span>{formatTimer(timeLeft)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-500 font-mono font-bold bg-stone-200/80 px-2 py-1 rounded-lg">
                            00:00
                          </span>
                        )}
                        <p className="text-[9px] text-amber-900/80 font-bold mt-0.5">
                          {isTimerExpired ? 'Offer Expired' : 'Rush Countdown'}
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Countdown Progress Bar */}
                    {!isTimerExpired && (
                      <div className="w-full bg-amber-200/70 h-1.5 rounded-full overflow-hidden mt-2.5">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-1000 ease-linear rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, (timeLeft / (timerMinutes * 60)) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 🛍️ SMART MULTI-KURTI BUNDLE & SAVE METER */}
                {totalItemCount > 0 && (
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-100/60 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-extrabold text-xs text-emerald-950">
                        <div className="w-6 h-6 rounded-lg bg-emerald-200 text-emerald-900 flex items-center justify-center font-black text-xs">
                          ✨
                        </div>
                        <span>Smart Multi-Kurti Bundle Deal</span>
                      </div>
                      {totalItemCount >= 3 ? (
                        <span className="text-[10px] font-black text-emerald-900 bg-emerald-200/90 px-2.5 py-0.5 rounded-full border border-emerald-400 flex items-center gap-1 shadow-2xs">
                          🎉 MAX ₹400 OFF ACTIVE
                        </span>
                      ) : totalItemCount === 2 ? (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          ✓ ₹200 SAVINGS ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          +1 Item for ₹200 OFF
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                        <span>
                          {totalItemCount === 1 
                            ? 'Add 1 more item to get Flat ₹200 OFF' 
                            : totalItemCount === 2 
                            ? 'Add 1 more item for Flat ₹400 OFF' 
                            : 'Tier 3 Super Saver Bundle Active'}
                        </span>
                        <span className="text-emerald-900 font-extrabold">
                          {totalItemCount >= 3 ? 'Saved ₹400 Extra' : totalItemCount === 2 ? 'Saved ₹200 Extra' : 'Unlock ₹200'}
                        </span>
                      </div>

                      {/* Multi-tier step meter */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <div className={`h-2 rounded-full transition-all ${totalItemCount >= 1 ? 'bg-emerald-500' : 'bg-stone-200'}`} title="1 Item" />
                        <div className={`h-2 rounded-full transition-all ${totalItemCount >= 2 ? 'bg-emerald-500' : 'bg-stone-200'}`} title="2 Items - ₹200 OFF" />
                        <div className={`h-2 rounded-full transition-all ${totalItemCount >= 3 ? 'bg-emerald-600 shadow-xs' : 'bg-stone-200'}`} title="3 Items - ₹400 OFF" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 🎁 FESTIVE ROYAL LUCKY DRAW LIVE CART METER */}
                {(() => {
                  const totalItemCount = cartItems.reduce((acc, c) => acc + c.quantity, 0);
                  const luckyConfig = getLuckyDrawConfig();
                  const minDrawItems = luckyConfig.minProductsRequired || 3;
                  const isDrawEligible = totalItemCount >= minDrawItems;
                  const luckyUser = getCustomerAuthSession();

                  return (
                    <div className="p-3.5 bg-gradient-to-br from-amber-50 via-gold-50/60 to-amber-100/70 rounded-2xl border-2 border-amber-300 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-extrabold text-xs text-amber-950">
                          <div className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs">
                            🎁
                          </div>
                          <span>Festive Lucky Draw Contest</span>
                        </div>
                        {isDrawEligible ? (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                            <Check size={12} className="text-emerald-700" />
                            <span>100% QUALIFIED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-300/80">
                            ⏳ Need {minDrawItems - totalItemCount} more
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                          <span>{totalItemCount} / {minDrawItems} Products in Bag</span>
                          <span className="text-amber-900 font-extrabold">
                            {isDrawEligible ? '🎉 Golden Ticket Activated!' : `${Math.round((totalItemCount / minDrawItems) * 100)}% Complete`}
                          </span>
                        </div>

                        <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-amber-300 shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDrawEligible ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, (totalItemCount / minDrawItems) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Grand Prize Preview */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200 text-xs gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {luckyConfig.prizes?.[0]?.image ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-300 shrink-0 bg-stone-100 shadow-2xs">
                              <img 
                                src={normalizeImageUrl(luckyConfig.prizes[0].image)} 
                                alt="Prize" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <span className="text-xl shrink-0">👑</span>
                          )}
                          <div className="min-w-0">
                            <span className="text-[9px] text-amber-900/80 font-extrabold block uppercase tracking-wider">
                              👑 Grand Giveaway Prize
                            </span>
                            <strong className="text-stone-900 text-xs font-bold truncate block">
                              {isDrawEligible 
                                ? (luckyUser ? `Ticket #${luckyUser.ticketNumber} Qualifies for ${luckyConfig.prizes?.[0]?.title || 'Banarasi Saree'}` : (luckyConfig.prizes?.[0]?.title || 'Heritage Pure Banarasi Silk Saree'))
                                : (luckyConfig.prizes?.[0]?.title ? `${luckyConfig.prizes[0].title} (${luckyConfig.prizes[0].worth || '₹4,999'})` : 'Pure Katan Banarasi Saree (Worth ₹4,999)')}
                            </strong>
                          </div>
                        </div>
                        {!isDrawEligible && (
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] rounded-lg border border-amber-300 shrink-0 cursor-pointer shadow-2xs"
                          >
                            + Add Items
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div 
                      key={`${item.id}-${item.selectedSize}`}
                      className="bg-white p-3.5 rounded-2xl border border-[#ebdcc7] shadow-xs flex gap-3.5 items-center group"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                        <img
                          src={normalizeImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Size: <strong className="text-brand-950 font-bold">{item.selectedSize}</strong> • {item.fabric || "Silk / Cotton"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-extrabold text-sm text-brand-950">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1 border border-stone-200">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                              className="w-6 h-6 rounded bg-white text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold px-1 text-stone-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-white text-stone-700 hover:text-brand-900 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id, item.selectedSize)}
                        className="text-stone-300 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 4. COUPON & PROMO CODE SECTION */}
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                    <span className="flex items-center gap-1">
                      <Tag size={13} className="text-amber-700" />
                      <span>Apply Luxury Promo Code</span>
                    </span>
                    {appliedPromo && (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[11px] text-rose-700 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Promo Input */}
                  {!appliedPromo ? (
                    <form onSubmit={handleApplyPromoForm} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon (e.g. ROYAL10)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-amber-600 text-stone-900"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 royal-maroon-bg text-gold-100 font-bold text-xs rounded-xl hover:opacity-95 transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                  ) : (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-600" />
                        <span>Code <strong>{appliedPromo}</strong> Applied (-₹{couponDiscount.toLocaleString('en-IN')})</span>
                      </span>
                      <Check size={16} className="text-emerald-600" />
                    </div>
                  )}

                  {promoError && (
                    <p className="text-[11px] text-rose-700 font-semibold">{promoError}</p>
                  )}
                  {promoSuccessMsg && (
                    <p className="text-[11px] text-emerald-700 font-bold">{promoSuccessMsg}</p>
                  )}

                  {/* Clickable Quick Coupon Chips */}
                  {!appliedPromo && coupons.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Available Offers:</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {coupons.filter(c => c.isActive).map((coup) => (
                          <button
                            key={coup.code}
                            type="button"
                            onClick={() => handleApplyCouponCode(coup.code)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>🏷️ {coup.code}</span>
                            <span className="text-stone-400">({coup.discountType === 'percentage' ? `${coup.discountValue}% OFF` : `₹${coup.discountValue} OFF`})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. GIFT WRAP OPTION */}
                <label className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-xl cursor-pointer hover:border-gold-400 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Gift size={18} className="text-amber-700" />
                    <div>
                      <p className="text-xs font-bold text-stone-900">Boutique Luxury Gift Packaging</p>
                      <p className="text-[10px] text-stone-500">Royal ribbon box & custom greeting note (+₹49)</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isGiftWrap}
                    onChange={(e) => setIsGiftWrap(e.target.checked)}
                    className="rounded text-brand-900 w-4 h-4"
                  />
                </label>
              </>
            )}
          </div>

          {/* 6. DRAWER FOOTER & TOTALS */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-[#ebdcc7] space-y-3 shadow-lg">
              
              {/* Calculations */}
              <div className="space-y-1.5 text-xs text-stone-600 border-b border-stone-100 pb-3">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {/* ⚡ 15-Minute Rush Discount Line */}
                {timerDiscount > 0 && (
                  <div className="flex justify-between text-amber-900 font-extrabold bg-gradient-to-r from-amber-50 to-rose-50 px-2 py-1 rounded-lg border border-amber-200/80">
                    <span className="flex items-center gap-1">
                      <Flame size={13} className="text-rose-600" />
                      <span>15-Min Rush Deal ({timerDiscountType === 'percentage' ? `${timerDiscountValue}% OFF` : `₹${timerDiscountValue} OFF`})</span>
                    </span>
                    <span>-₹{timerDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Bundle Savings Line */}
                {bundleDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span className="flex items-center gap-1">
                      <span>🎁 Multi-Kurti Bundle Deal</span>
                    </span>
                    <span>-₹{bundleDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Coupon Discount Line */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Coupon Discount {appliedPromo ? `(${appliedPromo})` : ''}</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {isGiftWrap && (
                  <div className="flex justify-between text-stone-700">
                    <span>Gift Packaging</span>
                    <span>₹49</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Estimated Delivery</span>
                  <span className="text-[#700b1d] font-bold bg-rose-50 px-2 py-0.5 rounded-md text-[11px] border border-rose-200">
                    Calculated on WhatsApp
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-stone-200 text-sm sm:text-base font-extrabold text-stone-950">
                  <div>
                    <span>Grand Total (GST Incl.)</span>
                    <p className="text-[10px] text-stone-500 font-normal mt-0.5">*Delivery charge confirmed on WhatsApp</p>
                  </div>
                  <span className="font-heading text-lg sm:text-xl text-brand-950 font-black tracking-tight whitespace-nowrap shrink-0 pl-2">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout({
                    subtotal,
                    discountAmount: totalDiscount,
                    bundleDiscount,
                    couponDiscount,
                    timerDiscount,
                    appliedPromo,
                    giftWrapFee,
                    shippingFee,
                    grandTotal
                  });
                }}
                className={`w-full py-4 text-white font-extrabold text-sm rounded-2xl shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  isTelegram ? 'bg-sky-600 hover:bg-sky-700' : 'royal-maroon-bg text-gold-100'
                }`}
              >
                {isTelegram ? <Send size={18} /> : <MessageCircle size={18} className="text-gold-300" />}
                <span>Instant 1-Click {channelLabel} Order</span>
                <ArrowRight size={16} />
              </button>

              {/* Guarantee */}
              <div className="flex items-center justify-center gap-3 text-[10px] text-stone-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  100% Genuine Handcrafted
                </span>
                <span>•</span>
                <span>7-Day Easy Exchange</span>
                <span>•</span>
                <span>Fast Dispatch</span>
              </div>

            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
};

