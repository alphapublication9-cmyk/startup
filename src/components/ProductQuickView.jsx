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
  Play
} from 'lucide-react';
import { generateSingleProductChannelUrl } from '../utils/whatsapp';
import { normalizeImageUrl } from '../utils/imageUrl';
import { trackProductAction } from '../utils/productAnalytics';

export const ProductQuickView = ({ 
  product, 
  onClose, 
  onAddToCart, 
  settings = {} 
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  
  // Pincode Delivery Estimator
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);

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
        message: `⚡ Express Delivery by ${formatted} (2-3 Days) • ❌ COD Not Available at this location (Only 100% Safe UPI / Online Prepaid Accepted with Free Delivery)`
      });
    } else {
      setPincodeResult({
        valid: false,
        message: 'Please enter a valid 6-digit Pincode'
      });
    }
  };
  
  // Lightbox Zoom State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const detailRef = useRef(null);

  const isTelegram = settings.orderChannel === 'telegram';
  const channelLabel = isTelegram ? 'Telegram' : 'WhatsApp';

  const rawImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const images = rawImages.filter(Boolean);
  const activeImage = images[selectedImageIndex] || product.image;

  // Scroll into view when product opens
  useEffect(() => {
    if (product && product.id) {
      trackProductAction(product.id, product, 'quick_view');
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [product?.id]);

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const savingsAmount = product.originalPrice ? product.originalPrice - product.price : 0;

  const handleAddToCart = () => {
    trackProductAction(product.id, product, 'cart_add');
    onAddToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleChannelOrder = () => {
    trackProductAction(product.id, product, 'order');
    const url = generateSingleProductChannelUrl({ product, selectedSize, settings });
    window.open(url, '_blank');
  };

  const handleOpenLightbox = (index = selectedImageIndex) => {
    setSelectedImageIndex(index);
    setZoomLevel(1);
    setIsLightboxOpen(true);
  };

  return (
    <section 
      ref={detailRef}
      id="product-detail-view"
      className="py-6 sm:py-8 bg-gradient-to-b from-[#fdfbf7] via-[#faf7f2] to-[#fdfbf7] border-b border-amber-200/80 animate-fadeIn"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Top Breadcrumbs & Back Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-amber-200/60">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium overflow-x-auto whitespace-nowrap">
            <button 
              type="button" 
              onClick={onClose}
              className="hover:text-amber-900 transition-colors cursor-pointer font-bold flex items-center gap-1 text-stone-700"
            >
              <ArrowLeft size={14} />
              <span>Back to Catalog</span>
            </button>
            <span>/</span>
            <span>{product.category || "Women's Collection"}</span>
            <span>/</span>
            <span className="text-stone-900 font-bold truncate max-w-[200px] sm:max-w-md">{product.name}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 shadow-xs border border-stone-200 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <X size={15} />
            <span>Close Details</span>
          </button>
        </div>

        {/* Main In-Page Product Studio Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 border-2 border-amber-300 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: MULTI-PHOTO GALLERY STUDIO */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Main High-Res Photo Viewport */}
            <div 
              onClick={() => handleOpenLightbox(selectedImageIndex)}
              className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 border-amber-300/80 shadow-md group cursor-zoom-in select-none bg-stone-50"
              title="Click to Zoom Full Screen"
            >
              <img
                src={normalizeImageUrl(activeImage)}
                alt={product.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                }}
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                {product.badge && (
                  <span className="px-3 py-1 bg-stone-950/90 text-gold-200 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md backdrop-blur-xs border border-gold-400/40">
                    {product.badge}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-full shadow-md">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Slide Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <ZoomIn size={12} />
                <span>Enlarge Photo</span>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-amber-500 shadow-sm scale-105'
                        : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={normalizeImageUrl(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Offer Banner on Image Bottom */}
            {product.offer && (
              <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border border-amber-300 rounded-2xl flex items-center gap-2 text-xs text-amber-950 font-bold">
                <Sparkles size={16} className="text-amber-600 shrink-0" />
                <span>Special Promotion: {product.offer}</span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PRODUCT SPECIFICATIONS & PURCHASE ACTIONS */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Category & Rating */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                {product.category || "Designer Collection"}
              </span>

              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>{product.rating || "4.9"}</span>
                <span className="text-stone-400">({product.reviewsCount || 12} reviews)</span>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-xs sm:text-sm text-stone-600 mt-1 font-light leading-relaxed">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-gradient-to-br from-amber-50/70 via-gold-50/50 to-white rounded-2xl border border-amber-200 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-bold">
                  Special Boutique Price
                </span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-brand-950 font-mono">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm sm:text-base text-stone-400 line-through font-mono">
                      ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {savingsAmount > 0 && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-300 shadow-2xs">
                  Save ₹{savingsAmount.toLocaleString('en-IN')} ({discountPercent}% OFF)
                </span>
              )}
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Select Size: <strong className="text-amber-900">{selectedSize}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer underline"
                  >
                    <Ruler size={13} />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-[44px] h-10 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                        selectedSize === sz
                          ? 'bg-[#700b1d] text-gold-100 border-2 border-[#700b1d] shadow-sm font-black scale-105'
                          : 'bg-stone-50 hover:bg-amber-50 text-stone-800 border border-stone-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Size Guide Table Toggle */}
                {showSizeGuide && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-stone-700 animate-fadeIn space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold text-stone-900 flex items-center gap-1.5">
                        <Ruler size={14} className="text-amber-700" />
                        <span>Boutique Body Measurement Chart (Inches)</span>
                      </strong>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-200/70 px-2 py-0.5 rounded">Standard Fit</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-[11px] font-mono border-collapse bg-white rounded-xl overflow-hidden border border-amber-200">
                        <thead className="bg-amber-100/70 text-amber-950 font-bold">
                          <tr>
                            <th className="p-1.5 border-b border-amber-200">Size</th>
                            <th className="p-1.5 border-b border-amber-200">Bust</th>
                            <th className="p-1.5 border-b border-amber-200">Waist</th>
                            <th className="p-1.5 border-b border-amber-200">Hip</th>
                            <th className="p-1.5 border-b border-amber-200">Length</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100 text-stone-800">
                          <tr className={selectedSize === 'S' ? 'bg-amber-100 font-bold' : ''}>
                            <td className="p-1.5 font-bold">S</td>
                            <td className="p-1.5">36"</td>
                            <td className="p-1.5">32"</td>
                            <td className="p-1.5">38"</td>
                            <td className="p-1.5">44"</td>
                          </tr>
                          <tr className={selectedSize === 'M' ? 'bg-amber-100 font-bold' : ''}>
                            <td className="p-1.5 font-bold">M</td>
                            <td className="p-1.5">38"</td>
                            <td className="p-1.5">34"</td>
                            <td className="p-1.5">40"</td>
                            <td className="p-1.5">44"</td>
                          </tr>
                          <tr className={selectedSize === 'L' ? 'bg-amber-100 font-bold' : ''}>
                            <td className="p-1.5 font-bold">L</td>
                            <td className="p-1.5">40"</td>
                            <td className="p-1.5">36"</td>
                            <td className="p-1.5">42"</td>
                            <td className="p-1.5">45"</td>
                          </tr>
                          <tr className={selectedSize === 'XL' ? 'bg-amber-100 font-bold' : ''}>
                            <td className="p-1.5 font-bold">XL</td>
                            <td className="p-1.5">42"</td>
                            <td className="p-1.5">38"</td>
                            <td className="p-1.5">44"</td>
                            <td className="p-1.5">45"</td>
                          </tr>
                          <tr className={selectedSize === 'XXL' ? 'bg-amber-100 font-bold' : ''}>
                            <td className="p-1.5 font-bold">XXL</td>
                            <td className="p-1.5">44"</td>
                            <td className="p-1.5">40"</td>
                            <td className="p-1.5">46"</td>
                            <td className="p-1.5">46"</td>
                          </tr>
                          <tr className={selectedSize === '3XL' ? 'bg-amber-100 font-bold' : ''}>
                            <td className="p-1.5 font-bold">3XL</td>
                            <td className="p-1.5">46"</td>
                            <td className="p-1.5">42"</td>
                            <td className="p-1.5">48"</td>
                            <td className="p-1.5">46"</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-stone-500 italic">Tip: If you fall between two sizes, we recommend picking 1 size larger for comfortable festive movement.</p>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center bg-stone-50 border border-stone-300 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus size={13} />
                </button>
                <span className="w-9 text-center font-mono font-bold text-xs text-stone-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="py-3.5 px-4 bg-gradient-to-r from-[#700b1d] via-[#5c0716] to-[#42040f] hover:from-[#850e24] hover:to-[#540614] text-gold-100 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all border border-gold-400/40"
              >
                {isAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
                <span>{isAdded ? 'Added to Bag!' : `Add to Bag (₹${(product.price * quantity).toLocaleString('en-IN')})`}</span>
              </button>

              <button
                type="button"
                onClick={handleChannelOrder}
                className={`py-3.5 px-4 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all ${
                  isTelegram
                    ? 'bg-sky-500 hover:bg-sky-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isTelegram ? <Send size={16} /> : <MessageCircle size={16} />}
                <span>Order on {channelLabel}</span>
              </button>
            </div>

            {/* Pincode Delivery Estimator */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#700b1d]" />
                  <span>Check Express Delivery & Pincode:</span>
                </span>
                <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  Prepaid Only • No COD
                </span>
              </div>

              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode (e.g. 302001)"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-800 focus:outline-none focus:border-brand-700"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Check
                </button>
              </form>

              {pincodeResult && (
                <div className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  pincodeResult.valid 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {pincodeResult.valid ? <Check size={14} className="text-emerald-700 shrink-0" /> : <X size={14} className="text-rose-600 shrink-0" />}
                  <span>{pincodeResult.message}</span>
                </div>
              )}
            </div>

            {/* Product Specifications & Care */}
            <div className="p-4 bg-[#faf8f5] rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-bold">Fabric</span>
                  <strong className="text-stone-900">{product.fabric || "Pure Silk / Chanderi Cotton"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-bold">Color / Pattern</span>
                  <strong className="text-stone-900">{product.color || "Handcrafted Ethnic Zari"}</strong>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 pt-2 border-t border-stone-200 leading-relaxed">
                {product.description || "Handcrafted boutique ensemble with fine threadwork, tailored for festive celebrations and everyday elegance."}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px] font-bold text-stone-600">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                <ShieldCheck size={16} className="mx-auto text-emerald-600 mb-0.5" />
                <span>100% Original</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                <Truck size={16} className="mx-auto text-amber-600 mb-0.5" />
                <span>Fast Dispatch</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                <RefreshCw size={16} className="mx-auto text-blue-600 mb-0.5" />
                <span>Easy Exchange</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Lightbox Modal for Photo Zoom */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer z-50"
          >
            <X size={22} />
          </button>
          <img
            src={normalizeImageUrl(activeImage)}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};
