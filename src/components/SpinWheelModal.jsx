import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Gift, 
  Trophy, 
  Copy, 
  Check, 
  ShoppingBag, 
  MessageCircle, 
  Lock, 
  User, 
  Phone, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Flame, 
  ArrowRight,
  ShieldCheck,
  Tag,
  PartyPopper,
  Crown,
  RotateCcw,
  Clock,
  Timer,
  LogOut
} from 'lucide-react';
import { 
  getSpinWheelConfig, 
  getUserSpinStatus,
  recordUserSpinWin,
  DEFAULT_WHEEL_SLICES
} from '../utils/spinWheel';
import { 
  getCustomerAuthSession, 
  setCustomerAuthSession,
  registerLuckyDrawUser, 
  loginLuckyDrawUser 
} from '../utils/luckyDraw';
import { normalizeImageUrl } from '../utils/imageUrl';

// Helper to get punchy, large readable display title on wheel
const getWheelDisplayLabel = (slice) => {
  if (slice.wheelLabel) return slice.wheelLabel;
  const lbl = slice.label || '';
  if (lbl.includes('Banarasi')) return 'Silk Dupatta';
  if (lbl.includes('500')) return '₹500 OFF';
  if (lbl.includes('Kurti')) return 'Silk Kurti';
  if (lbl.includes('25%')) return '25% OFF';
  if (lbl.includes('Kundan')) return 'Kundan Set';
  if (lbl.includes('300')) return '₹300 OFF';
  if (lbl.includes('Anarkali')) return 'Anarkali Suit';
  if (lbl.includes('Shipping') || lbl.includes('Delivery')) return 'Free Delivery';
  return lbl.length > 13 ? lbl.slice(0, 12) + '…' : lbl;
};

export const SpinWheelModal = ({ 
  isOpen, 
  onClose, 
  onOpenStoreCatalog,
  onApplyCouponCode 
}) => {
  const [config, setConfig] = useState(getSpinWheelConfig);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [showWinClaim, setShowWinClaim] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  
  // 15-Minute Live Urgency Timer
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 900 seconds = 15 minutes

  // Customer Auth & 1-Spin Per User Status
  const [currentUser, setCurrentUser] = useState(getCustomerAuthSession);
  const [userSpinStatus, setUserSpinStatus] = useState({ hasSpun: false, prize: null });
  const [authTab, setAuthTab] = useState('register'); // 'register' | 'login'
  const [authFormData, setAuthFormData] = useState({
    name: '',
    phone: '',
    password: '',
    city: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Slices from config or default
  const rawSlices = (config.slices && config.slices.length >= 4) ? config.slices : DEFAULT_WHEEL_SLICES;
  const slices = rawSlices;
  const totalSlices = slices.length;
  const sliceAngle = 360 / totalSlices;

  // Initialize and check user spin status whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setConfig(getSpinWheelConfig());
      const sessionUser = getCustomerAuthSession();
      setCurrentUser(sessionUser);
      setAuthError('');
      setAuthSuccessMsg('');

      if (sessionUser) {
        const status = getUserSpinStatus(sessionUser);
        setUserSpinStatus(status);
        if (status.hasSpun && status.prize) {
          setWonPrize(status.prize);
          setShowWinClaim(true);
        } else {
          setWonPrize(null);
          setShowWinClaim(false);
        }
      } else {
        setUserSpinStatus({ hasSpun: false, prize: null });
        setWonPrize(null);
        setShowWinClaim(false);
      }
    }
  }, [isOpen]);

  // 15-Minute Countdown Effect
  useEffect(() => {
    let timer = null;
    if (showWinClaim && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showWinClaim, timeLeft]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Spin Action: Automated, Fair & 100% Mathematically Aligned with Pointer
  const handleSpinWheel = () => {
    if (isSpinning) return;

    // 1. Check if user is logged in
    const activeUser = currentUser || getCustomerAuthSession();
    if (!activeUser) {
      setAuthError('👉 Please enter your Name & Mobile Number below to unlock your 1 Free Spin!');
      const formEl = document.getElementById('spin-auth-form-card');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 2. Check if this user has already used their 1 spin limit
    const status = getUserSpinStatus(activeUser);
    if (status.hasSpun) {
      setUserSpinStatus(status);
      setWonPrize(status.prize);
      setShowWinClaim(true);
      setAuthError(`✨ You have already used your 1 Free VIP Spin with mobile number ${activeUser.phone}. Your won prize is shown below!`);
      return;
    }

    setIsSpinning(true);
    setShowWinClaim(false);
    setWonPrize(null);
    setConfettiActive(false);
    setTimeLeft(15 * 60); // Reset 15 minute timer on spin

    // Pick random slice index [0 ... totalSlices - 1]
    const prizeIndex = Math.floor(Math.random() * totalSlices);
    const targetSlice = slices[prizeIndex];

    // Mathematical Pointer Alignment:
    // Top pointer is at 270° (North in standard SVG coordinates where 0° = East).
    const sliceCenterAngle = prizeIndex * sliceAngle + (sliceAngle / 2);
    let targetOffset = (270 - sliceCenterAngle) % 360;
    if (targetOffset < 0) targetOffset += 360;

    const currentMod = rotation % 360;
    let diff = targetOffset - currentMod;
    if (diff <= 0) diff += 360;

    // Minimum 5 full spins (1800°) + exact slice offset + tiny jitter for realism
    const extraSpins = (5 + Math.floor(Math.random() * 2)) * 360;
    const jitter = (Math.random() * (sliceAngle * 0.3)) - (sliceAngle * 0.15);
    const targetRotation = rotation + extraSpins + diff + jitter;

    setRotation(targetRotation);

    // Spin animation duration 4.5 seconds
    setTimeout(async () => {
      setIsSpinning(false);
      setWonPrize(targetSlice);
      setShowWinClaim(true);
      setConfettiActive(true);

      // Permanently record spin tied to this logged in customer
      try {
        const result = await recordUserSpinWin({ prize: targetSlice, user: activeUser });
        if (result?.user) {
          setCurrentUser(result.user);
          setUserSpinStatus({ hasSpun: true, prize: targetSlice, wonAt: new Date().toISOString() });
        }
      } catch (err) {
        console.error("Error recording user spin win:", err);
      }
    }, 4500);
  };

  // Auth Submit Handler (Register or Login)
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (authTab === 'register') {
      const res = registerLuckyDrawUser({
        name: authFormData.name,
        phone: authFormData.phone,
        password: authFormData.password,
        city: authFormData.city
      });
      if (!res.success) {
        setAuthError(res.error);
        return;
      }

      setCurrentUser(res.user);
      const status = getUserSpinStatus(res.user);
      setUserSpinStatus(status);

      if (status.hasSpun && status.prize) {
        setWonPrize(status.prize);
        setShowWinClaim(true);
        setAuthSuccessMsg(`🎉 Welcome ${res.user.name}! Your previously won coupon is retrieved.`);
      } else {
        setAuthSuccessMsg(`🎉 Account verified! Your 1 VIP Free Spin is UNLOCKED! Tap SPIN now!`);
      }
    } else {
      const res = loginLuckyDrawUser(authFormData.phone, authFormData.password);
      if (!res.success) {
        setAuthError(res.error);
        return;
      }

      setCurrentUser(res.user);
      const status = getUserSpinStatus(res.user);
      setUserSpinStatus(status);

      if (status.hasSpun && status.prize) {
        setWonPrize(status.prize);
        setShowWinClaim(true);
        setAuthSuccessMsg(`🎉 Welcome back ${res.user.name}! Your won coupon reward is shown below.`);
      } else {
        setAuthSuccessMsg(`🎉 Welcome back ${res.user.name}! Your 1 VIP Free Spin is UNLOCKED! Tap SPIN to play!`);
      }
    }
  };

  // Handle Logout / Switch Account
  const handleSwitchAccount = () => {
    setCustomerAuthSession(null);
    setCurrentUser(null);
    setUserSpinStatus({ hasSpun: false, prize: null });
    setWonPrize(null);
    setShowWinClaim(false);
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthFormData({ name: '', phone: '', password: '', city: '' });
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    if (onApplyCouponCode) onApplyCouponCode(code);
    setTimeout(() => setCopiedCoupon(false), 3000);
  };

  if (!isOpen) return null;

  // Generate 16 decorative gold perimeter pins around rim
  const rimPins = Array.from({ length: 16 }).map((_, idx) => {
    const angle = (idx * 360 / 16) * (Math.PI / 180);
    const x = 50 + 46.5 * Math.cos(angle);
    const y = 50 + 46.5 * Math.sin(angle);
    return { x, y };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl bg-[#fdfcf9] text-stone-900 rounded-3xl border-2 border-amber-400 shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Celebration Confetti on Win */}
        {confettiActive && (
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            <div className="absolute top-2 left-10 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping opacity-80"></div>
            <div className="absolute top-6 left-1/4 w-3 h-3 bg-rose-400 rotate-12 animate-bounce opacity-90"></div>
            <div className="absolute top-4 right-1/4 w-3.5 h-3.5 bg-purple-500 rounded-full animate-pulse opacity-85"></div>
            <div className="absolute top-10 right-16 w-3 h-2 bg-emerald-500 rotate-45 animate-bounce opacity-80"></div>
            <div className="absolute top-16 left-1/3 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-12 right-1/3 w-4 h-2 bg-blue-500 rotate-12 animate-pulse opacity-80"></div>
          </div>
        )}

        {/* Top Header Bar - Royal White & Gold */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/60 relative z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-gold-400 to-amber-600 text-brand-950 flex items-center justify-center shadow-md font-black text-xl border border-amber-200">
              🎡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                  VIP Royal Spin
                </span>
                <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200 hidden sm:inline">
                  🔒 1 Spin Limit Per Customer
                </span>
                {showWinClaim && (
                  <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 animate-pulse">
                    <Flame size={12} className="text-rose-500" />
                    <span>CLAIM WITHIN 15 MIN: {formatCountdown(timeLeft)}</span>
                  </span>
                )}
              </div>
              <h2 className="font-heading text-base sm:text-lg font-black text-brand-950 tracking-wide mt-0.5 line-clamp-1">
                {config.title || "Spin the Royal Wheel to Win Guaranteed Gifts!"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer border border-stone-200 active:scale-90"
            aria-label="Close Spin Wheel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Main Body: 2 Columns */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-[#faf8f5]">
          
          {/* LEFT COLUMN: THE ROYAL SPIN WHEEL */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-3 relative py-2">
            
            {/* Top Indicator Arrow (Pointing Down onto Top Slice) */}
            <div className="relative z-30 flex flex-col items-center -mb-5">
              <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-amber-500 drop-shadow-[0_4px_12px_rgba(217,119,6,0.85)]"></div>
              <div className="w-4 h-4 rounded-full bg-white border-2 border-amber-600 -mt-7 shadow-md"></div>
            </div>

            {/* Wheel Outer Chassis */}
            <div className="relative w-76 h-76 sm:w-92 sm:h-92 md:w-[380px] md:h-[380px] rounded-full p-3 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-[0_12px_40px_rgba(217,119,6,0.4)] border-4 border-amber-200 flex items-center justify-center">
              
              {/* Decorative Perimeter Lights / Jewel Pins */}
              {rimPins.map((pin, i) => (
                <div 
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full bg-white border border-amber-700 shadow-[0_0_5px_rgba(255,255,255,1)] pointer-events-none"
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}

              {/* Rotating Wheel Canvas / SVG */}
              <div
                className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-stone-900"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {slices.map((slice, i) => {
                    const startAngle = (i * sliceAngle * Math.PI) / 180;
                    const endAngle = ((i + 1) * sliceAngle * Math.PI) / 180;
                    const x1 = 200 + 200 * Math.cos(startAngle);
                    const y1 = 200 + 200 * Math.sin(startAngle);
                    const x2 = 200 + 200 * Math.cos(endAngle);
                    const y2 = 200 + 200 * Math.sin(endAngle);
                    const textAngle = i * sliceAngle + sliceAngle / 2;

                    // Alternating rich jewel boutique color palette
                    const defaultSliceColors = [
                      '#800020', '#c2410c', '#15803d', '#991b1b', 
                      '#86198f', '#0f766e', '#581c87', '#1d4ed8'
                    ];
                    const sliceFill = slice.color || defaultSliceColors[i % defaultSliceColors.length];
                    const displayTitle = getWheelDisplayLabel(slice);

                    return (
                      <g key={slice.id || i}>
                        {/* Slice Wedge */}
                        <path
                          d={`M 200 200 L ${x1} ${y1} A 200 200 0 0 1 ${x2} ${y2} Z`}
                          fill={sliceFill}
                          stroke="#fef08a"
                          strokeWidth="2.5"
                        />

                        {/* Radial Slice Content (Clean & Large without Clutter) */}
                        <g transform={`translate(200, 200) rotate(${textAngle})`}>
                          
                          {/* Large Bold Slice Title */}
                          <text
                            x="128"
                            y="-5"
                            fill="#ffffff"
                            fontSize="14.5"
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            letterSpacing="0.3px"
                            style={{ 
                              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.95))'
                            }}
                          >
                            {displayTitle}
                          </text>

                          {/* Value / Worth Subtext Badge */}
                          <text
                            x="128"
                            y="14"
                            fill="#fef08a"
                            fontSize="12"
                            fontWeight="800"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            style={{ 
                              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.95))'
                            }}
                          >
                            {slice.worth || slice.subtext || 'Gift'}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Inner subtle gold rim */}
                  <circle cx="200" cy="200" r="198" fill="none" stroke="#fef08a" strokeWidth="3" opacity="0.85" />
                </svg>
              </div>

              {/* Central 3D Spin Button Hub (Contextual based on Login & Spin Status) */}
              <button
                type="button"
                onClick={handleSpinWheel}
                disabled={isSpinning || (currentUser && userSpinStatus.hasSpun)}
                className={`absolute w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white cursor-pointer active:scale-95 transition-all z-20 group disabled:cursor-not-allowed ${
                  !currentUser
                    ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-stone-900 animate-pulse'
                    : userSpinStatus.hasSpun
                      ? 'bg-gradient-to-br from-emerald-100 to-stone-200 text-emerald-950 opacity-90'
                      : 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 hover:from-amber-100 hover:to-amber-400 text-brand-950 ring-4 ring-amber-300/60 animate-pulse'
                }`}
              >
                {!currentUser ? (
                  <>
                    <Lock size={16} className="text-amber-950 mb-0.5" />
                    <span className="font-black text-[11px] leading-tight">LOGIN</span>
                    <span className="text-[7.5px] font-black text-amber-950/90 tracking-tighter">TO SPIN</span>
                  </>
                ) : userSpinStatus.hasSpun ? (
                  <>
                    <Check size={18} className="text-emerald-800" />
                    <span className="font-black text-[10px] leading-tight mt-0.5">CLAIMED</span>
                    <span className="text-[7px] font-bold text-stone-600 tracking-tighter">1 SPIN USED</span>
                  </>
                ) : (
                  <>
                    <Crown size={18} className="text-brand-950 group-hover:scale-125 transition-transform" />
                    <span className="font-black text-[13px] leading-tight mt-0.5">
                      {isSpinning ? 'LUCKY...' : 'SPIN'}
                    </span>
                    <span className="text-[8px] font-black text-amber-950/90 -mt-0.5 tracking-tighter">
                      100% FREE
                    </span>
                  </>
                )}
              </button>

            </div>

            {/* Subtext under Wheel */}
            <p className="text-[11px] text-stone-600 text-center font-semibold max-w-xs">
              {!currentUser ? (
                <span className="text-amber-900 font-bold flex items-center justify-center gap-1">
                  <Lock size={12} /> Please login with Mobile Number to unlock your 1 Free Spin!
                </span>
              ) : userSpinStatus.hasSpun ? (
                <span className="text-emerald-800 font-bold flex items-center justify-center gap-1">
                  ✓ 1 Spin Limit: Reward linked to +91 {currentUser.phone}!
                </span>
              ) : (
                <span className="text-amber-900 font-bold flex items-center justify-center gap-1">
                  ✨ 1 VIP Spin Unlocked for {currentUser.name}! Tap Center to Play!
                </span>
              )}
            </p>
          </div>

          {/* RIGHT COLUMN: CUSTOMER AUTH & PRIZE CLAIM VIEW */}
          <div className="lg:col-span-6 max-h-[72vh] lg:max-h-[500px] overflow-y-auto pr-1 pt-0.5">
            
            {/* ------------------------------------------------------------- */}
            {/* VIEW 1: USER NOT LOGGED IN -> MANDATORY LOGIN / REGISTRATION   */}
            {/* ------------------------------------------------------------- */}
            {!currentUser && (
              <div 
                id="spin-auth-form-card" 
                className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300 text-stone-900 space-y-4 shadow-md"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-amber-100">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-lg shadow-inner shrink-0">
                    <Lock size={20} className="text-amber-800" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm sm:text-base font-bold text-brand-950">
                      Step 1: Login to Unlock 1 Free Spin
                    </h3>
                    <p className="text-[11px] text-stone-600">
                      Enter your mobile number to verify and claim your guaranteed reward!
                    </p>
                  </div>
                </div>

                {/* Tab Switcher: New Customer vs Existing Login */}
                <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-bold shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setAuthError('');
                    }}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                      authTab === 'register'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-brand-950 shadow-sm font-black'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>New Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError('');
                    }}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                      authTab === 'login'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-brand-950 shadow-sm font-black'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Lock size={13} />
                    <span>Existing Login</span>
                  </button>
                </div>

                {/* Error Banner */}
                {authError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <AlertCircle size={15} className="shrink-0 text-rose-600" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {authSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <Check size={15} className="shrink-0 text-emerald-600" />
                    <span>{authSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                  {authTab === 'register' && (
                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Radhika Sharma"
                          value={authFormData.name}
                          onChange={(e) => setAuthFormData({ ...authFormData, name: e.target.value })}
                          className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white text-xs shadow-2xs"
                        />
                        <User size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                        Mobile Number (Your ID) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="10-digit mobile"
                          value={authFormData.phone}
                          onChange={(e) => setAuthFormData({ ...authFormData, phone: e.target.value })}
                          className="w-full pl-8 pr-2 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white font-mono text-xs shadow-2xs"
                        />
                        <Phone size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                        {authTab === 'register' ? 'Set Password' : 'Password'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Password"
                          value={authFormData.password}
                          onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                          className="w-full pl-8 pr-7 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white text-xs shadow-2xs"
                        />
                        <KeyRound size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {authTab === 'register' && (
                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                        City & State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Jaipur, Rajasthan"
                        value={authFormData.city}
                        onChange={(e) => setAuthFormData({ ...authFormData, city: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white text-xs shadow-2xs"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-brand-950 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-amber-300"
                  >
                    <ShieldCheck size={16} />
                    <span>{authTab === 'register' ? 'Verify & Unlock My 1 Free VIP Spin' : 'Login & Unlock My 1 Free VIP Spin'}</span>
                  </button>
                </form>

                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-stone-600 space-y-1">
                  <div className="flex items-center gap-1 font-bold text-stone-900">
                    <span>🎁 1 Guaranteed Prize on Every Verified Mobile:</span>
                  </div>
                  <p>
                    Banarasi Silk Dupattas, Pure Silk Kurtis, Kundan Jewelry Sets, or Flat ₹500 & ₹300 Instant Cash Discounts.
                  </p>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 2: LOGGED IN & SPIN IS READY (HAS NOT SPUN YET)          */}
            {/* ------------------------------------------------------------- */}
            {currentUser && !userSpinStatus.hasSpun && !isSpinning && !wonPrize && (
              <div className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-amber-300 shadow-md text-center space-y-4">
                
                {/* User Session Profile Header */}
                <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-8 h-8 rounded-full bg-[#700b1d] text-gold-200 flex items-center justify-center font-bold text-xs shadow-xs">
                      {currentUser.name?.[0] || 'U'}
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Logged In:</span>
                      <strong className="text-stone-900">{currentUser.name} (+91 {currentUser.phone})</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/60 transition-colors text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Switch Account / Logout"
                  >
                    <LogOut size={12} />
                    <span>Switch</span>
                  </button>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 border-2 border-amber-200 flex items-center justify-center mx-auto text-2xl shadow-md">
                  👑
                </div>

                <div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full uppercase tracking-wider inline-block border border-emerald-300">
                    🎉 1 VIP Free Spin Unlocked!
                  </span>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-stone-900 mt-1">
                    Ready to Spin, {currentUser.name}?
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Your 1 guaranteed reward spin is ready. Tap the button below to roll the fortune wheel!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-1">
                  <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200">
                    <span className="text-base">👗</span>
                    <h5 className="font-bold text-xs text-stone-900 mt-0.5">Designer Outfits</h5>
                    <p className="text-[10px] text-stone-500">Banarasi Dupattas & Kurtis</p>
                  </div>
                  <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200">
                    <span className="text-base">🎟️</span>
                    <h5 className="font-bold text-xs text-stone-900 mt-0.5">Instant Vouchers</h5>
                    <p className="text-[10px] text-stone-500">Flat ₹500 & ₹300 Coupons</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSpinWheel}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-brand-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-amber-300 animate-pulse"
                >
                  <Crown size={18} />
                  <span>Tap to Spin the Wheel Now</span>
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 3: SPINNING ANIMATION                                    */}
            {/* ------------------------------------------------------------- */}
            {isSpinning && (
              <div className="p-8 bg-white rounded-3xl border border-amber-300 text-center space-y-4 shadow-md animate-pulse">
                <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto text-3xl">
                  🎰
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-stone-900 tracking-wider uppercase">
                  Rolling Fortune Wheel...
                </h3>
                <p className="text-xs text-stone-600">
                  Selecting your lucky surprise boutique reward for {currentUser?.name || 'you'}. Please wait while the wheel decelerates!
                </p>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 4: WON PRIZE / ALREADY SPUN CLAIM CARD                   */}
            {/* ------------------------------------------------------------- */}
            {showWinClaim && wonPrize && (
              <div className="space-y-3 animate-fadeIn">
                
                {/* 15-MINUTE URGENCY BANNER */}
                <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg border border-red-400/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner shrink-0">
                      <Flame size={20} className="text-yellow-300 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider block text-yellow-200">
                        ⚡ LIMITED TIME DEAL
                      </span>
                      <h4 className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                        OFFER AVAILABLE FOR ONLY 15 MIN!
                      </h4>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-yellow-200 block font-extrabold uppercase">Order Within:</span>
                    <span className="font-mono text-sm sm:text-base font-black text-white bg-black/50 px-2.5 py-0.5 rounded-lg border border-yellow-300/50 tracking-widest inline-block shadow-inner">
                      {formatCountdown(timeLeft)}
                    </span>
                  </div>
                </div>

                {/* Luxury Prize Reward Card */}
                <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100/80 text-stone-900 p-3.5 rounded-3xl border-2 border-amber-400 shadow-md space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-amber-400 bg-white shadow-md shrink-0 flex items-center justify-center">
                      {wonPrize.image ? (
                        <img
                          src={normalizeImageUrl(wonPrize.image)}
                          alt={wonPrize.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                      ) : (
                        <span className="text-3xl">🎁</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block border border-amber-300">
                          🎉 You Won!
                        </span>
                        {wonPrize.minOrderAmount > 0 && (
                          <span className="text-[9px] font-extrabold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            Min. Order ₹{wonPrize.minOrderAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-sm sm:text-base font-bold text-brand-950 mt-1 line-clamp-1">
                        {wonPrize.label}
                      </h3>
                      <p className="text-xs font-black text-amber-800">
                        Value: {wonPrize.worth} • {wonPrize.subtext || `Applies on ₹${(wonPrize.minOrderAmount || 1499).toLocaleString('en-IN')}+`}
                      </p>
                    </div>
                  </div>

                  {/* Promo Code Box with 1-Click Copy */}
                  <div className="bg-white p-2.5 rounded-2xl border border-amber-300 flex items-center justify-between gap-2 shadow-xs">
                    <div className="min-w-0">
                      <span className="text-[9px] text-stone-500 uppercase tracking-wider block font-bold">
                        Exclusive Promo Code:
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-black text-brand-950 truncate block">
                        {wonPrize.couponCode || 'LUCKYGIFT'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(wonPrize.couponCode)}
                      className="px-3 py-1.5 bg-brand-900 hover:bg-brand-950 text-gold-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                    >
                      {copiedCoupon ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCoupon ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                {/* Account Linked Details & Action Buttons */}
                {currentUser && (
                  <div className="bg-white rounded-3xl p-4 border border-emerald-300 text-stone-900 space-y-3 shadow-md">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          ✓
                        </div>
                        <div>
                          <span className="text-[9px] text-emerald-700 font-bold block">Reward Linked to Account:</span>
                          <strong className="text-xs text-stone-900">{currentUser.name} (+91 {currentUser.phone})</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSwitchAccount}
                        className="text-[10px] text-stone-500 hover:text-stone-800 font-bold hover:underline cursor-pointer"
                      >
                        Switch Number
                      </button>
                    </div>

                    <div className="p-2.5 bg-stone-50 rounded-xl text-[11px] text-stone-600 border border-stone-200 flex items-center gap-2">
                      <span className="text-amber-600 text-base">🔒</span>
                      <span>
                        <strong>1 Spin Limit Active:</strong> Each verified customer account receives 1 guaranteed reward.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (wonPrize.couponCode && onApplyCouponCode) onApplyCouponCode(wonPrize.couponCode);
                          onClose();
                          if (onOpenStoreCatalog) onOpenStoreCatalog();
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-brand-950 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-amber-300"
                      >
                        <ShoppingBag size={14} />
                        <span>Apply & Shop Catalog</span>
                      </button>

                      <a
                        href={`https://wa.me/91${config.whatsappNumber || '918233631768'}?text=${encodeURIComponent(
                          `Namaste! I just won *${wonPrize.label}* (Value: ${wonPrize.worth}) on the VIP Spin Wheel!\n\nMy Account: ${currentUser.name} (+91 ${currentUser.phone})\nCoupon Code: ${wonPrize.couponCode}\n\nPlease help me apply this to my order within 15 minutes!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <MessageCircle size={14} />
                        <span>Claim on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
