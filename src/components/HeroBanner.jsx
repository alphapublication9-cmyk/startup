import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Truck, MessageCircle, RefreshCw, Crown, Heart, Send } from 'lucide-react';
import { getDirectChannelLink } from '../utils/whatsapp';
import { normalizeImageUrl } from '../utils/imageUrl';
import { DEFAULT_HERO_BANNER } from '../data/initialSettings';

export const HeroBanner = ({ onExploreClick, settings = {} }) => {
  const isTelegram = settings.orderChannel === 'telegram';
  const channelLabel = isTelegram ? 'Telegram' : 'WhatsApp';
  const directCatalogUrl = getDirectChannelLink(
    settings,
    `Hello ${settings.storeName || 'Radhika Kurti Collection'}! I would like to see your latest festive Kurti & ethnic collection catalog.`
  );

  const hero = {
    ...DEFAULT_HERO_BANNER,
    ...(settings.heroBanner || {})
  };

  const heroImg = normalizeImageUrl(hero.featuredCardImage) || DEFAULT_HERO_BANNER.featuredCardImage;

  return (
    <div className="relative overflow-hidden mb-8 md:mb-12">
      {/* Light Luxury Editorial Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-gradient-to-r from-[#faf5ee] via-[#f7eee0] to-[#f2e4cf] text-stone-900 rounded-3xl mx-3 sm:mx-6 lg:mx-auto max-w-7xl overflow-hidden shadow-lg border border-[#e8d5be]"
      >
        {/* Subtle Background Pattern & Soft Glow */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-400/15 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center p-4 sm:p-10 lg:p-14">
          
          {/* Left Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-3.5 sm:space-y-6 text-center lg:text-left z-10"
          >
            {/* Top Pill */}
            {hero.tag && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/95 border border-amber-300/80 text-amber-900 text-[10px] sm:text-xs md:text-sm font-bold tracking-wide sm:tracking-wider uppercase shadow-xs backdrop-blur-md max-w-full cursor-default"
              >
                <Sparkles size={13} className="text-amber-600 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
                <span className="truncate">{hero.tag}</span>
              </motion.div>
            )}

            {/* Main Headline */}
            <h1 className="font-heading text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-stone-900">
              {hero.heading || "Grace & Timeless"} <br className="hidden sm:inline" />
              {hero.headingAccent && (
                <span className="gold-gradient-text italic font-bold"> {hero.headingAccent}</span>
              )}
            </h1>

            {/* Description */}
            <p className="text-stone-600 text-xs sm:text-base lg:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {hero.description || `Discover authentic handcrafted Lucknowi Chikankari, Banarasi Pure Silk Sarees, and breathable Jaipur Cotton Kurtis. Add to cart & place direct instant orders on ${channelLabel}.`}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#700b1d] via-[#540614] to-[#38020a] hover:from-[#850e24] hover:to-[#4a040e] text-gold-100 font-extrabold text-sm sm:text-base rounded-full shadow-lg shadow-rose-950/25 border border-gold-400/40 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>{hero.primaryCtaText || "Shop Collection"}</span>
                <ArrowRight size={18} className="text-gold-300 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.a
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                href={directCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-stone-50 border font-bold text-sm sm:text-base rounded-full shadow-xs transition-all flex items-center justify-center gap-2 ${
                  isTelegram ? 'border-sky-300 text-sky-900 hover:bg-sky-50' : 'border-stone-300 text-stone-800 hover:bg-stone-50'
                }`}
              >
                {isTelegram ? (
                  <Send size={18} className="text-sky-500" />
                ) : (
                  <MessageCircle size={18} className="text-emerald-600" />
                )}
                <span>{hero.secondaryCtaText || `${channelLabel} Catalog`}</span>
              </motion.a>
            </div>

            {/* Tagline */}
            <div className="pt-2 text-xs text-[#700b1d] font-bold tracking-wide">
              {hero.trustTagline || `⚡ Instant ${channelLabel} Confirmation • Fast Pan-India Dispatch • 7-Day Easy Exchange`}
            </div>
          </motion.div>

          {/* Right Visual Banner Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex justify-center z-10"
          >
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Main Luxury Image with hover parallax effect */}
              <motion.div 
                whileHover={{ y: -6 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl group"
              >
                <img
                  src={heroImg}
                  alt={hero.featuredCardTitle || "Featured Luxury Kurti"}
                  className="w-full h-80 sm:h-96 object-cover object-top group-hover:scale-108 transition-transform duration-700"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent"></div>
                
                {/* Floating Discount Tag */}
                {hero.featuredCardDiscount && (
                  <motion.div 
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-3.5 right-3.5 bg-gradient-to-r from-[#700b1d] to-[#4a040e] text-gold-100 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-lg border border-gold-400/50"
                  >
                    {hero.featuredCardDiscount}
                  </motion.div>
                )}

                {/* Floating Bottom Card */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#ebdcc7] shadow-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#700b1d] font-extrabold uppercase tracking-widest">
                      {hero.featuredCardTag || "Trending Now"}
                    </p>
                    <p className="text-sm font-extrabold text-stone-900">
                      {hero.featuredCardTitle || "Chanderi Zari Anarkalis"}
                    </p>
                  </div>
                  {hero.featuredCardPrice && (
                    <span className="text-xs font-extrabold bg-rose-50 text-[#700b1d] px-3 py-1 rounded-full border border-rose-200">
                      {hero.featuredCardPrice}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* 4 Pillars / Value Propositions */}
      <div className="container mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <motion.div 
            whileHover={{ y: -4, borderColor: '#700b1d' }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-[#e8d5be] p-4 rounded-2xl flex items-center gap-3.5 shadow-xs transition-colors"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#700b1d] shrink-0 shadow-inner">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">100% Authentic</p>
              <p className="text-[10px] text-stone-500">Handcrafted Pure Silks</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, borderColor: '#10b981' }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-[#e8d5be] p-4 rounded-2xl flex items-center gap-3.5 shadow-xs transition-colors"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 shadow-inner">
              <Truck size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Express Delivery</p>
              <p className="text-[10px] text-stone-500">Fast Pan-India Dispatch</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, borderColor: '#f43f5e' }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-[#e8d5be] p-4 rounded-2xl flex items-center gap-3.5 shadow-xs transition-colors"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-800 shrink-0 shadow-inner">
              <RefreshCw size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Easy Exchange</p>
              <p className="text-[10px] text-stone-500">7-Day Hassle Free</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, borderColor: isTelegram ? '#0284c7' : '#2563eb' }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-[#e8d5be] p-4 rounded-2xl flex items-center gap-3.5 shadow-xs transition-colors"
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              isTelegram ? 'bg-sky-50 border border-sky-200 text-sky-700' : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {isTelegram ? <Send size={20} /> : <MessageCircle size={22} />}
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Direct Support</p>
              <p className="text-[10px] text-stone-500">Instant {channelLabel} Help</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
