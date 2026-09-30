import React, { useState } from 'react';
import { Lock, User, KeyRound, X, AlertCircle, ShieldCheck, Eye, EyeOff, Sparkles, Zap } from 'lucide-react';

export const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess, settings = {} }) => {
  if (!isOpen) return null;

  const [rememberMe, setRememberMe] = useState(true);
  const [username, setUsername] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_admin_saved_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) return parsed.username;
      }
    } catch {}
    return settings.adminUser || 'PAWAN420';
  });

  const [password, setPassword] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_admin_saved_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.password) return parsed.password;
      }
    } catch {}
    return settings.adminPass || 'TERABAAP420';
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    const correctUser = settings.adminUser || 'PAWAN420';
    const correctPass = settings.adminPass || 'TERABAAP420';

    if (username.trim() === correctUser && password.trim() === correctPass) {
      setError('');
      if (rememberMe) {
        try {
          localStorage.setItem('aura_admin_saved_creds', JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            remember: true
          }));
        } catch (err) {}
      }
      onLoginSuccess();
      onClose();
    } else {
      setError('Invalid Admin ID or Password. Please check credentials.');
    }
  };

  const handleQuickLogin = () => {
    const correctUser = settings.adminUser || 'PAWAN420';
    const correctPass = settings.adminPass || 'TERABAAP420';
    setUsername(correctUser);
    setPassword(correctPass);
    setError('');
    try {
      localStorage.setItem('aura_admin_saved_creds', JSON.stringify({
        username: correctUser,
        password: correctPass,
        remember: true
      }));
    } catch (err) {}
    onLoginSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="royal-maroon-bg text-gold-100 p-6 text-center relative border-b border-gold-500/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-gold-200 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="w-14 h-14 rounded-full bg-gold-400/20 border border-gold-400/50 flex items-center justify-center mx-auto mb-3 text-gold-300 shadow-inner">
            <Lock size={26} />
          </div>

          <h3 className="font-serif text-xl font-bold tracking-wide">
            Boutique Admin Portal
          </h3>
          <p className="text-xs text-gold-200 mt-1">
            Manage Kurti Photos, Prices & WhatsApp Orders
          </p>
        </div>

        {/* Login Form with Standard AutoComplete for Browser Password Manager */}
        <form 
          id="modal-admin-login-form"
          name="modal_admin_login"
          method="POST"
          action="#"
          autoComplete="on"
          onSubmit={handleLogin} 
          className="p-6 space-y-4"
        >
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold animate-fadeIn">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Admin ID */}
          <div>
            <label htmlFor="modal-admin-username" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Admin ID / Username
            </label>
            <div className="relative">
              <input
                id="modal-admin-username"
                name="username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="Enter Admin ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700 text-stone-900"
              />
              <User className="absolute left-3 top-3 text-stone-400" size={17} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="modal-admin-password" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="modal-admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700 text-stone-900"
              />
              <KeyRound className="absolute left-3 top-3 text-stone-400" size={17} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-stone-700 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-amber-700 accent-[#700b1d] focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-semibold text-stone-800">Save Password on this device</span>
            </label>
            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Auto-Save
            </span>
          </div>

          {/* Quick Helper Credentials Note & 1-Click Login */}
          <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200/90 text-xs text-stone-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={12} className="text-amber-700" />
                <span>Configured Credentials:</span>
              </span>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="text-[11px] font-bold text-amber-950 hover:text-white hover:bg-[#700b1d] bg-amber-200/90 border border-amber-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Zap size={12} className="text-amber-800" />
                <span>⚡ 1-Click Login</span>
              </button>
            </div>

            <div className="flex items-center justify-between mt-1 text-stone-800 font-mono bg-white/80 p-2 rounded-lg border border-amber-200/70 text-xs font-semibold">
              <span>ID: <strong>{settings.adminUser || 'PAWAN420'}</strong></span>
              <span>PASS: <strong>{settings.adminPass || 'TERABAAP420'}</strong></span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 royal-maroon-bg text-gold-100 font-bold text-sm rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck size={18} />
            <span>Secure Admin Login</span>
          </button>
        </form>

      </div>
    </div>
  );
};
