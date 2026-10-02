import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
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
  LogOut, 
  Calendar, 
  Star, 
  ShieldCheck, 
  ChevronRight,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { normalizeImageUrl } from '../utils/imageUrl';
import { 
  getLuckyDrawConfig, 
  getCustomerAuthSession, 
  registerLuckyDrawUser, 
  loginLuckyDrawUser, 
  logoutLuckyDrawUser, 
  getUserDrawEligibility 
} from '../utils/luckyDraw';

export const LuckyDrawModal = ({ isOpen, onClose, onShopNow, settings = {} }) => {
  const [config, setConfig] = useState(getLuckyDrawConfig);
  const [currentUser, setCurrentUser] = useState(getCustomerAuthSession);
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    password: '',
    city: '',
    address: ''
  });

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  });

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [activePrizeIndex, setActivePrizeIndex] = useState(0);

  // Reload config and session when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig(getLuckyDrawConfig());
      setCurrentUser(getCustomerAuthSession());
      setAuthError('');
      setAuthSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const eligibility = currentUser ? getUserDrawEligibility(currentUser.phone, config) : null;
  const isAmountMode = (config.eligibilityType || 'amount') === 'amount';
  const minRequiredAmount = Number(config.minOrderAmount || 10000);
  const minRequiredCount = Number(config.minProductsRequired || 3);
  const prizes = config.prizes || [];
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
    setAuthSuccess('Welcome back! Logged into your Lucky Draw profile.');
  };

  const handleLogout = () => {
    logoutLuckyDrawUser();
    setCurrentUser(null);
    setAuthSuccess('');
    setAuthError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#fdfcf9] rounded-3xl shadow-2xl border-2 border-gold-400/80 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="royal-maroon-bg text-gold-100 p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/40 relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none">
            <Gift size={120} />
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-gold-300 text-stone-950 flex items-center justify-center shadow-md shrink-0">
              <Gift size={22} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base sm:text-lg font-black tracking-wide text-white">
                  {config.title || "Festive Royal Lucky Draw"}
                </h3>
                <span className="px-2 py-0.5 bg-gradient-to-r from-gold-400 to-amber-400 text-stone-950 text-[9px] font-black uppercase rounded-full tracking-wider shadow-2xs">
                  Mega Contest
                </span>
              </div>
              <p className="text-[11px] text-gold-200/90 mt-0.5 font-medium line-clamp-1">
                {config.tagline || "Order minimum 3 products to enter the mega giveaway!"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gold-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-stone-700">
          
          {/* WINNER ANNOUNCED BANNER (If Winner Declared) */}
          {config.winner && (
            <div className="p-4 bg-gradient-to-r from-amber-100 via-gold-100 to-amber-100 border-2 border-amber-400 rounded-2xl shadow-sm text-center space-y-2 animate-fadeIn">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900 text-gold-100 font-extrabold text-xs">
                <Trophy size={14} className="text-gold-300" />
                <span>🏆 LUCKY DRAW WINNER ANNOUNCED! 🏆</span>
              </div>
              <p className="font-serif text-lg font-bold text-amber-950">
                Congratulations to <span className="underline decoration-amber-600 font-black">{config.winner.name}</span>!
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-amber-900 font-medium">
                <span className="px-2.5 py-0.5 bg-white/80 rounded-md font-mono font-bold">Ticket: {config.winner.ticketNumber}</span>
                <span>•</span>
                <span className="font-bold">Prize: {config.winner.prizeTitle}</span>
              </div>
            </div>
          )}

          {/* PRIZES SHOWCASE CAROUSEL */}
          {prizes.length > 0 && (
            <div className="p-4 bg-gradient-to-br from-stone-900 via-brand-950 to-stone-900 text-white rounded-3xl border border-gold-400/40 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold-400 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>Exclusive Grand Giveaway Prizes ({prizes.length} Items)</span>
                </span>
                <span className="text-[10px] text-stone-300 font-medium flex items-center gap-1">
                  <Calendar size={11} className="text-gold-400" />
                  <span>Draw Date: <strong>{config.announcementDate || "Soon"}</strong></span>
                </span>
              </div>

              {/* Active Prize Card */}
              {currentPrize && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-3 rounded-2xl border border-gold-500/20">
                  <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-stone-800 shrink-0 border border-gold-400/40 shadow-md">
                    <img 
                      src={normalizeImageUrl(currentPrize.image)} 
                      alt={currentPrize.title} 
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left min-w-0">
                    <div className="inline-block px-2 py-0.5 bg-gold-400/20 border border-gold-400/40 text-gold-300 font-bold text-[10px] rounded-md">
                      Worth: {currentPrize.worth || "₹3,999"}
                    </div>
                    <h4 className="font-serif text-sm sm:text-base font-bold text-white leading-snug">
                      {currentPrize.title}
                    </h4>
                    <p className="text-[11px] text-stone-300 leading-relaxed line-clamp-2">
                      {currentPrize.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Prize selector thumbnails */}
              {prizes.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 justify-center sm:justify-start">
                  {prizes.map((pz, idx) => (
                    <button
                      key={pz.id || idx}
                      onClick={() => setActivePrizeIndex(idx)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        activePrizeIndex === idx
                          ? 'bg-gold-400 text-stone-950 font-black shadow-xs'
                          : 'bg-white/10 text-stone-300 hover:bg-white/20'
                      }`}
                    >
                      <span>Prize #{idx + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ELIGIBILITY RULE CALLOUT */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-950">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-black text-sm">
                {isAmountMode ? '₹' : `${minRequiredCount}+`}
              </div>
              <div>
                <p className="font-bold text-xs">
                  {isAmountMode
                    ? `Eligibility Rule: Minimum ₹${minRequiredAmount.toLocaleString('en-IN')} Order Value`
                    : `Eligibility Rule: Order Minimum ${minRequiredCount} Products`}
                </p>
                <p className="text-[11px] text-stone-600">
                  {isAmountMode
                    ? `Har customer jo kam se kam ₹${minRequiredAmount.toLocaleString('en-IN')} ki shopping karega, uska ticket automatically Mega Draw ke liye qualify ho jayega!`
                    : `Har customer jo kam se kam ${minRequiredCount} items order karega, uska ticket automatically Mega Draw ke liye qualify ho jayega!`}
                </p>
              </div>
            </div>
          </div>

          {/* AUTH & TICKET SECTION */}
          {currentUser ? (
            /* LOGGED IN USER TICKET DASHBOARD */
            <div className="space-y-4 animate-fadeIn">
              {/* Golden Ticket Card */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-[#2a040b] via-[#480813] to-[#1a0105] text-gold-100 rounded-3xl border-2 border-gold-400 shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                  <Ticket size={160} />
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between border-b border-gold-500/30 pb-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-gold-300 font-extrabold block">
                        Official Entry Ticket
                      </span>
                      <h4 className="font-serif text-lg sm:text-xl font-black text-white">
                        {currentUser.name}
                      </h4>
                      <p className="text-[11px] text-gold-200 font-mono mt-0.5">
                        📱 +91 {currentUser.phone}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-stone-300 font-bold block">
                        Ticket Number
                      </span>
                      <span className="font-mono text-sm sm:text-base font-black text-gold-300 tracking-wider bg-gold-400/20 px-2.5 py-1 rounded-lg border border-gold-400/40 inline-block mt-0.5">
                        {currentUser.ticketNumber}
                      </span>
                    </div>
                  </div>

                  {/* Live Order Eligibility Meter */}
                  {eligibility && (
                    <div className="p-3 bg-white/10 rounded-2xl border border-gold-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gold-200 flex items-center gap-1.5">
                          <ShoppingBag size={14} />
                          <span>Orders Progress</span>
                        </span>
                        <span className={eligibility.isEligible ? 'text-emerald-400 font-black' : 'text-amber-300 font-mono'}>
                          {isAmountMode
                            ? `₹${eligibility.totalSpent.toLocaleString('en-IN')} / ₹${minRequiredAmount.toLocaleString('en-IN')}`
                            : `${eligibility.count} / ${minRequiredCount} Items`}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-gold-500/30">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            eligibility.isEligible ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-gold-400'
                          }`}
                          style={{ 
                            width: `${
                              isAmountMode
                                ? Math.min(100, ((eligibility.totalSpent / (minRequiredAmount || 10000)) * 100))
                                : Math.min(100, ((eligibility.count / (minRequiredCount || 3)) * 100))
                            }%` 
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {eligibility.isEligible ? (
                          <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            <span>🎉 YOU ARE ELIGIBLE FOR THE LUCKY DRAW!</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-[11px] text-amber-200">
                              {isAmountMode
                                ? `Shop for ₹${eligibility.remainingAmountToUnlock.toLocaleString('en-IN')} more to activate entry!`
                                : `Order ${eligibility.remainingItemsToUnlock} more product(s) to activate entry!`}
                            </span>
                            <button
                              onClick={() => {
                                onClose();
                                if (onShopNow) onShopNow();
                              }}
                              className="px-3 py-1 bg-gold-400 hover:bg-gold-300 text-stone-950 text-xs font-black rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                            >
                              Shop Now →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer metadata & Logout */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-stone-300">
                    <span>Registered: {new Date(currentUser.registeredAt).toLocaleDateString('en-IN')}</span>
                    <button
                      onClick={handleLogout}
                      className="text-stone-300 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut size={12} />
                      <span>Switch Account / Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* USER AUTH FORM: REGISTER / LOGIN WITH ID & PASSWORD */
            <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
              
              {/* Tab Switcher */}
              <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'register'
                      ? 'bg-white text-brand-950 shadow-xs font-black'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <Sparkles size={14} className={authMode === 'register' ? 'text-amber-600' : ''} />
                  <span>New Entry (Create ID & Pass)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'login'
                      ? 'bg-white text-brand-950 shadow-xs font-black'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <Lock size={14} className={authMode === 'login' ? 'text-amber-600' : ''} />
                  <span>Existing Login (View Ticket)</span>
                </button>
              </div>

              {/* Messages */}
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} className="text-rose-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* REGISTRATION FORM */}
              {authMode === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Radhika Sharma"
                          value={regForm.name}
                          onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                          className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-700"
                        />
                        <User size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Mobile Number (Your Login ID) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value.replace(/\D/g, '') })}
                          className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-brand-700"
                        />
                        <Phone size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Create Login Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Set 4+ digit password"
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                          className="w-full pl-8 pr-8 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-700 font-mono"
                        />
                        <KeyRound size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        City & State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Jaipur, Rajasthan"
                        value={regForm.city}
                        onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-700"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 royal-maroon-bg text-gold-100 hover:text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Ticket size={16} />
                    <span>Generate My Golden Entry Ticket</span>
                  </button>
                  
                  <p className="text-[10px] text-stone-500 text-center">
                    🔒 Your password allows you to log in anytime to check your live ticket status & winner announcements.
                  </p>
                </form>
              ) : (
                /* LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Registered Mobile Number (User ID) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="Enter your 10-digit mobile number"
                        value={loginForm.phone}
                        onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-brand-700"
                      />
                      <Phone size={14} className="absolute left-2.5 top-3 text-stone-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full pl-8 pr-8 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-700 font-mono"
                      />
                      <KeyRound size={14} className="absolute left-2.5 top-3 text-stone-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 royal-maroon-bg text-gold-100 hover:text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Lock size={15} />
                    <span>Login & View My Ticket</span>
                  </button>
                </form>
              )}

            </div>
          )}

          {/* RULES / TERMS ACCORDION */}
          {config.terms && (
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <span className="font-bold text-stone-800 block text-xs">Contest Terms & Guidelines:</span>
              <p className="whitespace-pre-line leading-relaxed">{config.terms}</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
