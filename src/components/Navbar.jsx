import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Phone, 
  Lock, 
  Menu, 
  X, 
  Crown,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Tag,
  Eye,
  TrendingUp,
  MessageCircle,
  Send,
  Gift,
  User
} from 'lucide-react';
import { cleanTelegramHandle, getDirectChannelLink } from '../utils/whatsapp';
import { normalizeImageUrl } from '../utils/imageUrl';
import { getCustomerAuthSession } from '../utils/luckyDraw';

const TRENDING_SEARCHES = [
  "Anarkali Kurti",
  "Banarasi Silk Saree",
  "Bridal Lehenga",
  "Chikankari Set",
  "Co-ord Sets",
  "Flat 50% OFF"
];

export const Navbar = ({ 
  cartCount, 
  onOpenCart, 
  onOpenAdmin, 
  onOpenLuckyDraw,
  onOpenSpinWheel,
  onOpenCustomerAccount,
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  onSelectCategory,
  categories = [],
  settings,
  isAdminLoggedIn,
  onLogoutAdmin,
  products = [],
  onQuickView,
  onScrollToCatalog
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [customerUser, setCustomerUser] = useState(getCustomerAuthSession);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleAuthChange = () => {
      setCustomerUser(getCustomerAuthSession());
    };
    handleAuthChange();
    window.addEventListener('customer-auth-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('customer-auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [cartCount]);

  // Normalize category names
  const categoryNames = [
    "All",
    ...categories.map(c => typeof c === 'string' ? c : c.name)
  ];

  // Live matching products for instant preview dropdown
  const searchMatches = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.fabric && p.fabric.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.offer && p.offer.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSearchFocused(false);
    if (onScrollToCatalog) onScrollToCatalog();
  };

  const handleSelectTrending = (term) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
    if (onScrollToCatalog) onScrollToCatalog();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ebdcc7]/80 transition-all duration-300">
      
      {/* Top Announcement Bar (Light Luxury Champagne Gold & Warm Amber) */}
      <div className="bg-gradient-to-r from-[#faede0] via-[#f7e6d2] to-[#faede0] text-amber-950 py-1.5 px-3 sm:px-4 text-xs font-medium tracking-wider border-b border-[#e5d0b8] shadow-xs">
        <div className="container mx-auto flex items-center justify-between gap-2">
          
          {/* Support Info */}
          <div className="hidden sm:flex items-center gap-2 text-amber-900 font-semibold shrink-0">
            {settings.orderChannel === 'telegram' ? (
              <>
                <Send size={13} className="text-sky-600" />
                <span className="text-[11px] sm:text-xs">Telegram: <strong className="text-stone-900">@{cleanTelegramHandle(settings.telegramUsername)}</strong></span>
              </>
            ) : (
              <>
                <Phone size={13} className="text-amber-700" />
                <span className="text-[11px] sm:text-xs">WhatsApp: <strong className="text-stone-900">{settings.whatsappNumber}</strong></span>
              </>
            )}
          </div>

          {/* Announcement Marquee / Center Text */}
          <div className="flex-1 text-center font-bold tracking-wide flex items-center justify-center gap-1.5 text-amber-950 min-w-0">
            <Sparkles size={12} className="text-[#700b1d] shrink-0 animate-pulse hidden xs:inline" />
            <span className="truncate text-[11px] sm:text-xs">{settings.announcementText || "✨ Festive Mega Sale: Up to 50% OFF | Pan-India Express Dispatch ✨"}</span>
            <Sparkles size={12} className="text-[#700b1d] shrink-0 animate-pulse hidden xs:inline" />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Mobile Menu Trigger + Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-stone-700 hover:text-amber-900 focus:outline-none cursor-pointer shrink-0 -ml-1"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Boutique Brand Logo */}
            <a href="#" className="flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-hidden group">
              <div className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform drop-shadow-sm">
                <img 
                  src={settings?.logoUrl || "/logo.png"} 
                  alt={settings?.storeName || "RADHIKA KURTI COLLECTION"} 
                  className="w-full h-full object-contain filter drop-shadow-xs" 
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-xs xs:text-sm sm:text-xl font-black tracking-wider sm:tracking-widest text-stone-900 leading-tight truncate">
                  {settings.storeName || "RADHIKA KURTI COLLECTION"}
                </span>
                <span className="text-[8px] sm:text-[10px] tracking-[0.2em] text-[#700b1d] uppercase font-extrabold truncate hidden xs:inline">
                  LUXURY DESIGN • ETHNIC FASHION
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Search Bar with Live Suggestions Dropdown */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-6 relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search kurtis, sarees, lehengas, dresses, offers..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                className="w-full pl-10 pr-8 py-2.5 bg-[#faf7f2] border border-[#ebdcc7] rounded-full text-xs sm:text-sm focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 placeholder:text-stone-400 text-stone-800 transition-all shadow-xs"
              />
              <Search className="absolute left-3.5 top-3 text-stone-400" size={17} />
              
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-3.5 top-3 text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </form>

            {/* LIVE PREDICTIVE SEARCH POPUP DROPDOWN */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-amber-200 p-4 z-50 animate-fadeIn space-y-3">
                
                {/* When Search Query is Present */}
                {searchQuery.trim() ? (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Matching Items ({searchMatches.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="text-xs text-amber-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View in Catalog</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    {searchMatches.length === 0 ? (
                      <div className="p-4 text-center text-xs text-stone-500">
                        No instant match for "{searchQuery}". Try searching <strong>kurti, saree, silk, lehenga</strong>.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchMatches.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (onQuickView) onQuickView(item);
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={normalizeImageUrl(item.image)}
                                alt={item.name}
                                className="w-10 h-12 object-cover object-top rounded-lg border border-stone-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                                }}
                              />
                              <div>
                                <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-900 line-clamp-1">
                                  {item.name}
                                </h4>
                                <p className="text-[10px] text-stone-500">{item.category} • {item.fabric}</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-extrabold text-xs text-stone-950">₹{item.price}</span>
                              {item.offer && (
                                <span className="block text-[9px] font-bold text-amber-700">⚡ {item.offer}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* When Empty - Show Trending Searches */
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <TrendingUp size={14} className="text-amber-700" />
                      <span>Trending Searches:</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleSelectTrending(term)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-950 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-1.5 text-stone-700 hover:text-amber-900 rounded-full hover:bg-stone-100 cursor-pointer"
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            {/* Direct WhatsApp / Telegram Quick Contact Button */}
            <a 
              href={getDirectChannelLink(settings, "Hello! I am interested in your luxury Women Fashion Collection")}
              target="_blank" 
              rel="noopener noreferrer"
              className={`hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                settings.orderChannel === 'telegram'
                  ? 'bg-sky-50 border border-sky-300 text-sky-800 hover:bg-sky-100'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full animate-ping ${settings.orderChannel === 'telegram' ? 'bg-sky-500' : 'bg-emerald-500'}`}></span>
              {settings.orderChannel === 'telegram' ? (
                <>
                  <Send size={12} className="text-sky-600" />
                  <span>Telegram Chat</span>
                </>
              ) : (
                <>
                  <MessageCircle size={13} className="text-emerald-600" />
                  <span>WhatsApp Chat</span>
                </>
              )}
            </a>

            {/* Amazon / Flipkart Style Customer Account Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenCustomerAccount}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-stone-100 hover:bg-amber-100/70 text-stone-800 hover:text-amber-950 border border-stone-200 rounded-full transition-all shadow-2xs cursor-pointer group text-left shrink-0"
              title={customerUser ? `Logged in as ${customerUser.name} (${customerUser.phone})` : "Customer Login & Account"}
            >
              <div className="w-6 h-6 rounded-full bg-amber-200/90 text-amber-950 flex items-center justify-center font-black text-xs shrink-0">
                {customerUser ? customerUser.name.charAt(0).toUpperCase() : <User size={13} />}
              </div>
              <div className="hidden xs:block leading-tight pr-0.5">
                <span className="text-[9px] text-stone-500 font-medium block">
                  {customerUser ? `Hello, ${customerUser.name.split(' ')[0]}` : 'Hello, Sign in'}
                </span>
                <span className="text-[11px] font-bold text-stone-900 block truncate max-w-[95px]">
                  {customerUser ? customerUser.name : 'Account'}
                </span>
              </div>
            </motion.button>

            {/* Cart Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#700b1d] via-[#540614] to-[#38020a] hover:from-[#850e24] hover:to-[#4a040e] text-gold-100 border border-gold-400/40 rounded-full transition-all shadow-md shadow-rose-950/20 group cursor-pointer"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag size={17} className="text-gold-300 group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden sm:inline font-bold text-xs tracking-wide">Cart</span>
              <motion.span 
                key={cartCount}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-amber-300 to-amber-400 text-stone-950 text-[11px] font-black rounded-full flex items-center justify-center shadow-xs shrink-0 leading-none"
              >
                {cartCount}
              </motion.span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden mt-3 pt-2 border-t border-[#ebdcc7]/60">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search kurtis, sarees, lehengas, dresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-white border border-[#ebdcc7] rounded-full text-xs focus:outline-none focus:border-amber-700 text-stone-800 shadow-xs"
              />
              <Search className="absolute left-3.5 top-2.5 text-stone-400" size={16} />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-stone-400"
                >
                  <X size={15} />
                </button>
              )}
            </form>
          </div>
        )}

      </div>

      {/* Category Navigation Strip */}
      <nav className="hidden md:block bg-white/90 border-t border-[#ebdcc7]/60 px-4 py-2">
        <div className="container mx-auto flex items-center justify-center gap-6 overflow-x-auto scrollbar-none text-xs font-bold tracking-wider uppercase">
          {categoryNames.slice(0, 9).map((catName) => (
            <button
              key={catName}
              onClick={() => {
                onSelectCategory(catName);
                if (onScrollToCatalog) onScrollToCatalog();
              }}
              className={`py-1 transition-colors relative cursor-pointer ${
                selectedCategory.trim().toLowerCase() === catName.trim().toLowerCase()
                  ? 'text-[#700b1d] font-black' 
                  : 'text-stone-600 hover:text-[#700b1d]'
              }`}
            >
              <span>{catName}</span>
              {selectedCategory.trim().toLowerCase() === catName.trim().toLowerCase() && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#700b1d] rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#fdfcf9] border-t border-[#ebdcc7] shadow-xl p-4 space-y-4 animate-fadeIn">
          {/* Quick Support Link on Mobile Drawer */}
          <div className="pb-3 border-b border-stone-200">
            <a
              href={getDirectChannelLink(settings, "Hello! I would like to inquire about your Kurtis collection")}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm ${
                settings.orderChannel === 'telegram'
                  ? 'bg-sky-500 text-white hover:bg-sky-600'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {settings.orderChannel === 'telegram' ? <Send size={15} /> : <MessageCircle size={16} />}
              <span>
                Chat on {settings.orderChannel === 'telegram' ? 'Telegram' : 'WhatsApp'}
              </span>
            </a>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-900">Browse Categories</p>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {categoryNames.map((catName) => (
                <button
                  key={catName}
                  onClick={() => {
                    onSelectCategory(catName);
                    setIsMobileMenuOpen(false);
                    if (onScrollToCatalog) onScrollToCatalog();
                  }}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold truncate transition-colors ${
                    selectedCategory === catName ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {catName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
