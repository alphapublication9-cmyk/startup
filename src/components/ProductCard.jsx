import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye, Star, MessageCircle, Check, Sparkles, Heart, Zap, Send } from 'lucide-react';
import { generateSingleProductChannelUrl } from '../utils/whatsapp';
import { normalizeImageUrl } from '../utils/imageUrl';
import { trackProductAction } from '../utils/productAnalytics';

export const ProductCard = ({ 
  product, 
  onAddToCart, 
  onQuickView, 
  settings = {},
  isWishlisted = false,
  onToggleWishlist
}) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const isTelegram = settings.orderChannel === 'telegram';
  const channelLabel = isTelegram ? 'Telegram' : 'WhatsApp';

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAdd = (e, sizeToUse = selectedSize) => {
    e.stopPropagation();
    trackProductAction(product.id, product, 'cart_add');
    onAddToCart(product, sizeToUse);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1800);
  };

  const handleCardClick = () => {
    // view is tracked inside ProductQuickView as 'quick_view' (which also increments views)
    onQuickView(product);
  };

  const handleDirectChannelOrder = (e) => {
    e.stopPropagation();
    trackProductAction(product.id, product, 'order');
    const url = generateSingleProductChannelUrl({ product, selectedSize, settings });
    window.open(url, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      onClick={handleCardClick}
      className="group bg-white rounded-3xl overflow-hidden border border-[#ebdcc7]/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      {/* Top Image Container with Multi-Image Hover Flip */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        <img
          src={normalizeImageUrl(product.image)}
          alt={product.name}
          className={`w-full h-full object-cover object-top transition-transform duration-700 ease-out ${
            product.images && product.images.length > 1 ? 'group-hover:opacity-0 group-hover:scale-108' : 'group-hover:scale-108'
          }`}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
          }}
        />

        {/* Alternate Image on Hover if Available */}
        {product.images && product.images.length > 1 && (
          <img
            src={normalizeImageUrl(product.images[1])}
            alt={`${product.name} alternate view`}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out pointer-events-none"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = normalizeImageUrl(product.image);
            }}
          />
        )}

        {/* Multi-Photo Count Badge */}
        {product.images && product.images.length > 1 && (
          <div className="absolute top-3 right-14 bg-stone-900/75 text-gold-200 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-sm border border-gold-500/20 z-20">
            <span>📷</span>
            <span>{product.images.length} Views</span>
          </div>
        )}

        {/* Wishlist Floating Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-colors z-20 shadow-md ${
            isWishlisted 
              ? 'bg-rose-600 text-white' 
              : 'bg-white/85 text-stone-700 hover:bg-white hover:text-rose-600'
          }`}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </motion.button>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span className="royal-maroon-bg text-gold-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-gold-400/40">
              {product.badge}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-emerald-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wider shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Special Offer Ribbon Strip with Shimmer */}
        {product.offer && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-[#700b1d] via-[#4a040e] to-[#260107] text-gold-200 px-3 py-1 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md z-10 border-t border-gold-500/30">
            <Sparkles size={12} className="text-gold-300 animate-pulse" />
            <span className="line-clamp-1">{product.offer}</span>
          </div>
        )}

        {/* Quick Size Pills overlay on Hover (Zara style) */}
        <div className="absolute inset-x-2 bottom-8 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gold-300/60 hidden sm:flex flex-col items-center gap-1.5 max-w-[95%] mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Quick Add Size:
          </span>
          <div className="flex gap-1.5 flex-wrap justify-center max-w-full">
            {(product.sizes || ['S', 'M', 'L', 'XL']).map((sz) => {
              const str = String(sz).trim();
              const label = /free\s*size/i.test(str) ? 'Free Size' : (/unstitched/i.test(str) ? 'Unstitched' : (str.length > 6 ? str.split(/[\(\,\-]/)[0].trim() : str));
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={(e) => {
                    setSelectedSize(sz);
                    handleAdd(e, sz);
                  }}
                  className="min-w-[30px] h-7 px-2 rounded-lg bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 text-[11px] font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer shrink-0 whitespace-nowrap"
                  title={sz}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-stone-900/65 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="uppercase tracking-widest font-bold text-[9px] sm:text-[10px] text-[#700b1d] truncate max-w-[60%]">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-semibold text-[11px] sm:text-xs shrink-0">
              <Star size={12} fill="currentColor" />
              <span>{product.rating || 4.9}</span>
              <span className="text-stone-400 text-[9px] sm:text-[10px]">({product.reviewsCount || 38})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-heading text-xs sm:text-sm md:text-base font-bold text-stone-900 line-clamp-1 group-hover:text-amber-900 transition-colors">
            {product.name}
          </h3>

          {/* Fabric & Color Subtitle */}
          <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1 mt-0.5">
            {product.fabric || "Pure Silk / Cotton"} {product.color ? `• ${product.color}` : ''}
          </p>

          {/* Price Strip */}
          <div className="flex items-baseline gap-1.5 sm:gap-2.5 mt-2 flex-wrap">
            <span className="font-heading text-sm sm:text-base md:text-lg font-extrabold text-stone-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] sm:text-xs text-stone-400 line-through font-normal">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700">
                Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#ebdcc7]/60 flex items-center gap-1.5 sm:gap-2">
          
          {/* Add to Cart Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs cursor-pointer min-w-0 ${
              isAddedRecently
                ? 'bg-emerald-700 text-white'
                : 'royal-maroon-bg text-gold-100 hover:opacity-95'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAddedRecently ? (
              <>
                <Check size={13} className="animate-bounce shrink-0" />
                <span className="truncate">Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} className="shrink-0" />
                <span className="truncate">Add to Bag</span>
              </>
            )}
          </motion.button>

          {/* Direct WhatsApp / Telegram Order Button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={handleDirectChannelOrder}
            className={`p-2 sm:p-2.5 rounded-xl text-white font-bold text-xs shadow-xs flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isTelegram 
                ? 'bg-sky-500 hover:bg-sky-600 shadow-sky-200' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
            title={`Instant 1-Click Order on ${channelLabel}`}
          >
            {isTelegram ? <Send size={14} /> : <MessageCircle size={15} />}
          </motion.button>

        </div>

      </div>

    </motion.div>
  );
};
