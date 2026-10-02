import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
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
  Heart,
  Share2,
  X,
  MapPin,
  Clock,
  Flame,
  Award,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { generateSingleProductChannelUrl, getDirectChannelLink } from '../utils/whatsapp';
import { normalizeImageUrl } from '../utils/imageUrl';
import { trackProductAction } from '../utils/productAnalytics';
import { ProductCard } from './ProductCard';

export const ProductDetailPage = ({ 
  product, 
  onBack, 
  onAddToCart, 
  onSelectProduct,
  allProducts = [],
  settings = {},
  isWishlisted = false,
  onToggleWishlist
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  
  // Pincode Delivery Estimator
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);

  // Lightbox Zoom Modal
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Active accordion tabs
  const [activeAccordion, setActiveAccordion] = useState('specs');

  const topRef = useRef(null);

  const isTelegram = settings.orderChannel === 'telegram';
  const channelLabel = isTelegram ? 'Telegram' : 'WhatsApp';

  const rawImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const images = rawImages.filter(Boolean);
  const activeImage = images[selectedImageIndex] || product.image;

  // Scroll to top when product loads or switches
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product && product.id) {
      trackProductAction(product.id, product, 'quick_view');
    }
  }, [product?.id]);

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const savingsAmount = product.originalPrice ? product.originalPrice - product.price : 0;

  // Related products from same category or curated
  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && (p.category === product.category || !product.category))
    .slice(0, 4);

  const handleAddToCart = () => {
    trackProductAction(product.id, product, 'cart_add');
    onAddToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2200);
  };

  const handleDirectOrder = () => {
    trackProductAction(product.id, product, 'order');
    const url = generateSingleProductChannelUrl({ product, selectedSize, settings });
    window.open(url, '_blank');
  };

  const handleShare = () => {
    const shareData = {
      title: `${product.name} | ${settings.storeName || 'Radhika Kurti Collection'}`,
      text: `Check out ${product.name} at ₹${product.price}! Handcrafted luxury ethnic fashion.`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleCheckPincode = (e) => {
    e?.preventDefault();
    const clean = pincodeInput.replace(/\D/g, '').slice(0, 6);
    if (clean.length === 6) {
      const today = new Date();
      const estDate = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
      const formatted = estDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      setPincodeResult({
        valid: true,
        pincode: clean,
        message: `⚡ Express Delivery by ${formatted} (2-3 Business Days) • Free Pan-India Shipping`
      });
    } else {
      setPincodeResult({
        valid: false,
        message: 'Please enter a valid 6-digit Indian Postal Pincode'
      });
    }
  };

  return (
    <div ref={topRef} className="min-h-screen bg-[#faf7f2] pb-24 md:pb-16 animate-fadeIn">
      
      {/* 1. TOP BREADCRUMB & BACK BAR */}
      <div className="bg-white border-b border-[#ebdcc7]/80 sticky top-[60px] sm:top-[72px] z-30 shadow-2xs backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-[#700b1d] hover:text-rose-950 font-bold hover:underline cursor-pointer shrink-0"
            >
              <ArrowLeft size={16} />
              <span>Back to Catalog</span>
            </button>
            <span className="text-stone-300">/</span>
            <span className="text-stone-500 font-medium truncate hidden sm:inline">{product.category || 'Collection'}</span>
            <span className="text-stone-300 hidden sm:inline">/</span>
            <span className="text-stone-900 font-bold truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
              title="Share this design"
            >
              <Share2 size={16} />
              <span className="hidden md:inline">{copiedShare ? 'Link Copied!' : 'Share'}</span>
            </button>

            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isWishlisted 
                    ? 'text-rose-600 bg-rose-50' 
                    : 'text-stone-600 hover:text-rose-600 hover:bg-stone-100'
                }`}
                title="Add to Wishlist"
              >
                <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN PRODUCT STUDIO CONTENT */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* ============================================================== */}
          {/* LEFT: INTERACTIVE IMAGE GALLERY & ZOOM STUDIO (Cols 1 to 6/7)  */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Main Stage Image */}
            <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-stone-100 border border-[#ebdcc7] shadow-lg group">
              <img
                src={normalizeImageUrl(activeImage)}
                alt={product.name}
                className="w-full h-full object-cover object-top cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                onClick={() => setIsLightboxOpen(true)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80";
                }}
              />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.offer && (
                  <span className="bg-[#700b1d] text-gold-100 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md border border-gold-400/30">
                    ⚡ {product.offer}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
                <span className="bg-white/90 backdrop-blur-xs text-brand-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                  {product.fabric || "Pure Handcrafted Fabric"}
                </span>
              </div>

              {/* Zoom & Fullscreen Hint */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-4 right-4 p-2.5 bg-white/90 hover:bg-white text-stone-900 rounded-full shadow-md backdrop-blur-xs transition-all cursor-pointer hover:scale-110 flex items-center gap-1.5 text-xs font-bold"
              >
                <Maximize2 size={16} />
                <span className="hidden sm:inline">Tap to Zoom</span>
              </button>
            </div>

            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-24 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer shadow-xs ${
                      selectedImageIndex === idx 
                        ? 'border-[#700b1d] ring-2 ring-[#700b1d]/30 scale-95' 
                        : 'border-stone-200 hover:border-amber-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={normalizeImageUrl(img)}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Luxury Assurance Bar under photos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 bg-white rounded-2xl border border-[#ebdcc7] text-center shadow-2xs">
                <div className="w-7 h-7 mx-auto rounded-full bg-amber-50 text-amber-900 flex items-center justify-center font-bold mb-1">
                  <ShieldCheck size={16} className="text-[#700b1d]" />
                </div>
                <h6 className="font-bold text-[11px] text-stone-900">100% Authentic</h6>
                <p className="text-[9px] text-stone-500">Artisan Handloom</p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#ebdcc7] text-center shadow-2xs">
                <div className="w-7 h-7 mx-auto rounded-full bg-amber-50 text-amber-900 flex items-center justify-center font-bold mb-1">
                  <Truck size={16} className="text-[#700b1d]" />
                </div>
                <h6 className="font-bold text-[11px] text-stone-900">Fast Dispatch</h6>
                <p className="text-[9px] text-stone-500">Pan-India Delivery</p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#ebdcc7] text-center shadow-2xs">
                <div className="w-7 h-7 mx-auto rounded-full bg-amber-50 text-amber-900 flex items-center justify-center font-bold mb-1">
                  <RefreshCw size={16} className="text-[#700b1d]" />
                </div>
                <h6 className="font-bold text-[11px] text-stone-900">Easy Exchange</h6>
                <p className="text-[9px] text-stone-500">7-Day Hassle Free</p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#ebdcc7] text-center shadow-2xs">
                <div className="w-7 h-7 mx-auto rounded-full bg-amber-50 text-amber-900 flex items-center justify-center font-bold mb-1">
                  <MessageCircle size={16} className="text-emerald-600" />
                </div>
                <h6 className="font-bold text-[11px] text-stone-900">Direct Support</h6>
                <p className="text-[9px] text-stone-500">WhatsApp Help</p>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* RIGHT: BUYING HUB & PRODUCT INTELLIGENCE (Cols 7 to 12)       */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Category & Title */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-[#700b1d] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {product.category || "Women's Couture"}
                </span>
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-amber-900 text-xs font-bold">
                  <Star size={13} fill="#d97706" className="text-amber-600" />
                  <span>4.9</span>
                  <span className="text-stone-400 font-normal">(88 Verified Reviews)</span>
                </div>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-stone-950 mt-2.5 leading-tight">
                {product.name}
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed font-light">
                {product.description || "Exquisite designer ethnic ensemble crafted with premium hand-selected fabrics, intricate embellishments, and authentic artisan craftsmanship."}
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-[#ebdcc7] shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
                SPECIAL BOUTIQUE PRICE
              </span>
              
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-heading text-3xl sm:text-4xl font-black text-brand-950 tracking-tight">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm sm:text-base text-stone-400 line-through font-bold">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Save ₹{savingsAmount.toLocaleString('en-IN')} ({discountPercent}% OFF)
                    </span>
                  </>
                )}
              </div>

              <div className="text-[11px] text-stone-500 font-medium pt-1 flex items-center gap-2">
                <span>✓ Inclusive of all taxes</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">⚡ Free Pan-India Shipping</span>
              </div>
            </div>

            {/* Multi-Kurti Bundle Deal Notice */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 via-gold-50/60 to-amber-100/70 rounded-2xl border border-amber-300 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <div>
                  <strong className="text-amber-950 font-bold block">Smart Multi-Item Savings:</strong>
                  <span className="text-stone-600 text-[11px]">Buy 2 items save ₹200 Extra • Buy 3+ save ₹400 Extra!</span>
                </div>
              </div>
              <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-1 rounded-lg border border-amber-300 shrink-0">
                AUTO APPLIED
              </span>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Select Size: <strong className="text-brand-950">{selectedSize}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs text-[#700b1d] hover:text-rose-950 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Ruler size={14} />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-[48px] h-11 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        selectedSize === sz
                          ? 'bg-[#700b1d] text-gold-100 border-2 border-gold-400 shadow-sm scale-105'
                          : 'bg-white text-stone-800 border border-[#ebdcc7] hover:border-amber-400 hover:bg-stone-50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Quantity:
              </span>
              <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-stone-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-stone-200"
                >
                  <Minus size={14} />
                </button>
                <span className="font-extrabold text-sm px-2 text-stone-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 hover:text-brand-900 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-stone-200"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">
                ✓ In Stock & Ready to Dispatch
              </span>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Add to Bag */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 royal-maroon-bg text-gold-100 hover:opacity-95 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-gold-400/40"
              >
                {isAdded ? (
                  <>
                    <Check size={18} className="text-emerald-400 animate-bounce" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} className="text-gold-300" />
                    <span>Add to Bag (₹{(product.price * quantity).toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>

              {/* Direct WhatsApp Order */}
              <button
                type="button"
                onClick={handleDirectOrder}
                className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  isTelegram ? 'bg-sky-600 hover:bg-sky-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isTelegram ? <Send size={18} /> : <MessageCircle size={18} />}
                <span>Order on {channelLabel}</span>
              </button>
            </div>

            {/* Pincode Delivery Estimator */}
            <div className="p-4 bg-white rounded-2xl border border-[#ebdcc7] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#700b1d]" />
                <span>Check Estimated Delivery Date:</span>
              </span>

              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode (e.g. 302001)"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-600 text-stone-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Check
                </button>
              </form>

              {pincodeResult && (
                <div className={`p-2.5 rounded-xl text-xs font-medium ${
                  pincodeResult.valid ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {pincodeResult.message}
                </div>
              )}
            </div>

            {/* Specifications & Accordions */}
            <div className="space-y-3 pt-2">
              <div className="bg-white rounded-2xl border border-[#ebdcc7] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'specs' ? '' : 'specs')}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-stone-900 hover:bg-stone-50 cursor-pointer"
                >
                  <span>🧵 Product Details & Specifications</span>
                  <span className="text-stone-400 font-mono text-base">{activeAccordion === 'specs' ? '−' : '+'}</span>
                </button>

                {activeAccordion === 'specs' && (
                  <div className="p-4 pt-0 border-t border-stone-100 text-xs text-stone-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-stone-100">
                      <span className="font-semibold text-stone-500">Fabric</span>
                      <span className="font-bold text-stone-900">{product.fabric || "Pure Premium Silk"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-stone-100">
                      <span className="font-semibold text-stone-500">Category</span>
                      <span className="font-bold text-stone-900">{product.category || "Ethnic Couture"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-stone-100">
                      <span className="font-semibold text-stone-500">Color / Pattern</span>
                      <span className="font-bold text-stone-900">{product.color || "Artisan Dyed Rich Tone"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-stone-100">
                      <span className="font-semibold text-stone-500">Wash Care</span>
                      <span className="font-bold text-stone-900">Dry Clean Recommended / Gentle Hand Wash</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-1">
                      <span className="font-semibold text-stone-500">Origin</span>
                      <span className="font-bold text-stone-900">Handcrafted in Jaipur, India</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#ebdcc7] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'shipping' ? '' : 'shipping')}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-stone-900 hover:bg-stone-50 cursor-pointer"
                >
                  <span>🚚 Shipping, Express Delivery & Easy Exchange</span>
                  <span className="text-stone-400 font-mono text-base">{activeAccordion === 'shipping' ? '−' : '+'}</span>
                </button>

                {activeAccordion === 'shipping' && (
                  <div className="p-4 pt-0 border-t border-stone-100 text-xs text-stone-600 leading-relaxed space-y-1.5">
                    <p>• Orders are dispatched within 24-48 business hours from our Jaipur boutique.</p>
                    <p>• Safe 7-Day Easy Size Exchange available if fitting needs adjustment.</p>
                    <p>• Live tracking link is shared directly with you on WhatsApp upon dispatch.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================== */}
        {/* 3. SIMILAR HANDCRAFTED PIECES YOU MAY LIKE                   */}
        {/* ============================================================== */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#ebdcc7]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#700b1d]">
                  CURATED RECOMMENDATIONS
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-stone-900">
                  You May Also Like
                </h3>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-[#700b1d] font-bold hover:underline"
              >
                View Full Catalog →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onAddToCart={onAddToCart}
                  onQuickView={(p) => {
                    if (onSelectProduct) onSelectProduct(p);
                  }}
                  settings={settings}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 4. MOBILE STICKY FLOATING BOTTOM ACTION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ebdcc7] p-3 px-4 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <span className="text-[9px] text-stone-500 uppercase tracking-wider block font-bold">Total Price:</span>
          <span className="font-heading text-lg font-black text-brand-950 truncate block leading-none">
            ₹{(product.price * quantity).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            type="button"
            onClick={handleAddToCart}
            className="px-4 py-2.5 royal-maroon-bg text-gold-100 font-extrabold text-xs rounded-xl shadow-md cursor-pointer active:scale-95"
          >
            {isAdded ? 'Added!' : 'Add to Bag'}
          </button>
          <button
            type="button"
            onClick={handleDirectOrder}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-md text-white cursor-pointer active:scale-95 ${
              isTelegram ? 'bg-sky-600' : 'bg-emerald-600'
            }`}
          >
            {channelLabel}
          </button>
        </div>
      </div>

      {/* 5. LIGHTBOX FULLSCREEN ZOOM MODAL */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-2 right-2 sm:-top-10 sm:-right-10 p-2 text-white bg-black/60 rounded-full hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>

              <img
                src={normalizeImageUrl(activeImage)}
                alt={product.name}
                className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. SIZE GUIDE MODAL */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSizeGuide(false)}
          >
            <div 
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gold-300 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Ruler size={18} className="text-[#700b1d]" />
                  <h4 className="font-heading text-base font-bold text-stone-900">
                    Boutique Standard Size Guide (Inches)
                  </h4>
                </div>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-amber-50 text-stone-900 font-bold">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Size</th>
                      <th className="p-2.5">Bust</th>
                      <th className="p-2.5">Waist</th>
                      <th className="p-2.5">Hip</th>
                      <th className="p-2.5 rounded-r-lg">Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                    <tr><td className="p-2 font-bold text-stone-900">XS</td><td className="p-2">34"</td><td className="p-2">30"</td><td className="p-2">36"</td><td className="p-2">44"</td></tr>
                    <tr><td className="p-2 font-bold text-stone-900">S</td><td className="p-2">36"</td><td className="p-2">32"</td><td className="p-2">38"</td><td className="p-2">44"</td></tr>
                    <tr><td className="p-2 font-bold text-stone-900">M</td><td className="p-2">38"</td><td className="p-2">34"</td><td className="p-2">40"</td><td className="p-2">45"</td></tr>
                    <tr><td className="p-2 font-bold text-stone-900">L</td><td className="p-2">40"</td><td className="p-2">36"</td><td className="p-2">42"</td><td className="p-2">45"</td></tr>
                    <tr><td className="p-2 font-bold text-stone-900">XL</td><td className="p-2">42"</td><td className="p-2">38"</td><td className="p-2">44"</td><td className="p-2">46"</td></tr>
                    <tr><td className="p-2 font-bold text-stone-900">XXL</td><td className="p-2">44"</td><td className="p-2">40"</td><td className="p-2">46"</td><td className="p-2">46"</td></tr>
                    <tr><td className="p-2 font-bold text-stone-900">3XL</td><td className="p-2">46"</td><td className="p-2">42"</td><td className="p-2">48"</td><td className="p-2">46"</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                💡 <strong>Stylist Tip:</strong> If your measurements fall between two sizes, we recommend picking the larger size for the most comfortable boutique fit.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
