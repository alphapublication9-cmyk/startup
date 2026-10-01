import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  ShoppingBag, 
  MessageCircle, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Ruler, 
  Check, 
  Plus, 
  Minus, 
  Tag, 
  Send,
  ZoomIn,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { generateSingleProductChannelUrl } from '../utils/whatsapp';
import { normalizeImageUrl } from '../utils/imageUrl';

export const ProductQuickView = ({ product, onClose, onAddToCart, settings = {} }) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  
  // Lightbox Zoom State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isTelegram = settings.orderChannel === 'telegram';
  const channelLabel = isTelegram ? 'Telegram' : 'WhatsApp';

  const rawImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const images = rawImages.filter(Boolean);
  const activeImage = images[selectedImageIndex] || product.image;

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setSelectedImageIndex((prev) => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, images.length]);

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const savingsAmount = product.originalPrice ? product.originalPrice - product.price : 0;

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleChannelOrder = () => {
    const url = generateSingleProductChannelUrl({ product, selectedSize, settings });
    window.open(url, '_blank');
  };

  const handleOpenLightbox = (index = selectedImageIndex) => {
    setSelectedImageIndex(index);
    setZoomLevel(1);
    setIsLightboxOpen(true);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-950/75 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-300/60 overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-900/90 hover:bg-[#700b1d] text-white shadow-xl flex items-center justify-center transition-all cursor-pointer border border-white/20"
          >
            <X size={18} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 max-h-[92vh] overflow-y-auto">
            
            {/* Left Column: Multi-Photo Gallery Studio */}
            <div className="p-3 sm:p-5 md:p-6 bg-[#faf5ed] flex flex-col justify-start space-y-3">
              
              {/* Main Active Image Viewport with Slide Arrows & Zoom */}
              <div 
                onClick={() => handleOpenLightbox(selectedImageIndex)}
                className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-gold-300/50 shadow-md group cursor-zoom-in select-none bg-white"
                title="Click to Enlarge / Full Screen Photo"
              >
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  src={normalizeImageUrl(activeImage)}
                  alt={product.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                  }}
                />

                {/* Left & Right Slide Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-950/80 hover:bg-[#700b1d] text-white flex items-center justify-center shadow-xl border border-white/30 transition-all hover:scale-110 active:scale-95 cursor-pointer z-20 backdrop-blur-xs"
                      aria-label="Previous Photo"
                      title="Previous Photo"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev + 1) % images.length);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-950/80 hover:bg-[#700b1d] text-white flex items-center justify-center shadow-xl border border-white/30 transition-all hover:scale-110 active:scale-95 cursor-pointer z-20 backdrop-blur-xs"
                      aria-label="Next Photo"
                      title="Next Photo"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Enlarge / Fullscreen Floating Trigger Pill */}
                <div className="absolute top-3 right-3 bg-stone-950/85 hover:bg-[#700b1d] text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-md border border-white/20 transition-all opacity-95 group-hover:opacity-100 group-hover:scale-105 z-20">
                  <ZoomIn size={12} className="text-gold-300" />
                  <span>Enlarge Photo</span>
                </div>

                {/* Photo Counter Badge */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-stone-900/90 text-gold-200 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-gold-500/40 z-20">
                    {selectedImageIndex + 1} / {images.length} Photos
                  </div>
                )}

                {/* Ribbon Badge */}
                {product.badge && (
                  <span className="absolute top-2.5 left-2.5 royal-maroon-bg text-gold-100 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-gold-400/40 z-20 shadow-sm">
                    {product.badge}
                  </span>
                )}

                {/* Offer Banner */}
                {product.offer && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-[#700b1d] via-[#4a040e] to-[#260107] text-gold-200 px-2.5 py-1 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shadow-md border-t border-gold-500/30 z-10">
                    <Sparkles size={13} className="text-gold-300 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>{product.offer}</span>
                  </div>
                )}
              </div>

              {/* Multi-Photo Thumbnail Bar Below the Main Photo */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 w-full scrollbar-none no-scrollbar justify-center sm:justify-start">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      onMouseEnter={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer relative group bg-white shadow-xs ${
                        selectedImageIndex === idx 
                          ? 'border-[#700b1d] scale-105 shadow-md ring-2 ring-gold-400/60' 
                          : 'border-stone-300/80 opacity-60 hover:opacity-100 hover:border-amber-600'
                      }`}
                      title={`View Photo ${idx + 1}`}
                    >
                      <img 
                        src={normalizeImageUrl(img)} 
                        alt={`View ${idx + 1}`} 
                        className="w-full h-full object-cover object-top" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-bold px-1 rounded ${
                        selectedImageIndex === idx ? 'bg-[#700b1d] text-white' : 'bg-black/70 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}

            </div>

          {/* Right Column: Details & Ordering */}
          <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-between space-y-4">
            <div className="pr-8 sm:pr-12 md:pr-10">
              <div className="flex items-center gap-2 flex-wrap text-xs text-stone-500 mb-1.5">
                <span className="uppercase tracking-widest font-extrabold text-[#700b1d] text-[11px] sm:text-xs">
                  {product.category}
                </span>
                <span className="text-stone-300">•</span>
                <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                  <Star size={13} fill="currentColor" />
                  <span className="text-stone-800 font-bold">{product.rating || 4.9}</span>
                  <span className="text-stone-500">({product.reviewsCount || 42} reviews)</span>
                </div>
              </div>

              <h2 className="font-heading text-lg sm:text-2xl font-bold text-stone-900 leading-tight">
                {product.name}
              </h2>

              {/* Pricing */}
              <div className="flex items-baseline gap-3 mt-3 flex-wrap">
                <span className="font-heading text-2xl sm:text-3xl font-extrabold text-stone-900">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-stone-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-1 rounded-full">
                    {discountPercent}% OFF (Save ₹{savingsAmount.toLocaleString('en-IN')})
                  </span>
                )}
              </div>

              {/* Size Selector */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-stone-700">
                    Select Size: <strong className="text-amber-900">{selectedSize}</strong>
                  </span>
                  <button 
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-xs text-amber-900 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Ruler size={13} />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-10 h-10 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer whitespace-nowrap ${
                        selectedSize === sz
                          ? 'royal-maroon-bg text-gold-100 shadow-md scale-105'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {showSizeGuide && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-stone-700 space-y-1">
                    <p className="font-bold text-amber-950">Standard Women Size Chart (Inches):</p>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono">
                      <div className="font-bold bg-amber-100/70 p-1">Size</div>
                      <div className="font-bold bg-amber-100/70 p-1">Bust</div>
                      <div className="font-bold bg-amber-100/70 p-1">Waist</div>
                      <div className="font-bold bg-amber-100/70 p-1">Hip</div>
                      <div className="p-1">S</div><div className="p-1">36"</div><div className="p-1">32"</div><div className="p-1">38"</div>
                      <div className="p-1">M</div><div className="p-1">38"</div><div className="p-1">34"</div><div className="p-1">40"</div>
                      <div className="p-1">L</div><div className="p-1">40"</div><div className="p-1">36"</div><div className="p-1">42"</div>
                      <div className="p-1">XL</div><div className="p-1">42"</div><div className="p-1">38"</div><div className="p-1">44"</div>
                      <div className="p-1">XXL</div><div className="p-1">44"</div><div className="p-1">40"</div><div className="p-1">46"</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs uppercase font-bold tracking-wider text-stone-700">Quantity:</span>
                <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 text-xs font-bold text-stone-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Fabric & Specifications */}
              <div className="mt-4 p-3.5 bg-stone-100/70 rounded-2xl space-y-1.5 text-xs text-stone-700">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 w-20">Fabric:</span>
                  <span>{product.fabric || 'Artisan Handcrafted Material'}</span>
                </div>
                {product.color && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 w-20">Color:</span>
                    <span>{product.color}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 pt-1 border-t border-stone-200">
                  <span className="font-bold text-stone-900 w-20 shrink-0">Details:</span>
                  <span className="text-stone-600 leading-relaxed">{product.description}</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Add to Cart */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'royal-maroon-bg text-gold-100 hover:opacity-95'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check size={18} />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} className="text-gold-300" />
                      <span>Add to Bag (₹{(product.price * quantity).toLocaleString('en-IN')})</span>
                    </>
                  )}
                </motion.button>

                {/* Direct WhatsApp / Telegram Buy */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleChannelOrder}
                  disabled={!product.inStock}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    isTelegram 
                      ? 'bg-sky-500 hover:bg-sky-600' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isTelegram ? <Send size={16} /> : <MessageCircle size={18} />}
                  <span>Order on {channelLabel}</span>
                </motion.button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-stone-500 text-center font-medium">
                <div className="flex items-center justify-center gap-1">
                  <ShieldCheck size={13} className="text-amber-800" />
                  <span>100% Original</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Truck size={13} className="text-[#700b1d]" />
                  <span>Fast Dispatch</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <RefreshCw size={13} className="text-emerald-700" />
                  <span>Easy Exchange</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </motion.div>

    {/* ========================================================= */}
    {/* FULLSCREEN HD IMAGE LIGHTBOX & ZOOM VIEWER MODAL          */}
    {/* ========================================================= */}
    <AnimatePresence>
      {isLightboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Control Bar */}
          <div 
            className="flex items-center justify-between z-20 text-white pb-3 border-b border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title & Index */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-serif font-bold text-sm sm:text-base text-gold-300 truncate max-w-[200px] sm:max-w-md">
                {product.name}
              </span>
              <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full text-stone-300 font-mono">
                Photo {selectedImageIndex + 1} of {images.length}
              </span>
            </div>

            {/* Zoom Controls & Close */}
            <div className="flex items-center gap-2">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Zoom Out"
              >
                <Minus size={17} />
              </button>

              {/* Reset Zoom */}
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2.5 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Reset Zoom"
              >
                <span>{Math.round(zoomLevel * 100)}%</span>
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Zoom In"
              >
                <Plus size={17} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-9 h-9 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer ml-2 shadow-lg"
                title="Close Lightbox (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Center Image with Navigation Arrows */}
          <div 
            className="relative flex-1 flex items-center justify-center overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-[#700b1d] text-white border border-white/20 shadow-xl flex items-center justify-center transition-all cursor-pointer"
                title="Previous Image (←)"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Main Active Zoomable Image */}
            <motion.div 
              className="max-h-[78vh] max-w-[92vw] overflow-auto flex items-center justify-center p-2 cursor-grab active:cursor-grabbing"
              animate={{ scale: zoomLevel }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              <img
                src={normalizeImageUrl(activeImage)}
                alt={product.name}
                className="max-h-[74vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                }}
              />
            </motion.div>

            {/* Next Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-[#700b1d] text-white border border-white/20 shadow-xl flex items-center justify-center transition-all cursor-pointer"
                title="Next Image (→)"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Selector */}
          {images.length > 1 && (
            <div 
              className="z-20 pt-3 border-t border-white/15 flex items-center justify-center gap-2 overflow-x-auto pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`w-14 h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIndex === idx 
                      ? 'border-amber-400 scale-110 shadow-lg ring-2 ring-amber-400/50' 
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={normalizeImageUrl(img)} alt="" className="w-full h-full object-cover object-top" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
};
