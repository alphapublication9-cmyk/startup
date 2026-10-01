import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Crown, 
  Sparkles, 
  Trophy, 
  Ticket, 
  Lock, 
  Phone, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  ArrowRight, 
  Calendar, 
  ShieldCheck, 
  MapPin,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { normalizeImageUrl } from '../utils/imageUrl';
import { 
  getLuckyDrawConfig, 
  getCustomerAuthSession, 
  registerLuckyDrawUser, 
  loginLuckyDrawUser, 
  getUserDrawEligibility 
} from '../utils/luckyDraw';

export const LuckyDrawSection = ({ onShopNow, settings = {} }) => {
  const [config, setConfig] = useState(getLuckyDrawConfig);
  const [currentUser, setCurrentUser] = useState(getCustomerAuthSession);
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [showPassword, setShowPassword] = useState(false);
  const [activePrizeIndex, setActivePrizeIndex] = useState(0);

  // Form states
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    password: '',
    city: ''
  });
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  });

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    const handleAuth = () => {
      setCurrentUser(getCustomerAuthSession());
      setConfig(getLuckyDrawConfig());
    };
    handleAuth();
    window.addEventListener('customer-auth-changed', handleAuth);
    window.addEventListener('storage', handleAuth);
    return () => {
      window.removeEventListener('customer-auth-changed', handleAuth);
      window.removeEventListener('storage', handleAuth);
    };
  }, []);

  const minRequired = config.minProductsRequired || 3;
  const eligibility = currentUser ? getUserDrawEligibility(currentUser.phone, minRequired) : null;
  const prizes = config.prizes && config.prizes.length > 0 ? config.prizes : [
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
  ];

  const currentPrize = prizes[activePrizeIndex] || prizes[0];

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const res = registerLuckyDrawUser(regForm);
    if (!res.success) {
      setAuthError(res.error);
      return;
    }

    setCurrentUser(res.user);
    setAuthSuccess('🎉 Registration Successful! Your Golden Ticket has been generated.');
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const res = loginLuckyDrawUser(loginForm.phone, loginForm.password);
    if (!res.success) {
      setAuthError(res.error);
      return;
    }

    setCurrentUser(res.user);
    setAuthSuccess('🎉 Welcome back! Logged into your Lucky Draw profile.');
  };

  return (
    <section id="lucky-draw-section" className="py-10 bg-gradient-to-b from-[#fdfcf9] via-[#f7f3eb] to-[#fdfcf9] border-y border-amber-200/80 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs uppercase tracking-widest mb-2 shadow-xs">
            <Sparkles size={14} className="text-amber-700" />
            <span>Festive Mega Giveaway</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-wide">
            {config.title || "Festive Royal Lucky Draw"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1.5 font-medium leading-relaxed">
            {config.tagline || "Order minimum 3 Boutique items to qualify for the Grand Mega Giveaway!"}
          </p>
        </div>

        {/* 2-Column Grid: Prize Showcase on Left, Ticket / Registration on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Grand Prizes Showcase */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-amber-600" />
                <h3 className="font-heading text-sm sm:text-base font-bold text-stone-900 uppercase tracking-wider">
                  Grand Giveaway Prizes ({prizes.length} Items)
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-xl border border-amber-300">
                <Calendar size={13} />
                <span>Draw Date: {config.announcementDate || "2026-11-15"}</span>
              </div>
            </div>

            {/* Active Prize Card */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[#faf8f5] p-4 rounded-2xl border border-amber-200">
              <div className="sm:col-span-5 aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md bg-white">
                <img
                  src={normalizeImageUrl(currentPrize.image)}
                  alt={currentPrize.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80";
                  }}
                />
              </div>

              <div className="sm:col-span-7 space-y-2">
                <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block border border-amber-300">
                  Worth: {currentPrize.worth}
                </span>
                <h4 className="font-heading text-base sm:text-lg font-bold text-stone-900 leading-snug">
                  {currentPrize.title}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed font-light">
                  {currentPrize.description}
                </p>
              </div>
            </div>

            {/* Prize Switcher Tabs */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
              {prizes.map((pz, idx) => (
                <button
                  key={pz.id || idx}
                  type="button"
                  onClick={() => setActivePrizeIndex(idx)}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer text-center whitespace-nowrap shadow-xs ${
                    activePrizeIndex === idx
                      ? 'bg-amber-400 text-brand-950 font-black border border-amber-500 shadow-sm'
                      : 'bg-stone-100 hover:bg-amber-50 text-stone-700 border border-stone-200'
                  }`}
                >
                  Prize #{idx + 1}
                </button>
              ))}
            </div>

            {/* Eligibility Rule Chip */}
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/90 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-950 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                3+
              </div>
              <div className="text-xs">
                <strong className="text-stone-900 block font-bold">Eligibility Rule: Order Minimum 3 Products</strong>
                <span className="text-stone-600 text-[11px]">
                  Place orders for at least 3 items with your mobile number to automatically qualify for the draw!
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: User Ticket / Login / Registration */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Feedback Messages */}
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertCircle size={15} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check size={15} className="shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {currentUser ? (
              /* VIEW A: LOGGED IN USER TICKET STATUS */
              <div className="bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-md space-y-4">
                
                {/* Official Entry Ticket */}
                <div className="p-4 bg-gradient-to-br from-amber-100/70 via-gold-50/60 to-amber-50 rounded-2xl border-2 border-amber-300/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-amber-900 uppercase tracking-wider block">
                        OFFICIAL ENTRY TICKET
                      </span>
                      <h4 className="font-heading text-base font-bold text-stone-900 uppercase mt-0.5">
                        {currentUser.name}
                      </h4>
                      <span className="text-xs text-stone-600 font-mono font-bold">
                        📞 +91 {currentUser.phone}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-stone-500 font-bold block uppercase tracking-wider">
                        TICKET NUMBER
                      </span>
                      <span className="font-mono text-xs font-black text-brand-950 bg-white px-2.5 py-1 rounded-xl border border-amber-400 inline-block shadow-xs">
                        {currentUser.ticketNumber}
                      </span>
                    </div>
                  </div>

                  {/* Order Progress Meter */}
                  <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                      <span>Orders Progress:</span>
                      <span className="font-black text-amber-900">
                        {eligibility?.count || 0} / {minRequired} Items Ordered
                      </span>
                    </div>

                    <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-amber-300">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          eligibility?.isEligible ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, ((eligibility?.count || 0) / minRequired) * 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      {eligibility?.isEligible ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} /> You are 100% Eligible to Win!
                        </span>
                      ) : (
                        <span className="text-amber-800 font-medium">
                          ⏳ Order {eligibility?.remainingToUnlock || minRequired} more items to activate ticket
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onShopNow}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-brand-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all border border-amber-300"
                >
                  <ShoppingBag size={16} />
                  <span>Shop Collection to Qualify</span>
                </button>
              </div>
            ) : (
              /* VIEW B: REGISTRATION & LOGIN CARD */
              <div className="bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-md space-y-3.5">
                <div className="text-center space-y-0.5">
                  <h4 className="font-heading text-base font-bold text-stone-900 flex items-center justify-center gap-1.5">
                    <Ticket size={17} className="text-amber-600" />
                    <span>Get Your Official Golden Ticket</span>
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Enter your details to generate your permanent draw ticket!
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 font-bold text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      authMode === 'register' ? 'bg-amber-400 text-brand-950 font-black shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    New Participant
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      authMode === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    Existing Login
                  </button>
                </div>

                {authMode === 'register' ? (
                  <form onSubmit={handleRegister} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[9px] mb-0.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Radhika Sharma"
                          value={regForm.name}
                          onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                          className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                        />
                        <User size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-stone-700 uppercase tracking-wider text-[9px] mb-0.5">
                          Mobile No <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={regForm.phone}
                            onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                            className="w-full pl-8 pr-2 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                          />
                          <Phone size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 uppercase tracking-wider text-[9px] mb-0.5">
                          Set Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Password"
                            value={regForm.password}
                            onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                            className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                          />
                          <KeyRound size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[9px] mb-0.5">
                        City & State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Jaipur, Rajasthan"
                        value={regForm.city}
                        onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-brand-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-amber-300"
                    >
                      <ShieldCheck size={14} />
                      <span>Generate My Golden Ticket</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[9px] mb-0.5">
                        Registered Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="10-digit mobile"
                          value={loginForm.phone}
                          onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                          className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                        />
                        <Phone size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[9px] mb-0.5">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                        />
                        <KeyRound size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-brand-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-amber-300"
                    >
                      <ShieldCheck size={14} />
                      <span>Login to View Ticket</span>
                    </button>
                  </form>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
