import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  getStoredProducts, 
  saveStoredProducts, 
  getStoredCategories, 
  saveStoredCategories, 
  getStoredSettings, 
  saveStoredSettings, 
  getStoredOrders, 
  getStoredCoupons,
  saveStoredCoupons,
  getStoredReviews,
  saveStoredReviews,
  getStoredWishlist,
  saveStoredWishlist,
  getAdminAuthStatus, 
  setAdminAuthStatus,
  loadAllFromIndexedDB
} from './utils/storage';

import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { StoryReels } from './components/StoryReels';
import { EditorialCapsules } from './components/EditorialCapsules';
import { CategoryChips } from './components/CategoryChips';
import { ProductCard } from './components/ProductCard';
import { ProductQuickView } from './components/ProductQuickView';
import { CartDrawer } from './components/CartDrawer';
import { WhatsAppCheckoutModal } from './components/WhatsAppCheckoutModal';
import { SpinWheelModal } from './components/SpinWheelModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { CustomerReviews } from './components/CustomerReviews';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminPage } from './components/admin/AdminPage';
import { Footer } from './components/Footer';
import { getSpinWheelConfig, fetchCloudSpinWheelConfig } from './utils/spinWheel';
import { fetchCloudLuckyDrawConfig } from './utils/luckyDraw';

import { 
  Sparkles, 
  MessageCircle, 
  ArrowUpDown, 
  Search, 
  FilterX,
  LayoutGrid,
  Grid2X2,
  Heart,
  Send
} from 'lucide-react';
import { getDirectChannelLink } from './utils/whatsapp';
import { 
  fetchCloudProducts, 
  saveCloudProduct,
  deleteCloudProduct,
  syncCloudProducts, 
  fetchCloudCategories, 
  saveCloudCategory,
  deleteCloudCategory,
  syncCloudCategories, 
  fetchCloudSettings, 
  syncCloudSettings, 
  fetchCloudCoupons, 
  saveCloudCoupon,
  deleteCloudCoupon,
  syncCloudCoupons, 
  fetchCloudReviews, 
  saveCloudReview,
  deleteCloudReview,
  syncCloudReviews, 
  fetchCloudOrders,
  recordCloudOrder,
  subscribeToCloudChanges
} from './utils/cloudSync';
import { isSupabaseConfigured } from './utils/supabaseClient';

export function App() {
  // Persistent State
  const [products, setProducts] = useState(getStoredProducts);
  const [categories, setCategories] = useState(getStoredCategories);
  const [settings, setSettings] = useState(getStoredSettings);
  const [orders, setOrders] = useState(getStoredOrders);
  const [coupons, setCoupons] = useState(getStoredCoupons);
  const [reviews, setReviews] = useState(getStoredReviews);
  const [wishlist, setWishlist] = useState(getStoredWishlist);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(getAdminAuthStatus);

  // Check if current URL is the secret admin route (/admin420 or /#admin420 or ?admin420)
  const checkIsAdminRoute = () => {
    const hash = (window.location.hash || '').toLowerCase();
    const path = (window.location.pathname || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();
    return hash.includes('admin420') || path.includes('admin420') || search.includes('admin420');
  };

  // View Navigation: 'store' | 'admin'
  const [currentView, setCurrentView] = useState(() => {
    return checkIsAdminRoute() ? 'admin' : 'store';
  });

  // Grid layout view: 'grid-4' | 'grid-2' (Zara lookbook style)
  const [gridLayout, setGridLayout] = useState('grid-4');

  // Cart State
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_kurti_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("price-low"); // 'price-low' (default: lowest price first) | 'popular' | 'price-high' | 'discount'

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLuckyDrawOpen, setIsLuckyDrawOpen] = useState(false);
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false);
  const [isCustomerAccountOpen, setIsCustomerAccountOpen] = useState(false);
  const [checkoutPricing, setCheckoutPricing] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const catalogRef = useRef(null);

  // Auto-Open Spin Wheel Popup on Website Load (1.5s delay)
  useEffect(() => {
    try {
      const spinCfg = getSpinWheelConfig();
      if (spinCfg.isEnabled !== false && spinCfg.autoOpenOnVisit !== false && !checkIsAdminRoute()) {
        const hasSeen = sessionStorage.getItem('aura_spin_wheel_seen_session');
        if (!hasSeen) {
          const timer = setTimeout(() => {
            setIsSpinWheelOpen(true);
            sessionStorage.setItem('aura_spin_wheel_seen_session', 'true');
          }, (spinCfg.autoOpenDelaySeconds || 1.5) * 1000);
          return () => clearTimeout(timer);
        }
      }
    } catch {}
  }, []);

  // URL Hash & Route Listener for Secret Admin Portal (/admin420 or /#admin420)
  useEffect(() => {
    const handleRouteChange = () => {
      if (checkIsAdminRoute()) {
        setCurrentView('admin');
      } else {
        setCurrentView('store');
      }
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Initial Data Fetching from IndexedDB & Cloud Sync
  useEffect(() => {
    const loadAppData = async () => {
      // 1. First hydrate from browser's permanent IndexedDB
      try {
        const idbData = await loadAllFromIndexedDB();
        if (idbData.products && idbData.products.length > 0) setProducts(idbData.products);
        if (idbData.categories && idbData.categories.length > 0) setCategories(idbData.categories);
        if (idbData.settings && Object.keys(idbData.settings).length > 0) setSettings(idbData.settings);
        if (idbData.coupons && idbData.coupons.length > 0) setCoupons(idbData.coupons);
        if (idbData.reviews && idbData.reviews.length > 0) setReviews(idbData.reviews);
        if (idbData.orders && idbData.orders.length > 0) setOrders(idbData.orders);
      } catch (e) {
        console.warn("IndexedDB hydration error:", e);
      }

      // 2. Fetch from Supabase Cloud if configured
      if (isSupabaseConfigured()) {
        try {
          const [cloudProds, cloudCats, cloudSets, cloudCpns, cloudRevs, cloudOrds] = await Promise.all([
            fetchCloudProducts(),
            fetchCloudCategories(),
            fetchCloudSettings(),
            fetchCloudCoupons(),
            fetchCloudReviews(),
            fetchCloudOrders(),
            fetchCloudSpinWheelConfig(),
            fetchCloudLuckyDrawConfig()
          ]);
          if (cloudProds && cloudProds.length > 0) setProducts(cloudProds);
          if (cloudCats && cloudCats.length > 0) setCategories(cloudCats);
          if (cloudSets && Object.keys(cloudSets).length > 0) setSettings(cloudSets);
          if (cloudCpns && cloudCpns.length > 0) setCoupons(cloudCpns);
          if (cloudRevs && cloudRevs.length > 0) setReviews(cloudRevs);
          if (cloudOrds && cloudOrds.length > 0) setOrders(cloudOrds);
        } catch (err) {
          console.error("Cloud data fetch error:", err);
        }
      }
    };
    loadAppData();
  }, []);

  // Realtime Live Synchronization across all devices / phones
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const unsubscribe = subscribeToCloudChanges({
      onProductsChange: (freshProds) => {
        if (freshProds && freshProds.length > 0) setProducts(freshProds);
      },
      onCategoriesChange: (freshCats) => {
        if (freshCats && freshCats.length > 0) setCategories(freshCats);
      },
      onSettingsChange: (freshSets) => {
        if (freshSets && Object.keys(freshSets).length > 0) setSettings(freshSets);
      },
      onCouponsChange: (freshCpns) => {
        if (freshCpns && freshCpns.length > 0) setCoupons(freshCpns);
      },
      onReviewsChange: (freshRevs) => {
        if (freshRevs && freshRevs.length > 0) setReviews(freshRevs);
      },
      onOrdersChange: (freshOrds) => {
        if (freshOrds && freshOrds.length > 0) setOrders(freshOrds);
      },
      onSpinWheelConfigChange: () => {
        // Automatically syncs to localStorage and re-triggers SpinWheelModal state
      },
      onLuckyDrawConfigChange: () => {
        // Automatically syncs to localStorage
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('aura_kurti_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Save wishlist
  const handleToggleWishlist = (productId) => {
    setWishlist(prev => {
      const updated = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      saveStoredWishlist(updated);
      return updated;
    });
  };

  // Cart Handlers
  const handleAddToCart = (product, selectedSize = 'M', quantity = 1) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(
        item => item.id === product.id && item.selectedSize === selectedSize
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            category: product.category,
            fabric: product.fabric,
            selectedSize,
            quantity
          }
        ];
      }
    });
  };

  const handleUpdateQuantity = (id, selectedSize, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id, selectedSize);
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === id && item.selectedSize === selectedSize
            ? { ...item, quantity: newQty }
            : item
        )
      );
    }
  };

  const handleRemoveItem = (id, selectedSize) => {
    setCartItems(prev =>
      prev.filter(item => !(item.id === id && item.selectedSize === selectedSize))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Admin Single Item Instant Cloud Handlers
  const handleSaveSingleProduct = async (product) => {
    setProducts(prev => {
      const exists = prev.some(p => p.id === product.id);
      return exists ? prev.map(p => p.id === product.id ? product : p) : [product, ...prev];
    });
    await saveCloudProduct(product);
  };

  const handleDeleteSingleProduct = async (productId) => {
    setProducts(prev => prev.filter(p => String(p.id) !== String(productId)));
    await deleteCloudProduct(productId);
  };

  const handleSaveSingleCategory = async (cat) => {
    setCategories(prev => {
      const cName = typeof cat === 'string' ? cat : cat.name;
      const exists = prev.some(c => (c.id && c.id === cat.id) || (typeof c === 'string' ? c === cName : c.name === cName));
      return exists 
        ? prev.map(c => ((c.id && c.id === cat.id) || (typeof c === 'string' ? c === cName : c.name === cName)) ? cat : c)
        : [...prev, cat];
    });
    await saveCloudCategory(cat);
  };

  const handleDeleteSingleCategory = async (catId, catName) => {
    setCategories(prev => prev.filter(c => {
      const name = typeof c === 'string' ? c : c.name;
      return c.id !== catId && name !== catName;
    }));
    await deleteCloudCategory(catId, catName);
  };

  const handleSaveSingleCoupon = async (coupon) => {
    setCoupons(prev => [coupon, ...prev.filter(c => c.code !== coupon.code)]);
    await saveCloudCoupon(coupon);
  };

  const handleDeleteSingleCoupon = async (code) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
    await deleteCloudCoupon(code);
  };

  const handleSaveSingleReview = async (review) => {
    setReviews(prev => [review, ...prev.filter(r => r.id !== review.id)]);
    await saveCloudReview(review);
  };

  const handleDeleteSingleReview = async (reviewId) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    await deleteCloudReview(reviewId);
  };

  // Bulk Admin Handlers (Saves both locally and to Supabase Cloud)
  const handleSaveProducts = (newProducts) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
    syncCloudProducts(newProducts);
  };

  const handleSaveCategories = (newCategories) => {
    setCategories(newCategories);
    saveStoredCategories(newCategories);
    syncCloudCategories(newCategories);
  };

  const handleSaveCoupons = (newCoupons) => {
    setCoupons(newCoupons);
    saveStoredCoupons(newCoupons);
    syncCloudCoupons(newCoupons);
  };

  const handleSaveReviews = (newReviews) => {
    setReviews(newReviews);
    saveStoredReviews(newReviews);
    syncCloudReviews(newReviews);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    syncCloudSettings(newSettings);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setAdminAuthStatus(true);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminAuthStatus(false);
  };

  const handleOpenAdminPage = () => {
    window.location.hash = '#admin420';
    setCurrentView('admin');
  };

  const handleBackToStore = () => {
    window.location.hash = '';
    if (window.location.pathname.toLowerCase().includes('admin420')) {
      window.history.pushState(null, '', '/');
    }
    setCurrentView('store');
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesCategory = selectedCategory === "All" || 
          (product.category && product.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
        const matchesSearch = 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.fabric && product.fabric.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.color && product.color.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.badge && product.badge.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.offer && product.offer.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'discount') {
          const discA = a.originalPrice ? (a.originalPrice - a.price) : 0;
          const discB = b.originalPrice ? (b.originalPrice - b.price) : 0;
          if (discB !== discA) return discB - discA;
          return a.price - b.price;
        }
        if (sortBy === 'popular') {
          if ((b.rating || 0) !== (a.rating || 0)) {
            return (b.rating || 0) - (a.rating || 0);
          }
          return a.price - b.price;
        }
        // Default priority: lowest price first
        return a.price - b.price;
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // =========================================================================
  // RENDER DEDICATED FULL-SCREEN ADMIN PAGE
  // =========================================================================
  if (currentView === 'admin') {
    return (
      <AdminPage
        products={products}
        onSaveProducts={handleSaveProducts}
        onSaveSingleProduct={handleSaveSingleProduct}
        onDeleteSingleProduct={handleDeleteSingleProduct}
        categories={categories}
        onSaveCategories={handleSaveCategories}
        onSaveSingleCategory={handleSaveSingleCategory}
        onDeleteSingleCategory={handleDeleteSingleCategory}
        coupons={coupons}
        onSaveCoupons={handleSaveCoupons}
        onSaveSingleCoupon={handleSaveSingleCoupon}
        onDeleteSingleCoupon={handleDeleteSingleCoupon}
        reviews={reviews}
        onSaveReviews={handleSaveReviews}
        onSaveSingleReview={handleSaveSingleReview}
        onDeleteSingleReview={handleDeleteSingleReview}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        orders={orders}
        isAdminLoggedIn={isAdminLoggedIn}
        onLoginSuccess={handleAdminLoginSuccess}
        onLogout={handleAdminLogout}
        onBackToStore={handleBackToStore}
      />
    );
  }

  // =========================================================================
  // RENDER CUSTOMER STOREFRONT (Zara / H&M Luxury Fashion Aesthetic)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] pb-16 md:pb-0">
      
      {/* Header & Navigation */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={handleOpenAdminPage}
        onOpenLuckyDraw={() => document.getElementById('lucky-draw-section')?.scrollIntoView({ behavior: 'smooth' })}
        onOpenSpinWheel={() => setIsSpinWheelOpen(true)}
        onOpenCustomerAccount={() => setIsCustomerAccountOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
        settings={settings}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleAdminLogout}
        products={products}
        onQuickView={setQuickViewProduct}
        onScrollToCatalog={scrollToCatalog}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        
        {/* Zara / Instagram Style Story Highlights Bar */}
        <StoryReels 
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            scrollToCatalog();
          }}
        />

        {/* Luxury Hero Banner */}
        <HeroBanner
          onExploreClick={scrollToCatalog}
          settings={settings}
        />

        {/* Zara / H&M Haute Couture Lookbook Editorial Capsules */}
        <EditorialCapsules 
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            scrollToCatalog();
          }}
        />

        {/* In-Page Product Detail Studio (When a Product is Selected) */}
        {quickViewProduct && (
          <ProductQuickView
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            onAddToCart={handleAddToCart}
            settings={settings}
          />
        )}

        {/* Women Fashion Categories Selector */}
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          products={products}
        />

        {/* Product Catalog Section */}
        <section ref={catalogRef} className="container mx-auto px-4 py-8">
          
          {/* Section Header with Controls (Zara / H&M Minimalist Bar) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ebdcc7]">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2">
                <span>{selectedCategory === 'All' ? "Women's Designer Collection" : selectedCategory}</span>
                <Sparkles size={20} className="text-gold-600" />
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5 font-light">
                Handcrafted designer Sarees, Kurtis, Anarkalis, Lehengas & Western silhouettes.
              </p>
            </div>

            {/* View Switcher & Sort Controls */}
            <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
              
              {/* Grid Switcher (2-Column Editorial vs 4-Column Dense) */}
              <div className="hidden sm:flex items-center bg-white border border-[#ebdcc7] rounded-xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setGridLayout('grid-4')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    gridLayout === 'grid-4' ? 'bg-brand-900 text-gold-200 shadow-xs' : 'text-stone-400 hover:text-stone-800'
                  }`}
                  title="Dense Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setGridLayout('grid-2')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    gridLayout === 'grid-2' ? 'bg-brand-900 text-gold-200 shadow-xs' : 'text-stone-400 hover:text-stone-800'
                  }`}
                  title="Editorial Lookbook View"
                >
                  <Grid2X2 size={15} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-500 font-semibold flex items-center gap-1">
                  <ArrowUpDown size={13} /> Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-semibold bg-white border border-[#ebdcc7] text-stone-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-700 shadow-xs cursor-pointer"
                >
                  <option value="price-low">🔥 Lowest Price First (Low to High)</option>
                  <option value="popular">Popular & Top Rated</option>
                  <option value="price-high">Price: High to Low (Luxury Edition)</option>
                  <option value="discount">Biggest Discount & Offers</option>
                </select>
              </div>

            </div>
          </div>

          {/* Active Search / Filter Pill */}
          {(searchQuery || selectedCategory !== 'All') && (
            <div className="flex items-center gap-2 mb-6 bg-gold-50/80 border border-gold-300/60 p-2.5 rounded-2xl text-xs text-stone-700">
              <span className="font-bold text-gold-900">Active Filter:</span>
              {selectedCategory !== 'All' && (
                <span className="bg-white px-2.5 py-0.5 rounded-lg border border-gold-200 font-semibold">
                  Category: <strong>{selectedCategory}</strong>
                </span>
              )}
              {searchQuery && (
                <span className="bg-white px-2.5 py-0.5 rounded-lg border border-gold-200 font-semibold">
                  Search: <strong>"{searchQuery}"</strong>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="ml-auto flex items-center gap-1 text-rose-700 hover:text-rose-900 font-bold hover:underline cursor-pointer"
              >
                <FilterX size={14} />
                <span>Clear Filters</span>
              </button>
            </div>
          )}

          {/* Products Grid (Responsive Zara / H&M Catalog) */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#ebdcc7] shadow-sm space-y-4 my-6">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Search size={32} />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-800">
                No Items Match Your Selection
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try searching for different keywords, clear category filters, or explore all women's fashion items.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="px-6 py-2.5 royal-maroon-bg text-gold-100 text-xs font-bold rounded-full shadow-md hover:opacity-95 transition-all cursor-pointer"
              >
                Show All Items
              </button>
            </div>
          ) : (
            <div className={
              gridLayout === 'grid-2'
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8"
                : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            }>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onQuickView={setQuickViewProduct}
                  settings={settings}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          )}

        </section>

        {/* Customer Social Proof & Verified Reviews */}
        <CustomerReviews reviews={reviews} />

      </main>

      {/* Floating WhatsApp / Telegram Quick Action Button (Desktop Only - Mobile has Bottom Nav) */}
      {!isCartOpen && !isCheckoutOpen && !quickViewProduct && (
        <a
          href={getDirectChannelLink(settings, `Hello ${settings.storeName || 'Radhika Kurti Collection'}! I would like to inquire about your Women Fashion Collection`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden sm:flex fixed bottom-6 right-6 z-40 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white group cursor-pointer ${
            settings.orderChannel === 'telegram'
              ? 'bg-sky-500 hover:bg-sky-600'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
          title={`Chat Directly on ${settings.orderChannel === 'telegram' ? 'Telegram' : 'WhatsApp'}`}
        >
          {settings.orderChannel === 'telegram' ? (
            <Send size={22} className="group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <MessageCircle size={24} className="group-hover:animate-bounce" />
          )}
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            {settings.orderChannel === 'telegram' ? 'Telegram Order' : 'WhatsApp Order'}
          </span>
        </a>
      )}

      {/* Cart Drawer with Luxury Features */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={(pricing) => {
          setCheckoutPricing(pricing);
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        appliedPromo={appliedPromo}
        setAppliedPromo={setAppliedPromo}
        coupons={coupons}
        settings={settings}
      />

      {/* WhatsApp Checkout Modal */}
      <WhatsAppCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        appliedPromo={appliedPromo}
        settings={settings}
        checkoutPricing={checkoutPricing}
        onOrderSuccess={() => {
          setOrders(getStoredOrders());
          handleClearCart();
          try {
            localStorage.removeItem('aura_kurti_cart_timer_deadline');
          } catch {}
        }}
      />

      {/* 🎡 VIP Spin the Wheel Modal */}
      <SpinWheelModal
        isOpen={isSpinWheelOpen}
        onClose={() => setIsSpinWheelOpen(false)}
        onOpenStoreCatalog={() => {
          setIsSpinWheelOpen(false);
          scrollToCatalog();
        }}
        onApplyCouponCode={(code) => {
          const matched = coupons.find(c => c.code === code);
          if (matched) {
            setAppliedPromo(matched);
          } else {
            setAppliedPromo({
              code: code,
              discountType: code.includes('25') ? 'percentage' : 'flat',
              discountValue: code.includes('500') ? 500 : (code.includes('300') ? 300 : (code.includes('25') ? 25 : 100)),
              description: 'Won on Spin Wheel'
            });
          }
        }}
      />

      {/* 👤 Amazon / Flipkart Style Customer Account Center Sidebar Drawer */}
      <CustomerAccountModal
        isOpen={isCustomerAccountOpen}
        onClose={() => setIsCustomerAccountOpen(false)}
        onOpenCart={() => {
          setIsCustomerAccountOpen(false);
          setIsCartOpen(true);
        }}
        onOpenCatalog={() => {
          setIsCustomerAccountOpen(false);
          scrollToCatalog();
        }}
      />

      {/* Boutique Footer */}
      <Footer
        onOpenAdmin={handleOpenAdminPage}
        settings={settings}
        onSelectCategory={setSelectedCategory}
        categories={categories}
      />

      {/* 📱 Native Mobile App Docked Bottom Navigation Bar */}
      <MobileBottomNav
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSpinWheel={() => setIsSpinWheelOpen(true)}
        onOpenCustomerAccount={() => setIsCustomerAccountOpen(true)}
        onScrollToCatalog={scrollToCatalog}
        settings={settings}
      />

    </div>
  );
}

export default App;
