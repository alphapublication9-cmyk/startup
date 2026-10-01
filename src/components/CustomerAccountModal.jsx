import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Check, 
  Sparkles, 
  Gift, 
  Trophy, 
  Copy, 
  ShoppingBag, 
  LogOut, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  MapPin,
  Ticket
} from 'lucide-react';
import { 
  getCustomerAuthSession, 
  registerLuckyDrawUser, 
  loginLuckyDrawUser, 
  logoutLuckyDrawUser,
  getUserDrawEligibility,
  getLuckyDrawConfig
} from '../utils/luckyDraw';
import { recordCustomerLead } from '../utils/customerDirectory';

export const CustomerAccountModal = ({ 
  isOpen, 
  onClose, 
  onOpenCart,
  onOpenCatalog
}) => {
  const [sessionUser, setSessionUser] = useState(getCustomerAuthSession);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    city: '',
    address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSessionUser(getCustomerAuthSession());
      setAuthError('');
      setAuthSuccess('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authTab === 'register') {
      const res = registerLuckyDrawUser(formData);
      if (!res.success) {
        setAuthError(res.error);
        return;
      }
      setSessionUser(res.user);
      recordCustomerLead({
        name: res.user.name,
        phone: res.user.phone,
        city: res.user.city || formData.city,
        address: res.user.address || formData.address
      });
      setAuthSuccess(`Welcome ${res.user.name}! Your account & Ticket #${res.user.ticketNumber} created successfully.`);
    } else {
      const res = loginLuckyDrawUser(formData.phone, formData.password);
      if (!res.success) {
        setAuthError(res.error);
        return;
      }
      setSessionUser(res.user);
      recordCustomerLead({
        name: res.user.name,
        phone: res.user.phone,
        city: res.user.city || '',
        address: res.user.address || ''
      });
      setAuthSuccess(`Welcome back ${res.user.name}!`);
    }
  };

  const handleLogout = () => {
    logoutLuckyDrawUser();
    setSessionUser(null);
    setAuthSuccess('Logged out successfully.');
    setTimeout(() => setAuthSuccess(''), 2500);
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const drawConfig = getLuckyDrawConfig();
  const eligibility = sessionUser ? getUserDrawEligibility(sessionUser.phone, drawConfig.minProductsRequired || 3) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Slide-Over Right Sidebar Drawer */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-[#fdfcf9] shadow-2xl border-l border-amber-300/80 flex flex-col text-stone-900 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Header Bar */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-brand-950 flex items-center justify-center shadow-md font-black text-lg border border-amber-200 shrink-0">
                    {sessionUser ? sessionUser.name.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-stone-900 leading-tight">
                      {sessionUser ? `My VIP Account` : `Customer Sign In`}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Radhika Kurti Collection Hub
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer border border-stone-200 active:scale-90"
                  aria-label="Close Account Sidebar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Alert Feedback Messages */}
              {authError && (
                <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn shrink-0">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shrink-0">
                  <Check size={15} className="shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Drawer Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                
                {/* VIEW A: LOGGED IN USER PROFILE */}
                {sessionUser ? (
                  <div className="space-y-4">
                    
                    {/* VIP Member Profile Card */}
                    <div className="p-4 bg-gradient-to-br from-amber-100/70 via-gold-50/60 to-amber-50 rounded-3xl border-2 border-amber-300 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-300/80">
                            ⭐ VIP Member
                          </span>
                          <h4 className="font-heading text-lg font-bold text-stone-900 mt-1 uppercase tracking-wide">
                            {sessionUser.name}
                          </h4>
                          <p className="text-xs text-stone-600 font-mono font-bold">
                            📞 {sessionUser.phone}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-stone-500 font-bold block uppercase tracking-wider">
                            Golden Ticket
                          </span>
                          <span className="font-mono font-black text-xs text-brand-950 bg-white px-2.5 py-1 rounded-xl border border-amber-400 inline-block shadow-xs">
                            {sessionUser.ticketNumber}
                          </span>
                        </div>
                      </div>

                      {sessionUser.city && (
                        <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                          <MapPin size={13} className="text-rose-600 shrink-0" />
                          <span>{sessionUser.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Lucky Draw Status Progress Card */}
                    {eligibility && (
                      <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                            <Trophy size={15} className="text-amber-600" />
                            <span>Lucky Draw Progress</span>
                          </span>
                          {eligibility.isEligible ? (
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Eligible to Win
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                              ⏳ Need {eligibility.remainingToUnlock} more
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                            <span>{eligibility.count} / {eligibility.minRequired} Products Ordered</span>
                            <span>{eligibility.ordersCount} Orders Placed</span>
                          </div>
                          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                eligibility.isEligible ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, (eligibility.count / eligibility.minRequired) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Saved Spin & Win Rewards */}
                    {sessionUser.savedRewards && sessionUser.savedRewards.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block flex items-center gap-1.5">
                          <Gift size={14} className="text-amber-700" />
                          <span>My Saved Rewards ({sessionUser.savedRewards.length})</span>
                        </span>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {sessionUser.savedRewards.map((rew, i) => (
                            <div key={i} className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between text-xs shadow-2xs">
                              <div>
                                <strong className="text-stone-900 block font-bold">{rew.title}</strong>
                                <span className="text-[10px] text-amber-900 font-extrabold">{rew.worth}</span>
                              </div>
                              {rew.couponCode && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(rew.couponCode)}
                                  className="px-2.5 py-1.5 bg-white hover:bg-stone-50 text-brand-950 font-bold text-[11px] rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                >
                                  {copiedCode === rew.couponCode ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedCode === rew.couponCode ? 'Copied' : rew.couponCode}</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Interactive Actions */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenCart) onOpenCart();
                        }}
                        className="py-3 bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-brand-950 font-black text-xs rounded-2xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-amber-300"
                      >
                        <ShoppingBag size={14} />
                        <span>View Bag & Draw</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenCatalog) onOpenCatalog();
                        }}
                        className="py-3 bg-stone-900 hover:bg-black text-gold-200 font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-gold-400/30"
                      >
                        <span>👗 Shop Kurtis</span>
                      </button>
                    </div>

                    {/* Logout Button */}
                    <div className="pt-3 border-t border-stone-200 text-center">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer py-1.5 px-3 rounded-xl hover:bg-rose-50 transition-colors"
                      >
                        <LogOut size={14} />
                        <span>Logout from this device</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW B: LOGIN / REGISTER FORMS WHEN LOGGED OUT */
                  <div className="space-y-4 text-xs">
                    {/* Tab Switcher */}
                    <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 font-bold">
                      <button
                        type="button"
                        onClick={() => setAuthTab('login')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                          authTab === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                        }`}
                      >
                        Sign In (Existing)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthTab('register')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                          authTab === 'register' ? 'bg-amber-400 text-brand-950 font-black shadow-xs' : 'text-stone-500'
                        }`}
                      >
                        New Account (Create ID)
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      {authTab === 'register' && (
                        <div>
                          <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                            Your Full Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Radhika Sharma"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                            />
                            <User size={15} className="absolute left-3 top-2.5 text-stone-400" />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                          Mobile Number (Your Login ID) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-medium focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                          />
                          <Phone size={15} className="absolute left-3 top-2.5 text-stone-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                          {authTab === 'register' ? 'Create Password (Min 4 digits)' : 'Password'} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                          />
                          <KeyRound size={15} className="absolute left-3 top-2.5 text-stone-400" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
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
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-brand-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 mt-2 border border-amber-300"
                      >
                        <ShieldCheck size={16} />
                        <span>{authTab === 'register' ? 'Create Account & Generate Golden Ticket' : 'Sign In to Account'}</span>
                      </button>
                    </form>
                  </div>
                )}

              </div>

              {/* Sidebar Bottom Footer */}
              <div className="p-3.5 bg-stone-100/90 border-t border-stone-200 text-center shrink-0">
                <p className="text-[11px] text-stone-500 font-medium">
                  👑 100% Genuine Handcrafted Boutique Collections
                </p>
              </div>

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
