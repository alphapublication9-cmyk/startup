import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Crown, 
  ArrowLeft, 
  ShoppingBag, 
  Layers, 
  Receipt, 
  ListOrdered, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  RotateCcw, 
  Sparkles, 
  Phone, 
  Building2, 
  CheckCircle2, 
  FolderPlus, 
  Tag, 
  DollarSign, 
  TrendingUp, 
  PackageCheck, 
  Search, 
  Check, 
  LogOut, 
  ExternalLink, 
  Printer,
  X,
  Percent,
  FileSpreadsheet,
  CheckCheck,
  BarChart3,
  MessageSquareQuote,
  Download,
  Star,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  ShoppingBasket,
  Send,
  MessageCircle,
  Database,
  Cloud,
  CheckCircle,
  Copy,
  Zap,
  Timer,
  Clock,
  Flame,
  Upload,
  Users,
  MousePointerClick,
  Navigation,
  Gift,
  Trophy,
  Award,
  Dice5,
  Sparkle,
  Share2
} from 'lucide-react';
import { SIZES, INITIAL_PRODUCTS, DEFAULT_CATEGORIES } from '../../data/initialProducts';
import { INITIAL_COUPONS, INITIAL_REVIEWS } from '../../data/initialCoupons';
import { OfficialInvoiceModal } from './OfficialInvoiceModal';
import { normalizeImageUrl, isGoogleDriveUrl } from '../../utils/imageUrl';
import { compressImageFile, compressDataUrl } from '../../utils/imageCompressor';
import { getProductAnalyticsList, resetProductAnalytics, fetchAndMergeCloudAnalytics } from '../../utils/productAnalytics';
import { getStoredCustomers, deleteCustomerLead, exportCustomersToCSV } from '../../utils/customerDirectory';
import { 
  getLuckyDrawConfig, 
  fetchCloudLuckyDrawConfig,
  saveLuckyDrawConfig, 
  getLuckyDrawUsers, 
  saveLuckyDrawUsers, 
  getUserDrawEligibility,
  DEFAULT_LUCKY_DRAW_CONFIG
} from '../../utils/luckyDraw';
import { 
  getSpinWheelConfig, 
  fetchCloudSpinWheelConfig,
  saveSpinWheelConfig, 
  getSpinWinsHistory,
  DEFAULT_SPIN_CONFIG
} from '../../utils/spinWheel';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  isSupabaseConfigured, 
  testSupabaseConnection 
} from '../../utils/supabaseClient';
import { 
  pushAllDataToSupabase, 
  SUPABASE_SQL_SCHEMA,
  fetchCloudProducts,
  fetchCloudCategories,
  fetchCloudSettings,
  fetchCloudCoupons,
  fetchCloudReviews
} from '../../utils/cloudSync';

export const AdminPage = ({ 
  products = [], 
  onSaveProducts, 
  onSaveSingleProduct,
  onDeleteSingleProduct,
  categories = [], 
  onSaveCategories, 
  onSaveSingleCategory,
  onDeleteSingleCategory,
  coupons = [],
  onSaveCoupons,
  onSaveSingleCoupon,
  onDeleteSingleCoupon,
  reviews = [],
  onSaveReviews,
  onSaveSingleReview,
  onDeleteSingleReview,
  settings = {}, 
  onSaveSettings, 
  orders = [], 
  isAdminLoggedIn, 
  onLoginSuccess, 
  onLogout, 
  onBackToStore 
}) => {
  // Login State with Saved Credentials & Remember Me
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_admin_saved_creds');
      return saved ? JSON.parse(saved).remember !== false : true;
    } catch {
      return true;
    }
  });

  const [username, setUsername] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_admin_saved_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) return parsed.username;
      }
    } catch {}
    return '';
  });

  const [password, setPassword] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_admin_saved_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.password) return parsed.password;
      }
    } catch {}
    return '';
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard Active Tab State
  const [activeTab, setActiveTab] = useState('products'); 
  // 'products' | 'categories' | 'coupons' | 'analytics' | 'invoices' | 'orders' | 'reviews' | 'export' | 'settings'

  const [filterCategoryInTable, setFilterCategoryInTable] = useState('All');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Product Add / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Category Add / Edit Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    name: '',
    icon: '👗',
    image: '',
    offer: 'Up to 50% OFF',
    description: ''
  });

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponFormData, setCouponFormData] = useState({
    id: '',
    code: '',
    discountType: 'percentage', // 'percentage' | 'flat'
    discountValue: 10,
    minOrderAmount: 0,
    description: '',
    isActive: true
  });

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    id: '',
    name: '',
    city: '',
    rating: 5,
    date: 'Just now',
    productName: '',
    comment: '',
    verifiedBuyer: true
  });

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // Customer Directory (Delivery Leads) State
  const [customers, setCustomers] = useState(getStoredCustomers);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('All'); // 'All' | 'Repeat' | 'COD' | 'Prepaid'

  // Product Views & Engagement Analytics State
  const [productAnalyticsSearch, setProductAnalyticsSearch] = useState('');
  const [productAnalyticsSort, setProductAnalyticsSort] = useState('views'); // 'views' | 'quickViews' | 'cartAdds' | 'orders' | 'conversionRate'
  const [analyticsList, setAnalyticsList] = useState(() => getProductAnalyticsList(products));

  useEffect(() => {
    setAnalyticsList(getProductAnalyticsList(products));
    setCustomers(getStoredCustomers());
    // Auto-sync analytics from Supabase when analytics tab opens
    if (activeTab === 'analytics') {
      fetchAndMergeCloudAnalytics().then(() => {
        setAnalyticsList(getProductAnalyticsList(products));
      }).catch(() => {});
    }
  }, [products, activeTab]);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const handleRefreshAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      await fetchAndMergeCloudAnalytics(); // sync Supabase → localStorage
    } catch {}
    setAnalyticsList(getProductAnalyticsList(products));
    setAnalyticsLoading(false);
  };

  const handleResetAnalytics = () => {
    if (window.confirm("Are you sure you want to reset all product view and click analytics?")) {
      resetProductAnalytics();
      setAnalyticsList(getProductAnalyticsList(products));
    }
  };

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm("Remove this customer lead from directory?")) {
      deleteCustomerLead(customerId);
      setCustomers(getStoredCustomers());
    }
  };

  // Filtered & Sorted Product Analytics
  const filteredAnalyticsProducts = analyticsList.filter(p => {
    if (!productAnalyticsSearch.trim()) return true;
    const query = productAnalyticsSearch.toLowerCase();
    return p.name.toLowerCase().includes(query) || (p.category && p.category.toLowerCase().includes(query));
  });

  const sortedAnalyticsProducts = [...filteredAnalyticsProducts].sort((a, b) => {
    if (productAnalyticsSort === 'views') return (b.views || 0) - (a.views || 0);
    if (productAnalyticsSort === 'quickViews') return (b.quickViews || 0) - (a.quickViews || 0);
    if (productAnalyticsSort === 'cartAdds') return (b.cartAdds || 0) - (a.cartAdds || 0);
    if (productAnalyticsSort === 'orders') return (b.orders || 0) - (a.orders || 0);
    if (productAnalyticsSort === 'conversionRate') return (b.conversionRate || 0) - (a.conversionRate || 0);
    return 0;
  });

  // Filtered Customers Directory
  const filteredCustomers = customers.filter(c => {
    if (customerSearchQuery.trim()) {
      const q = customerSearchQuery.toLowerCase();
      const match = (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.pincode && c.pincode.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedCustomerFilter === 'Repeat') return (c.totalOrders || 0) > 1;
    if (selectedCustomerFilter === 'COD') return c.preferredPayment === 'Cash on Delivery' || c.preferredPayment === 'COD';
    if (selectedCustomerFilter === 'Prepaid') return c.preferredPayment === 'Prepaid' || c.preferredPayment === 'UPI';
    return true;
  });

  // ==========================================
  // LUCKY DRAW & CONTEST STUDIO STATE
  // ==========================================
  const [luckyDrawConfig, setLuckyDrawConfig] = useState(() => getLuckyDrawConfig() || DEFAULT_LUCKY_DRAW_CONFIG);
  const [luckyDrawUsers, setLuckyDrawUsers] = useState(() => getLuckyDrawUsers() || []);
  const [drawSearchQuery, setDrawSearchQuery] = useState('');
  const [drawEligibilityFilter, setDrawEligibilityFilter] = useState('All'); // 'All' | 'Eligible' | 'Ineligible'
  const [isDrawSyncing, setIsDrawSyncing] = useState(false);
  const [campaignFormData, setCampaignFormData] = useState(() => {
    const cfg = getLuckyDrawConfig() || DEFAULT_LUCKY_DRAW_CONFIG;
    return {
      title: cfg.title || '',
      tagline: cfg.tagline || '',
      minProductsRequired: cfg.minProductsRequired || 3,
      announcementDate: cfg.announcementDate || '2026-11-15',
      terms: cfg.terms || '',
      isActive: cfg.isActive !== false
    };
  });
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [editingPrizeId, setEditingPrizeId] = useState(null);
  const [prizeFormData, setPrizeFormData] = useState({
    id: '',
    title: '',
    worth: '₹2,999',
    image: '',
    description: ''
  });
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const [rollingCandidate, setRollingCandidate] = useState(null);

  useEffect(() => {
    if (activeTab === 'luckydraw') {
      const cfg = getLuckyDrawConfig() || DEFAULT_LUCKY_DRAW_CONFIG;
      setLuckyDrawConfig(cfg);
      setLuckyDrawUsers(getLuckyDrawUsers() || []);
      setCampaignFormData({
        title: cfg.title || '',
        tagline: cfg.tagline || '',
        minProductsRequired: cfg.minProductsRequired || 3,
        announcementDate: cfg.announcementDate || '2026-11-15',
        terms: cfg.terms || '',
        isActive: cfg.isActive !== false
      });
      // Also fetch fresh from cloud
      fetchCloudLuckyDrawConfig().then(cloudCfg => {
        if (cloudCfg) {
          setLuckyDrawConfig(cloudCfg);
          setCampaignFormData({
            title: cloudCfg.title || '',
            tagline: cloudCfg.tagline || '',
            minProductsRequired: cloudCfg.minProductsRequired || 3,
            announcementDate: cloudCfg.announcementDate || '2026-11-15',
            terms: cloudCfg.terms || '',
            isActive: cloudCfg.isActive !== false
          });
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  // Lucky Draw Handlers
  const handleSaveLuckyDrawCampaign = (e) => {
    e.preventDefault();
    const updated = {
      ...luckyDrawConfig,
      title: campaignFormData.title.trim(),
      tagline: campaignFormData.tagline.trim(),
      minProductsRequired: Number(campaignFormData.minProductsRequired) || 3,
      announcementDate: campaignFormData.announcementDate,
      terms: campaignFormData.terms,
      isActive: campaignFormData.isActive
    };
    saveLuckyDrawConfig(updated);
    setLuckyDrawConfig(updated);
    setSaveSuccessMsg("🎁 Lucky Draw campaign rules & settings saved successfully!");
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const handleToggleLuckyDrawActive = () => {
    const updated = {
      ...luckyDrawConfig,
      isActive: !luckyDrawConfig.isActive
    };
    saveLuckyDrawConfig(updated);
    setLuckyDrawConfig(updated);
    setCampaignFormData(prev => ({ ...prev, isActive: updated.isActive }));
  };

  const handleOpenAddPrize = () => {
    setEditingPrizeId(null);
    setPrizeFormData({
      id: `pz-${Date.now()}`,
      title: '',
      worth: '₹2,999',
      image: '',
      description: ''
    });
    setIsPrizeModalOpen(true);
  };

  const handleOpenEditPrize = (prize) => {
    setEditingPrizeId(prize.id);
    setPrizeFormData({
      id: prize.id,
      title: prize.title || '',
      worth: prize.worth || '',
      image: prize.image || '',
      description: prize.description || ''
    });
    setIsPrizeModalOpen(true);
  };

  const handleSavePrize = async (e) => {
    e.preventDefault();
    if (!prizeFormData.title.trim()) return;

    let finalImg = prizeFormData.image;
    if (finalImg && finalImg.startsWith('data:image/')) {
      try {
        finalImg = await compressDataUrl(finalImg);
      } catch {}
    }

    const currentPrizes = Array.isArray(luckyDrawConfig.prizes) ? luckyDrawConfig.prizes : [];
    let updatedPrizes;
    if (editingPrizeId) {
      updatedPrizes = currentPrizes.map(p => p.id === editingPrizeId ? { ...prizeFormData, image: finalImg } : p);
    } else {
      updatedPrizes = [...currentPrizes, { ...prizeFormData, id: `pz-${Date.now()}`, image: finalImg }];
    }

    const updatedConfig = { ...luckyDrawConfig, prizes: updatedPrizes };
    saveLuckyDrawConfig(updatedConfig);
    setLuckyDrawConfig(updatedConfig);
    setIsPrizeModalOpen(false);
    setSaveSuccessMsg(`🎁 Giveaway Prize "${prizeFormData.title}" saved!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleDeletePrize = (prizeId, prizeTitle) => {
    if (window.confirm(`Delete prize "${prizeTitle}" from giveaway?`)) {
      const currentPrizes = Array.isArray(luckyDrawConfig.prizes) ? luckyDrawConfig.prizes : [];
      const updatedPrizes = currentPrizes.filter(p => p.id !== prizeId);
      const updatedConfig = { ...luckyDrawConfig, prizes: updatedPrizes };
      saveLuckyDrawConfig(updatedConfig);
      setLuckyDrawConfig(updatedConfig);
    }
  };

  const handlePrizeFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      if (compressed) {
        setPrizeFormData(prev => ({ ...prev, image: compressed }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContestant = (userId) => {
    if (window.confirm("Are you sure you want to remove this contestant ticket?")) {
      const updated = luckyDrawUsers.filter(u => u.id !== userId);
      saveLuckyDrawUsers(updated);
      setLuckyDrawUsers(updated);
    }
  };

  // 1-Click Pick Random Winner
  const handlePickRandomWinner = () => {
    const minReq = luckyDrawConfig.minProductsRequired || 3;
    const eligibleUsers = luckyDrawUsers.filter(u => {
      const { isEligible } = getUserDrawEligibility(u.phone, minReq);
      return isEligible;
    });

    if (eligibleUsers.length === 0) {
      alert(`No eligible contestants found who have ordered minimum ${minReq} products yet!`);
      return;
    }

    setIsPickingWinner(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomUser = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
      setRollingCandidate(randomUser);
      counter++;
      if (counter > 18) {
        clearInterval(interval);
        const finalWinner = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
        const mainPrize = (luckyDrawConfig.prizes && luckyDrawConfig.prizes[0]) ? luckyDrawConfig.prizes[0].title : 'Mega Festive Hamper';
        const winnerData = {
          ticketNumber: finalWinner.ticketNumber,
          name: finalWinner.name,
          phone: finalWinner.phone,
          city: finalWinner.city || 'Jaipur',
          prizeTitle: mainPrize,
          declaredAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          notes: 'Declared live from Admin Studio'
        };
        const updatedConfig = { ...luckyDrawConfig, winner: winnerData };
        saveLuckyDrawConfig(updatedConfig);
        setLuckyDrawConfig(updatedConfig);
        setIsPickingWinner(false);
        setRollingCandidate(null);
        setSaveSuccessMsg(`🎉 Congratulations! Winner declared: ${finalWinner.name} (${finalWinner.ticketNumber})`);
        setTimeout(() => setSaveSuccessMsg(''), 5000);
      }
    }, 100);
  };

  const handleDeclareManualWinner = (user, prizeTitle) => {
    const winnerData = {
      ticketNumber: user.ticketNumber,
      name: user.name,
      phone: user.phone,
      city: user.city || 'Jaipur',
      prizeTitle: prizeTitle || (luckyDrawConfig.prizes?.[0]?.title || 'Mega Festive Prize'),
      declaredAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      notes: 'Selected directly by boutique admin'
    };
    const updatedConfig = { ...luckyDrawConfig, winner: winnerData };
    saveLuckyDrawConfig(updatedConfig);
    setLuckyDrawConfig(updatedConfig);
    setSaveSuccessMsg(`🎉 Winner declared: ${user.name} (${user.ticketNumber})`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleClearWinner = () => {
    if (window.confirm("Reset / Clear the currently declared winner? Contestants will see draw as pending.")) {
      const updatedConfig = { ...luckyDrawConfig, winner: null };
      saveLuckyDrawConfig(updatedConfig);
      setLuckyDrawConfig(updatedConfig);
    }
  };

  const minRequiredForDraw = luckyDrawConfig.minProductsRequired || 3;
  const filteredDrawUsers = luckyDrawUsers.filter(u => {
    if (drawSearchQuery.trim()) {
      const q = drawSearchQuery.toLowerCase();
      const match = (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.ticketNumber && u.ticketNumber.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q));
      if (!match) return false;
    }
    const { isEligible } = getUserDrawEligibility(u.phone, minRequiredForDraw);
    if (drawEligibilityFilter === 'Eligible') return isEligible;
    if (drawEligibilityFilter === 'Ineligible') return !isEligible;
    return true;
  });

  // ==========================================
  // SPIN & WIN WHEEL STUDIO STATE
  // ==========================================
  const [spinWheelConfig, setSpinWheelConfig] = useState(() => getSpinWheelConfig() || DEFAULT_SPIN_CONFIG);
  const [spinWinsHistory, setSpinWinsHistory] = useState(() => getSpinWinsHistory() || []);
  const [isSpinSyncing, setIsSpinSyncing] = useState(false);
  const [isSliceModalOpen, setIsSliceModalOpen] = useState(false);
  const [editingSliceIndex, setEditingSliceIndex] = useState(null);
  const [sliceFormData, setSliceFormData] = useState({
    id: '',
    label: '',
    subtext: '',
    type: 'product',
    couponCode: '',
    worth: '',
    color: '#700b1d',
    textColor: '#fde047',
    image: '',
    description: ''
  });

  useEffect(() => {
    if (activeTab === 'spinwheel') {
      const cfg = getSpinWheelConfig();
      setSpinWheelConfig(cfg || DEFAULT_SPIN_CONFIG);
      setSpinWinsHistory(getSpinWinsHistory() || []);
      // Also fetch fresh from cloud
      fetchCloudSpinWheelConfig().then(cloudCfg => {
        if (cloudCfg) setSpinWheelConfig(cloudCfg);
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleSyncSpinFromCloud = async () => {
    setIsSpinSyncing(true);
    try {
      const fresh = await fetchCloudSpinWheelConfig();
      if (fresh) setSpinWheelConfig(fresh);
      setSaveSuccessMsg("✅ Spin Wheel synced live from Supabase Cloud!");
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e) {
      setSaveSuccessMsg("⚠️ Could not reach cloud, using local config.");
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
    setIsSpinSyncing(false);
  };

  const handleSyncDrawFromCloud = async () => {
    setIsDrawSyncing(true);
    try {
      const fresh = await fetchCloudLuckyDrawConfig();
      if (fresh) {
        setLuckyDrawConfig(fresh);
        setCampaignFormData({
          title: fresh.title || '',
          tagline: fresh.tagline || '',
          minProductsRequired: fresh.minProductsRequired || 3,
          announcementDate: fresh.announcementDate || '2026-11-15',
          terms: fresh.terms || '',
          isActive: fresh.isActive !== false
        });
      }
      setSaveSuccessMsg("✅ Lucky Draw synced live from Supabase Cloud!");
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e) {
      setSaveSuccessMsg("⚠️ Could not reach cloud, using local config.");
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
    setIsDrawSyncing(false);
  };

  const handleSaveSpinWheelSettings = (e) => {
    e.preventDefault();
    saveSpinWheelConfig(spinWheelConfig);
    setSaveSuccessMsg("🎡 Spin Wheel settings & slices saved successfully!");
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleToggleSpinWheelActive = () => {
    const updated = {
      ...spinWheelConfig,
      isEnabled: spinWheelConfig.isEnabled === false ? true : false
    };
    saveSpinWheelConfig(updated);
    setSpinWheelConfig(updated);
  };

  const handleOpenAddSlice = () => {
    setEditingSliceIndex(null);
    setSliceFormData({
      id: `slice-${Date.now()}`,
      label: '',
      subtext: 'Exclusive Prize',
      type: 'product',
      couponCode: 'SPIN' + Math.floor(100 + Math.random() * 900),
      worth: '₹999',
      color: '#700b1d',
      textColor: '#fde047',
      image: '',
      description: ''
    });
    setIsSliceModalOpen(true);
  };

  const handleOpenEditSlice = (slice, index) => {
    setEditingSliceIndex(index);
    setSliceFormData({
      id: slice.id || `slice-${index}`,
      label: slice.label || '',
      subtext: slice.subtext || '',
      type: slice.type || 'product',
      couponCode: slice.couponCode || '',
      worth: slice.worth || '',
      color: slice.color || '#700b1d',
      textColor: slice.textColor || '#fde047',
      image: slice.image || '',
      description: slice.description || ''
    });
    setIsSliceModalOpen(true);
  };

  const handleSaveSlice = async (e) => {
    e.preventDefault();
    if (!sliceFormData.label.trim()) return;

    let finalImg = sliceFormData.image;
    if (finalImg && finalImg.startsWith('data:image/')) {
      try {
        finalImg = await compressDataUrl(finalImg);
      } catch {}
    }

    const currentSlices = Array.isArray(spinWheelConfig.slices) ? [...spinWheelConfig.slices] : [];
    if (editingSliceIndex !== null && editingSliceIndex >= 0) {
      currentSlices[editingSliceIndex] = { ...sliceFormData, image: finalImg };
    } else {
      currentSlices.push({ ...sliceFormData, image: finalImg });
    }

    const updatedConfig = { ...spinWheelConfig, slices: currentSlices };
    saveSpinWheelConfig(updatedConfig);
    setSpinWheelConfig(updatedConfig);
    setIsSliceModalOpen(false);
    setSaveSuccessMsg(`🎡 Wheel Slice "${sliceFormData.label}" updated!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleDeleteSlice = (index, label) => {
    if (window.confirm(`Delete wheel slice "${label}"?`)) {
      const currentSlices = Array.isArray(spinWheelConfig.slices) ? spinWheelConfig.slices.filter((_, i) => i !== index) : [];
      const updatedConfig = { ...spinWheelConfig, slices: currentSlices };
      saveSpinWheelConfig(updatedConfig);
      setSpinWheelConfig(updatedConfig);
    }
  };

  const handleSliceFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      if (compressed) {
        setSliceFormData(prev => ({ ...prev, image: compressed }));
      }
    } catch (err) {}
  };

  // Product Form State (Supports 3-4+ Multi-Images)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: categories[0]?.name || 'Kurtis & Suits',
    price: 999,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Pure Silk / Cotton',
    color: 'Multicolor',
    badge: 'Trending',
    offer: 'Flat 40% OFF',
    rating: 4.8,
    reviewsCount: 30,
    inStock: true,
    description: 'Handcrafted premium ethnic fashion ensemble with fine detailing.'
  });

  // Store Settings State with Live Props Sync
  const [storeSettings, setStoreSettings] = useState({ ...settings });
  const [importJsonInput, setImportJsonInput] = useState('');
  const [importStatusMsg, setImportStatusMsg] = useState('');

  // Keep storeSettings synchronized whenever settings prop updates from Supabase/Local storage
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setStoreSettings(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  // Cloud Database (Supabase) State
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig);
  const [supabaseStatus, setSupabaseStatus] = useState(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveAndTestSupabase = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsTestingSupabase(true);
    setSupabaseStatus(null);
    saveSupabaseConfig(supabaseConfig.url, supabaseConfig.anonKey);
    const result = await testSupabaseConnection();
    setSupabaseStatus(result);
    setIsTestingSupabase(false);
  };

  const handlePushAllToCloud = async () => {
    setIsPushingCloud(true);
    setSupabaseStatus(null);
    const result = await pushAllDataToSupabase();
    setSupabaseStatus(result);
    setIsPushingCloud(false);
  };

  const handlePullFromCloud = async () => {
    setIsPullingCloud(true);
    setSupabaseStatus(null);
    try {
      const [cloudProds, cloudCats, cloudSets, cloudCpns, cloudRevs] = await Promise.all([
        fetchCloudProducts(),
        fetchCloudCategories(),
        fetchCloudSettings(),
        fetchCloudCoupons(),
        fetchCloudReviews()
      ]);
      if (cloudProds && cloudProds.length > 0) onSaveProducts(cloudProds);
      if (cloudCats && cloudCats.length > 0) onSaveCategories(cloudCats);
      if (cloudSets && Object.keys(cloudSets).length > 0) {
        setStoreSettings(cloudSets);
        onSaveSettings(cloudSets);
      }
      if (cloudCpns && cloudCpns.length > 0) onSaveCoupons(cloudCpns);
      if (cloudRevs && cloudRevs.length > 0) onSaveReviews(cloudRevs);
      setSupabaseStatus({ success: true, message: '🎉 Latest live store data pulled from Supabase!' });
    } catch (e) {
      setSupabaseStatus({ success: false, message: 'Failed to pull data from cloud: ' + e.message });
    }
    setIsPullingCloud(false);
  };

  const handleCopySql = () => {
    try {
      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // 1-Click Sync / Export Full Store State
  const handleExportFullStoreJSON = () => {
    const fullData = {
      settings: storeSettings,
      products,
      categories,
      coupons,
      reviews
    };
    const jsonStr = JSON.stringify(fullData, null, 2);
    try {
      navigator.clipboard.writeText(jsonStr);
    } catch (e) {
      console.error(e);
    }

    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura_store_data_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }

    setImportStatusMsg('✅ Full store data copied to clipboard & downloaded as JSON!');
    setTimeout(() => setImportStatusMsg(''), 5000);
  };

  // 1-Click Import / Restore Full Store State
  const handleImportFullStoreJSON = () => {
    try {
      if (!importJsonInput.trim()) return;
      const parsed = JSON.parse(importJsonInput.trim());
      if (parsed.settings) {
        setStoreSettings(parsed.settings);
        onSaveSettings(parsed.settings);
      }
      if (Array.isArray(parsed.products)) {
        onSaveProducts(parsed.products);
      }
      if (Array.isArray(parsed.categories)) {
        onSaveCategories(parsed.categories);
      }
      if (Array.isArray(parsed.coupons)) {
        onSaveCoupons(parsed.coupons);
      }
      if (Array.isArray(parsed.reviews)) {
        onSaveReviews(parsed.reviews);
      }
      setImportStatusMsg('🎉 All settings, products, and categories successfully imported and applied!');
      setImportJsonInput('');
      setTimeout(() => setImportStatusMsg(''), 5000);
    } catch (e) {
      setImportStatusMsg('❌ Invalid JSON format! Please check and try again.');
      setTimeout(() => setImportStatusMsg(''), 4000);
    }
  };

  // Handle Admin Login Form with Remember Me Save
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    const correctUser = settings.adminUser || 'admin420';
    const correctPass = settings.adminPass || 'Radhika@420';

    if (username.trim() === correctUser && password.trim() === correctPass) {
      setLoginError('');
      if (rememberMe) {
        try {
          localStorage.setItem('aura_admin_saved_creds', JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            remember: true
          }));
        } catch (err) {
          console.error('Failed to save admin creds', err);
        }
      } else {
        try {
          localStorage.removeItem('aura_admin_saved_creds');
        } catch (err) {}
      }
      onLoginSuccess();
    } else {
      setLoginError('Invalid Admin ID or Password. Please enter correct credentials.');
    }
  };

  // Open Add/Edit Product Modal (Supports 3-4+ Images)
  const handleOpenEditProduct = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const rawImgs = Array.isArray(product.images) && product.images.length > 0 
        ? product.images 
        : [product.image].filter(Boolean);
      const initialImages = rawImgs.length > 0 ? rawImgs : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'];

      setFormData({
        ...product,
        image: initialImages[0] || product.image || '',
        images: initialImages,
        sizes: product.sizes || ['S', 'M', 'L', 'XL'],
        offer: product.offer || ''
      });
    } else {
      setEditingProduct(null);
      const defaultCat = categories[0] ? (typeof categories[0] === 'string' ? categories[0] : categories[0].name) : 'Kurtis & Suits';
      const defaultImg = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
      setFormData({
        id: `item-${Date.now()}`,
        name: '',
        category: defaultCat,
        price: 999,
        originalPrice: 1999,
        image: defaultImg,
        images: [defaultImg],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        fabric: 'Pure Silk / Cotton',
        color: 'Multicolor',
        badge: 'New Arrival',
        offer: 'Festive Flat 40% OFF',
        rating: 4.9,
        reviewsCount: 12,
        inStock: true,
        description: 'Handcrafted premium ethnic fashion ensemble with fine detailing.'
      });
    }
    setIsEditModalOpen(true);
  };

  // Multi-Image Gallery Handlers for Product
  const handleAddProductImageSlot = () => {
    const currentImgs = formData.images && formData.images.length > 0 ? formData.images : [formData.image || ''];
    if (currentImgs.length >= 6) {
      alert('Maximum 6 photos per product allowed.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...currentImgs, '']
    }));
  };

  const handleUpdateProductImage = async (index, url) => {
    let cleanUrl = normalizeImageUrl(url);
    if (cleanUrl && cleanUrl.startsWith('data:image/')) {
      try {
        cleanUrl = await compressDataUrl(cleanUrl);
      } catch (err) {
        console.warn("Image compression fallback:", err);
      }
    }
    const currentImgs = [...(formData.images && formData.images.length > 0 ? formData.images : [formData.image || ''])];
    currentImgs[index] = cleanUrl;
    setFormData(prev => ({
      ...prev,
      image: index === 0 ? cleanUrl : (prev.image || currentImgs[0]),
      images: currentImgs
    }));
  };

  const handleRemoveProductImage = (index) => {
    const currentImgs = (formData.images || [formData.image]).filter((_, i) => i !== index);
    const nextImages = currentImgs.length > 0 ? currentImgs : [''];
    setFormData(prev => ({
      ...prev,
      image: nextImages[0] || '',
      images: nextImages
    }));
  };

  const [isCompressingMultiple, setIsCompressingMultiple] = useState(false);

  // Bulk Upload Multiple Photos at Once (3-4+ photos selected in one click)
  const handleUploadMultipleProductImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsCompressingMultiple(true);
    try {
      const compressedList = await Promise.all(
        files.map(async (f) => {
          return await compressImageFile(f);
        })
      );

      const validCompressed = compressedList.filter(Boolean);
      if (validCompressed.length > 0) {
        setFormData(prev => {
          const currentValid = (prev.images || []).filter(img => img && typeof img === 'string' && img.trim().length > 0 && !img.includes('photo-1610030469983'));
          const combined = [...currentValid, ...validCompressed].slice(0, 8);
          return {
            ...prev,
            image: combined[0] || validCompressed[0],
            images: combined
          };
        });
      }
    } catch (err) {
      console.error("Multi-image upload error:", err);
    } finally {
      setIsCompressingMultiple(false);
      e.target.value = '';
    }
  };

  // Bulk Drop Multiple Photos at Once
  const handleDropMultipleProductImages = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    setIsCompressingMultiple(true);
    try {
      const compressedList = await Promise.all(
        files.map(async (f) => {
          return await compressImageFile(f);
        })
      );

      const validCompressed = compressedList.filter(Boolean);
      if (validCompressed.length > 0) {
        setFormData(prev => {
          const currentValid = (prev.images || []).filter(img => img && typeof img === 'string' && img.trim().length > 0 && !img.includes('photo-1610030469983'));
          const combined = [...currentValid, ...validCompressed].slice(0, 8);
          return {
            ...prev,
            image: combined[0] || validCompressed[0],
            images: combined
          };
        });
      }
    } catch (err) {
      console.error("Multi-image drop error:", err);
    } finally {
      setIsCompressingMultiple(false);
    }
  };

  const handleUploadProductImage = async (index, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      try {
        const resultUrl = await compressImageFile(file);
        if (resultUrl) {
          const currentImgs = [...(formData.images && formData.images.length > 0 ? formData.images : [formData.image || ''])];
          currentImgs[index] = resultUrl;
          setFormData(prev => ({
            ...prev,
            image: index === 0 ? resultUrl : (prev.image || currentImgs[0]),
            images: currentImgs
          }));
        }
      } catch (err) {
        console.error("Image compression error:", err);
      }
    } else {
      // Multiple files selected from slot
      setIsCompressingMultiple(true);
      try {
        const compressedList = await Promise.all(
          files.map(async (f) => compressImageFile(f))
        );
        const valid = compressedList.filter(Boolean);
        if (valid.length > 0) {
          setFormData(prev => {
            const currentImgs = [...(prev.images && prev.images.length > 0 ? prev.images : [prev.image || ''])];
            currentImgs.splice(index, 1, ...valid);
            const trimmed = currentImgs.filter(Boolean).slice(0, 8);
            return {
              ...prev,
              image: trimmed[0] || '',
              images: trimmed
            };
          });
        }
      } catch (err) {
        console.error("Slot multi-upload error:", err);
      } finally {
        setIsCompressingMultiple(false);
      }
    }
  };

  // Direct Clipboard Paste (Ctrl+V) handler for product photos
  const handlePasteProductImage = async (index, e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check for image files in clipboard (e.g. copied from desktop, file explorer, screenshot)
    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 || items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            try {
              const resultUrl = await compressImageFile(file);
              if (resultUrl) {
                const currentImgs = [...(formData.images && formData.images.length > 0 ? formData.images : [formData.image || ''])];
                currentImgs[index] = resultUrl;
                setFormData(prev => ({
                  ...prev,
                  image: index === 0 ? resultUrl : (prev.image || currentImgs[0]),
                  images: currentImgs
                }));
              }
            } catch (err) {
              console.error("Clipboard image paste error:", err);
            }
            return;
          }
        }
      }
    }

    // 2. Check for image text / URLs / data URLs in clipboard
    const pastedText = clipboardData.getData('text');
    if (pastedText && (pastedText.startsWith('http') || pastedText.startsWith('data:image/') || isGoogleDriveUrl(pastedText))) {
      e.preventDefault();
      await handleUpdateProductImage(index, pastedText);
    }
  };

  // Drag and drop image file directly onto photo slot
  const handleDropProductImage = async (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      try {
        const resultUrl = await compressImageFile(file);
        if (resultUrl) {
          const currentImgs = [...(formData.images && formData.images.length > 0 ? formData.images : [formData.image || ''])];
          currentImgs[index] = resultUrl;
          setFormData(prev => ({
            ...prev,
            image: index === 0 ? resultUrl : (prev.image || currentImgs[0]),
            images: currentImgs
          }));
        }
      } catch (err) {
        console.error("Drop image error:", err);
      }
    }
  };

  // 1-Click Clipboard Paste button using navigator.clipboard API
  const handlePasteFromClipboardBtn = async (index) => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const file = new File([blob], 'clipboard-photo.png', { type });
              const resultUrl = await compressImageFile(file);
              if (resultUrl) {
                const currentImgs = [...(formData.images && formData.images.length > 0 ? formData.images : [formData.image || ''])];
                currentImgs[index] = resultUrl;
                setFormData(prev => ({
                  ...prev,
                  image: index === 0 ? resultUrl : (prev.image || currentImgs[0]),
                  images: currentImgs
                }));
                return;
              }
            }
          }
        }
      }

      // Fallback to text read
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http') || text.startsWith('data:image/') || isGoogleDriveUrl(text))) {
          await handleUpdateProductImage(index, text);
          return;
        }
      }

      alert("Click inside the box and press Ctrl + V on your keyboard to paste the copied image.");
    } catch (err) {
      console.warn("Clipboard read notice:", err);
      alert("Please press Ctrl + V inside the input box to paste your copied image.");
    }
  };

  // Handle Photo File Upload for Category
  const handleCategoryFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resultUrl = await compressImageFile(file);
        if (resultUrl) {
          setCategoryFormData(prev => ({ ...prev, image: resultUrl }));
        }
      } catch (err) {
        console.error("Category image compression error:", err);
      }
    }
  };

  // Toggle Size in Product Form
  const handleSizeToggle = (size) => {
    const currentSizes = formData.sizes || [];
    if (currentSizes.includes(size)) {
      setFormData({ ...formData, sizes: currentSizes.filter(s => s !== size) });
    } else {
      setFormData({ ...formData, sizes: [...currentSizes, size] });
    }
  };

  // Save Product (Add or Edit with Multi-Image Support)
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSavingProduct(true);

    try {
      const rawImages = (formData.images || [formData.image])
        .map(img => typeof img === 'string' ? normalizeImageUrl(img.trim()) : '')
        .filter(Boolean);

      // Compress any uncompressed data URLs to ensure lightweight storage
      const cleanImages = await Promise.all(
        rawImages.map(async (img) => {
          if (img && img.startsWith('data:image/')) {
            try {
              return await compressDataUrl(img);
            } catch {
              return img;
            }
          }
          return img;
        })
      );

      const primaryImg = cleanImages[0] || normalizeImageUrl(formData.image) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
      const finalImages = cleanImages.length > 0 ? cleanImages : [primaryImg];

      const finalProduct = {
        ...formData,
        id: editingProduct ? editingProduct.id : (formData.id || `item-${Date.now()}`),
        image: primaryImg,
        images: finalImages
      };

      if (onSaveSingleProduct) {
        await onSaveSingleProduct(finalProduct);
      } else {
        let updatedProducts;
        if (editingProduct) {
          updatedProducts = products.map(p => p.id === editingProduct.id ? finalProduct : p);
        } else {
          updatedProducts = [{ ...finalProduct, id: `item-${Date.now()}` }, ...products];
        }
        onSaveProducts(updatedProducts);
      }

      setSaveSuccessMsg(`✅ Item "${finalProduct.name}" saved & synced live to cloud!`);
      setIsEditModalOpen(false);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Failed to save product: " + err.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this item from your boutique catalog?')) {
      if (onDeleteSingleProduct) {
        await onDeleteSingleProduct(id);
      } else {
        const updated = products.filter(p => p.id !== id);
        onSaveProducts(updated);
      }
      setSaveSuccessMsg('Item deleted successfully from local & cloud.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Open Add/Edit Category Modal
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryFormData({
        id: cat.id || `cat-${Date.now()}`,
        name: typeof cat === 'string' ? cat : cat.name,
        icon: typeof cat === 'string' ? '👗' : (cat.icon || '👗'),
        image: cat.image || '',
        offer: cat.offer || 'Up to 50% OFF',
        description: typeof cat === 'string' ? cat : (cat.description || '')
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        id: `cat-${Date.now()}`,
        name: '',
        icon: '👗',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
        offer: 'Festive Special',
        description: 'Exclusive designer collection'
      });
    }
    setIsCategoryModalOpen(true);
  };

  // Save Category (Add or Edit)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return;

    if (categoryFormData.image && categoryFormData.image.startsWith('data:image/')) {
      try {
        categoryFormData.image = await compressDataUrl(categoryFormData.image);
      } catch {}
    }

    const finalCat = {
      ...categoryFormData,
      id: editingCategory?.id || categoryFormData.id || `cat-${Date.now()}`,
      name: categoryFormData.name.trim()
    };

    if (onSaveSingleCategory) {
      await onSaveSingleCategory(finalCat);
    } else {
      let updatedCategories;
      if (editingCategory) {
        updatedCategories = categories.map(c => {
          const cName = typeof c === 'string' ? c : c.name;
          const editingName = typeof editingCategory === 'string' ? editingCategory : editingCategory.name;
          if (c.id === editingCategory.id || cName === editingName) {
            return finalCat;
          }
          return c;
        });
      } else {
        updatedCategories = [...categories, finalCat];
      }
      onSaveCategories(updatedCategories);
    }

    setSaveSuccessMsg(`Category "${finalCat.name}" saved & synced to cloud!`);
    setIsCategoryModalOpen(false);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Delete Category
  const handleDeleteCategory = async (catId, catName) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      if (onDeleteSingleCategory) {
        await onDeleteSingleCategory(catId, catName);
      } else {
        const updatedCategories = categories.filter(c => {
          const name = typeof c === 'string' ? c : c.name;
          return c.id !== catId && name !== catName;
        });
        onSaveCategories(updatedCategories);
      }
      setSaveSuccessMsg(`Category "${catName}" removed.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Coupon Handlers
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponFormData.code.trim()) return;

    const newCoupon = {
      ...couponFormData,
      id: couponFormData.id || `coup-${Date.now()}`,
      code: couponFormData.code.trim().toUpperCase(),
      discountValue: Number(couponFormData.discountValue) || 10,
      minOrderAmount: Number(couponFormData.minOrderAmount) || 0
    };

    if (onSaveSingleCoupon) {
      await onSaveSingleCoupon(newCoupon);
    } else {
      const updated = [newCoupon, ...coupons.filter(c => c.code !== newCoupon.code)];
      onSaveCoupons(updated);
    }
    setIsCouponModalOpen(false);
    setSaveSuccessMsg(`Coupon "${newCoupon.code}" created & synced to cloud!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleToggleCoupon = async (code) => {
    const target = coupons.find(c => c.code === code);
    if (target) {
      const updatedItem = { ...target, isActive: !target.isActive };
      if (onSaveSingleCoupon) {
        await onSaveSingleCoupon(updatedItem);
      } else {
        const updated = coupons.map(c => c.code === code ? updatedItem : c);
        onSaveCoupons(updated);
      }
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (window.confirm(`Delete coupon "${code}"?`)) {
      if (onDeleteSingleCoupon) {
        await onDeleteSingleCoupon(code);
      } else {
        const updated = coupons.filter(c => c.code !== code);
        onSaveCoupons(updated);
      }
      setSaveSuccessMsg(`Coupon "${code}" deleted.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Review Handlers
  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!reviewFormData.name.trim() || !reviewFormData.comment.trim()) return;

    const newRev = {
      ...reviewFormData,
      id: reviewFormData.id || `rev-${Date.now()}`
    };

    if (onSaveSingleReview) {
      await onSaveSingleReview(newRev);
    } else {
      const updated = [newRev, ...reviews];
      onSaveReviews(updated);
    }
    setIsReviewModalOpen(false);
    setSaveSuccessMsg('Customer review added & synced to cloud!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleDeleteReview = async (id) => {
    if (window.confirm('Delete this customer testimonial?')) {
      if (onDeleteSingleReview) {
        await onDeleteSingleReview(id);
      } else {
        const updated = reviews.filter(r => r.id !== id);
        onSaveReviews(updated);
      }
      setSaveSuccessMsg('Review deleted.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Open Invoice Modal
  const handleOpenInvoice = (order = null) => {
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onSaveSettings(storeSettings);
    try {
      await syncCloudSettings(storeSettings);
    } catch (err) {
      console.error("Cloud sync settings error:", err);
    }
    setSaveSuccessMsg('✅ Store settings, WhatsApp & Telegram channels updated & synced live to Cloud!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };


  // Export Data to CSV
  const handleExportProductsCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'OriginalPrice', 'Fabric', 'Color', 'Badge', 'Offer', 'InStock'];
    const rows = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.price,
      p.originalPrice || '',
      `"${(p.fabric || '').replace(/"/g, '""')}"`,
      `"${(p.color || '').replace(/"/g, '""')}"`,
      p.badge || '',
      `"${(p.offer || '').replace(/"/g, '""')}"`,
      p.inStock ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Products_Catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOrdersCSV = () => {
    const headers = ['OrderID', 'CustomerName', 'Phone', 'City', 'TotalAmount', 'PaymentMethod', 'Date', 'ItemsCount'];
    const rows = orders.map(o => [
      o.id,
      `"${(o.customer?.name || '').replace(/"/g, '""')}"`,
      o.customer?.phone || '',
      `"${(o.customer?.city || '').replace(/"/g, '""')}"`,
      o.totalAmount || 0,
      o.customer?.paymentMethod || 'COD',
      o.createdAt || '',
      o.items?.length || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Orders_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered products for admin table
  const tableProducts = products.filter(p => {
    const matchesCat = filterCategoryInTable === 'All' || p.category === filterCategoryInTable;
    const matchesSearch = 
      !productSearchQuery.trim() ||
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.fabric && p.fabric.toLowerCase().includes(productSearchQuery.toLowerCase())) ||
      (p.offer && p.offer.toLowerCase().includes(productSearchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtered orders for invoice generator
  const filteredInvoiceOrders = orders.filter(ord => {
    const q = invoiceSearchQuery.toLowerCase();
    const orderId = (ord.id || '').toLowerCase();
    const customerName = (ord.customer?.name || '').toLowerCase();
    const phone = (ord.customer?.phone || '').toLowerCase();
    return orderId.includes(q) || customerName.includes(q) || phone.includes(q);
  });

  // Calculate quick stats for analytics
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const inStockCount = products.filter(p => p.inStock).length;
  const codOrders = orders.filter(o => (o.customer?.paymentMethod || '').includes('Cash') || (o.customer?.paymentMethod || '').includes('COD')).length;
  const upiOrders = orders.length - codOrders;

  // ==========================================
  // VIEW 1: FULL SCREEN DEDICATED LOGIN PAGE
  // ==========================================
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-brand-950 to-stone-900 flex flex-col justify-between text-stone-100 relative overflow-hidden">
        
        {/* Background Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Strip */}
        <header className="p-4 sm:p-6 flex items-center justify-between border-b border-stone-800/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center shrink-0 drop-shadow-md">
              <img 
                src={settings.logoUrl || "/logo.png"} 
                alt={settings.storeName || "Radhika Kurti Collection"} 
                className="w-full h-full object-contain filter drop-shadow-xs" 
              />
            </div>
            <div>
              <span className="font-heading text-lg sm:text-xl font-bold tracking-widest text-gold-300">
                {settings.storeName || "RADHIKA KURTI COLLECTION"}
              </span>
              <p className="text-[10px] text-stone-400 tracking-wider uppercase">Executive Portal</p>
            </div>
          </div>

          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white rounded-full text-xs font-bold border border-white/15 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Online Store</span>
          </button>
        </header>

        {/* Center Dedicated Login Form Container */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-8">
          <div className="w-full max-w-md bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400/70 overflow-hidden text-stone-900">
            
            {/* Form Top Branding */}
            <div className="royal-maroon-bg text-gold-100 p-6 sm:p-8 text-center relative border-b border-gold-500/40">
              <div className="w-16 h-16 rounded-full bg-gold-400/20 border border-gold-400/60 flex items-center justify-center mx-auto mb-3 text-gold-300 shadow-inner">
                <Lock size={28} />
              </div>

              <h2 className="font-serif text-2xl font-bold tracking-wide">
                Boutique Admin Portal
              </h2>
              <p className="text-xs text-gold-200 mt-1 font-light">
                Manage luxury catalog, coupons, analytics & official bills
              </p>
            </div>

            {/* Login Form with Standard AutoComplete for Browser Password Manager */}
            <form 
              id="admin-login-form"
              name="admin_login"
              method="POST"
              action="#"
              autoComplete="on"
              onSubmit={handleLogin} 
              className="p-6 sm:p-8 space-y-4"
            >
              
              {loginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold animate-fadeIn">
                  <AlertCircle size={17} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Admin ID */}
              <div>
                <label htmlFor="admin-username" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Admin ID / Username
                </label>
                <div className="relative">
                  <input
                    id="admin-username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder="Enter Admin ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brand-700 focus:bg-white text-stone-900 font-medium"
                  />
                  <User className="absolute left-3.5 top-3.5 text-stone-400" size={17} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="admin-password" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter Admin Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brand-700 focus:bg-white text-stone-900 font-medium"
                  />
                  <KeyRound className="absolute left-3.5 top-3.5 text-stone-400" size={17} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox (Browser & Local Storage Save) */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-700 accent-[#700b1d] focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-semibold text-stone-800">
                    Save password on this browser & device
                  </span>
                </label>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Auto-Save
                </span>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full py-3.5 royal-maroon-bg hover:opacity-95 text-gold-100 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <ShieldCheck size={18} />
                <span>Enter Admin Dashboard</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onBackToStore}
                  className="text-xs text-stone-500 hover:text-brand-900 font-semibold cursor-pointer"
                >
                  ← Go back to Storefront
                </button>
              </div>

            </form>

          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-xs text-stone-500 border-t border-stone-800 z-10">
          © {new Date().getFullYear()} {settings.storeName || "AURA ETHNIC"}. Boutique Management System.
        </footer>

      </div>
    );
  }

  // ==========================================
  // VIEW 2: FULL SCREEN DEDICATED ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col justify-between text-stone-900">
      
      {/* 1. TOP DEDICATED ADMIN HEADER */}
      <header className="sticky top-0 z-30 royal-maroon-bg text-gold-100 shadow-xl border-b border-gold-500/40">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Logo & Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center shrink-0 drop-shadow-md">
              <img 
                src={settings.logoUrl || "/logo.png"} 
                alt={settings.storeName || "Radhika Kurti Collection"} 
                className="w-full h-full object-contain filter drop-shadow-xs" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-base sm:text-xl font-black tracking-widest text-gold-200">
                  {settings.storeName || "RADHIKA KURTI COLLECTION"} ADMIN
                </h1>
                <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                  PAWAN420 Active
                </span>
              </div>
              <p className="text-xs text-gold-200/90 font-light">
                Complete Ecommerce Control: Catalog • Categories • Coupons • Analytics • Invoices • Orders
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            <button
              onClick={() => handleOpenInvoice(null)}
              className="px-3.5 py-2 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-brand-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Create Official Tax Invoice"
            >
              <Receipt size={15} />
              <span>🧾 Create Bill</span>
            </button>

            <button
              onClick={onBackToStore}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
              title="View Customer Storefront"
            >
              <ExternalLink size={14} />
              <span>View Online Store</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-2 bg-rose-900/80 hover:bg-rose-900 text-rose-100 hover:text-white font-bold text-xs rounded-xl border border-rose-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Logout Admin"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>

        </div>

        {/* Status Notification */}
        {saveSuccessMsg && (
          <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn shadow-inner">
            <CheckCircle2 size={16} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Tabs Bar (Scrollable on mobile) */}
        <div className="bg-stone-900/95 px-4 sm:px-8 pt-2 flex items-center gap-1.5 overflow-x-auto border-t border-stone-800 scrollbar-none">
          
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <ShoppingBag size={15} className={activeTab === 'products' ? 'text-brand-900' : 'text-gold-400'} />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Layers size={15} className={activeTab === 'categories' ? 'text-brand-900' : 'text-gold-400'} />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Percent size={15} className={activeTab === 'coupons' ? 'text-brand-900' : 'text-gold-400'} />
            <span>Coupons & Promos ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <BarChart3 size={15} className={activeTab === 'analytics' ? 'text-brand-900' : 'text-gold-400'} />
            <span>Sales Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Receipt size={15} className={activeTab === 'invoices' ? 'text-brand-900' : 'text-gold-400'} />
            <span className="font-extrabold text-amber-700">🧾 Tax Invoices & Bills</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <ListOrdered size={15} className={activeTab === 'orders' ? 'text-brand-900' : 'text-gold-400'} />
            <span>Orders ({(orders || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Users size={15} className={activeTab === 'customers' ? 'text-brand-900' : 'text-gold-400'} />
            <span className="font-extrabold text-amber-700">👥 Customer Leads ({(customers || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('luckydraw')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'luckydraw'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Gift size={15} className={activeTab === 'luckydraw' ? 'text-amber-600' : 'text-gold-400'} />
            <span className="font-extrabold text-amber-400">🎁 Lucky Draw ({(luckyDrawUsers || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('spinwheel')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'spinwheel'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <span className="text-sm">🎡</span>
            <span className="font-extrabold text-amber-400">Spin Wheel Studio ({(spinWheelConfig?.slices || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <MessageSquareQuote size={15} className={activeTab === 'reviews' ? 'text-brand-900' : 'text-gold-400'} />
            <span>Buyer Reviews ({(reviews || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'export'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={15} className={activeTab === 'export' ? 'text-brand-900' : 'text-gold-400'} />
            <span>Data Export (CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#faf7f2] text-brand-950 border-stone-300 shadow-sm -mb-[1px]'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Settings size={15} className={activeTab === 'settings' ? 'text-brand-900' : 'text-gold-400'} />
            <span>Store Settings</span>
          </button>

        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 space-y-6">
        
        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-900 shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-semibold">Total Items Listed</p>
              <p className="text-xl sm:text-2xl font-extrabold text-stone-900">{products.length}</p>
              <p className="text-[11px] text-emerald-700 font-bold">{inStockCount} In Stock</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <Layers size={24} />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-semibold">Fashion Categories</p>
              <p className="text-xl sm:text-2xl font-extrabold text-stone-900">{categories.length}</p>
              <p className="text-[11px] text-stone-400">All Women Collections</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-semibold">Total Orders Placed</p>
              <p className="text-xl sm:text-2xl font-extrabold text-stone-900">{orders.length}</p>
              <p className="text-[11px] text-emerald-700 font-bold">₹{totalRevenue.toLocaleString('en-IN')} Revenue</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 shrink-0">
              <Percent size={24} />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-semibold">Active Coupons</p>
              <p className="text-xl sm:text-2xl font-extrabold text-stone-900">
                {coupons.filter(c => c.isActive).length} Active
              </p>
              <p className="text-[11px] text-emerald-700 font-bold">{coupons.length} Total Coupons</p>
            </div>
          </div>
        </div>

        {/* TAB 1: ALL WOMEN FASHION PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Product Catalog Management ({products.length} Items)
                </h2>
                <p className="text-xs text-stone-500">
                  Add new items, upload photos, edit prices & offers, manage sizes & stock
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                {/* Search */}
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-700 focus:outline-none focus:border-brand-700 w-full sm:w-44"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                </div>

                {/* Filter Category */}
                <select
                  value={filterCategoryInTable}
                  onChange={(e) => setFilterCategoryInTable(e.target.value)}
                  className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:border-brand-700"
                >
                  <option value="All">Filter: All ({products.length})</option>
                  {categories.map(c => {
                    const name = typeof c === 'string' ? c : c.name;
                    const count = products.filter(p => p.category === name).length;
                    return (
                      <option key={name} value={name}>
                        {name} ({count})
                      </option>
                    );
                  })}
                </select>

                {/* ADD NEW PRODUCT BUTTON */}
                <button
                  onClick={() => handleOpenEditProduct(null)}
                  className="px-5 py-2.5 royal-maroon-bg text-gold-100 font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus size={16} />
                  <span>Add New Item</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Photo</th>
                      <th className="p-3.5">Item Name & Fabric</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price (₹)</th>
                      <th className="p-3.5">MRP (₹)</th>
                      <th className="p-3.5">Offer / Tag</th>
                      <th className="p-3.5">Sizes</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {tableProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-stone-400">
                          No products found. Click <strong>"Add New Item"</strong> to list your first item!
                        </td>
                      </tr>
                    ) : (
                      tableProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-3.5">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-14 h-16 object-cover object-top rounded-xl border border-stone-200 shadow-sm"
                            />
                          </td>
                          <td className="p-3.5 max-w-[220px]">
                            <p className="font-bold text-stone-900 text-sm line-clamp-1">{p.name}</p>
                            <p className="text-[11px] text-stone-400 line-clamp-1">{p.fabric}</p>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-stone-100 text-stone-800 px-2.5 py-1 rounded-md font-semibold text-xs whitespace-nowrap">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-3.5 font-extrabold text-brand-950 text-base">
                            ₹{p.price.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-stone-400 line-through">
                            ₹{p.originalPrice?.toLocaleString('en-IN') || '-'}
                          </td>
                          <td className="p-3.5 max-w-[160px]">
                            {p.offer ? (
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md line-clamp-1 border border-amber-300">
                                ⚡ {p.offer}
                              </span>
                            ) : p.badge ? (
                              <span className="bg-brand-900 text-gold-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {p.badge}
                              </span>
                            ) : (
                              <span className="text-stone-300">-</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex gap-1 flex-wrap max-w-[120px]">
                              {(p.sizes || []).map(sz => (
                                <span key={sz} className="text-[10px] font-bold bg-gold-100 text-gold-900 px-1.5 py-0.5 rounded">
                                  {sz}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              p.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer"
                              title="Edit Photo, Price & Offer"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200 cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES MANAGER */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Women's Fashion Categories ({categories.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Add custom categories with photos, offers, and icons, or edit & delete existing categories
                </p>
              </div>

              <button
                onClick={() => handleOpenCategoryModal(null)}
                className="px-5 py-2.5 royal-maroon-bg text-gold-100 font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FolderPlus size={16} />
                <span>Add New Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat, idx) => {
                const catName = typeof cat === 'string' ? cat : cat.name;
                const catIcon = typeof cat === 'string' ? '👗' : (cat.icon || '👗');
                const catDesc = typeof cat === 'string' ? cat : (cat.description || '');
                const catOffer = cat.offer || 'Festive Special';
                const catImage = cat.image || null;
                const count = products.filter(p => p.category === catName).length;

                return (
                  <div
                    key={cat.id || idx}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between gap-4 hover:border-gold-400 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        {catImage ? (
                          <img
                            src={catImage}
                            alt={catName}
                            className="w-12 h-12 rounded-2xl object-cover border border-gold-300 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-2xl shadow-inner shrink-0">
                            {catIcon}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-sm text-stone-900">{catName}</h3>
                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{catDesc || "Women Collection"}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {count} Items
                            </span>
                            {catOffer && (
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                                ⚡ {catOffer}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenCategoryModal(cat)}
                          className="p-2 rounded-lg text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Category Details & Offer"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, catName)}
                          className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: COUPONS & PROMO CODES MANAGER */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Coupons & Discount Promo Codes ({coupons.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Create percentage or flat discount vouchers for boutique shoppers
                </p>
              </div>

              <button
                onClick={() => {
                  setCouponFormData({
                    id: '',
                    code: '',
                    discountType: 'percentage',
                    discountValue: 15,
                    minOrderAmount: 999,
                    description: 'Special seasonal discount',
                    isActive: true
                  });
                  setIsCouponModalOpen(true);
                }}
                className="px-5 py-2.5 royal-maroon-bg text-gold-100 font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={16} />
                <span>Create New Coupon</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className={`p-5 rounded-3xl border transition-all space-y-3 relative overflow-hidden flex flex-col justify-between ${
                    c.isActive 
                      ? 'bg-white border-amber-300 shadow-sm' 
                      : 'bg-stone-100 border-stone-300 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-extrabold tracking-wider bg-gold-100 text-brand-950 px-3 py-1 rounded-xl border border-gold-300">
                        🏷️ {c.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="font-extrabold text-xl text-stone-900">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">{c.description}</p>
                      <p className="text-[11px] text-amber-900 font-semibold mt-1">
                        Min. Order: ₹{c.minOrderAmount ? c.minOrderAmount.toLocaleString('en-IN') : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleCoupon(c.code)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                        c.isActive ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SALES & BUSINESS ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                  <BarChart3 size={22} className="text-brand-900" />
                  <span>Sales & Ecommerce Performance Hub</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Live revenue insights, payment breakdown and catalog performance
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-xs font-bold text-amber-900">Total Sales Value</p>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">↑ 100% Verified Inquiries</p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-900">Average Order Value (AOV)</p>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">₹{avgOrderValue.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-stone-500 mt-1">Per Checkout</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="text-xs font-bold text-blue-900">COD vs Prepaid Ratio</p>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                    {orders.length > 0 ? `${Math.round((codOrders / orders.length) * 100)}% COD` : '0%'}
                  </p>
                  <p className="text-[11px] text-blue-700 font-bold mt-1">{codOrders} COD / {upiOrders} Prepaid</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <p className="text-xs font-bold text-purple-900">Boutique Active Products</p>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">{products.length} Items</p>
                  <p className="text-[11px] text-purple-700 font-bold mt-1">Across {categories.length} Categories</p>
                </div>
              </div>

              {/* Category Sales Distribution */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <h3 className="font-bold text-sm text-stone-900">Category Catalog Density</h3>
                <div className="space-y-2">
                  {categories.slice(0, 6).map(cat => {
                    const cName = typeof cat === 'string' ? cat : cat.name;
                    const count = products.filter(p => p.category === cName).length;
                    const pct = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
                    return (
                      <div key={cName} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-stone-700">
                          <span>{cName}</span>
                          <span>{count} Items ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-900 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PRODUCT ENGAGEMENT & VIEW ANALYTICS SECTION */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                      <MousePointerClick size={20} className="text-brand-900" />
                      <span>Product View, Open & Engagement Analytics</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Live tracking of which products users are viewing, opening in QuickView, adding to cart and converting to orders.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefreshAnalytics}
                      disabled={analyticsLoading}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60"
                      title="Sync from Cloud & Refresh Analytics"
                    >
                      <RotateCcw size={13} className={analyticsLoading ? 'animate-spin' : ''} />
                      <span>{analyticsLoading ? 'Syncing...' : 'Sync & Refresh'}</span>
                    </button>

                    <button
                      onClick={handleResetAnalytics}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Reset All Tracked Analytics"
                    >
                      <Trash2 size={13} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Search & Sorting Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search product by title or category..."
                      value={productAnalyticsSearch}
                      onChange={(e) => setProductAnalyticsSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-700"
                    />
                    <Search size={15} className="absolute left-3 top-2.5 text-stone-400" />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-stone-600">Sort:</span>
                    <select
                      value={productAnalyticsSort}
                      onChange={(e) => setProductAnalyticsSort(e.target.value)}
                      className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:border-brand-700 cursor-pointer"
                    >
                      <option value="views">Most Viewed (👁️ Views)</option>
                      <option value="quickViews">QuickView Opens (🔍 Lightbox)</option>
                      <option value="cartAdds">Cart Additions (🛒 Bag Adds)</option>
                      <option value="orders">Orders Placed (📦 Orders)</option>
                      <option value="conversionRate">Conversion Rate % (📈 High to Low)</option>
                    </select>
                  </div>
                </div>

                {/* Analytics Table */}
                <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-xs bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100/80 text-stone-700 font-extrabold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Rank & Product Name</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Price</th>
                        <th className="py-3 px-3 text-center">👁️ Views</th>
                        <th className="py-3 px-3 text-center">🔍 Quick View</th>
                        <th className="py-3 px-3 text-center">🛒 Cart Adds</th>
                        <th className="py-3 px-3 text-center">📦 Orders</th>
                        <th className="py-3 px-4 text-center">📈 Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {sortedAnalyticsProducts.map((p, index) => (
                        <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                index === 0 ? 'bg-gold-400 text-stone-950 shadow-xs' :
                                index === 1 ? 'bg-stone-300 text-stone-800' :
                                index === 2 ? 'bg-amber-200 text-amber-900' :
                                'bg-stone-100 text-stone-600'
                              }`}>
                                #{index + 1}
                              </span>
                              <div className="w-10 h-13 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                <img src={normalizeImageUrl(p.image)} alt="" className="w-full h-full object-cover object-top" />
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <p className="font-bold text-stone-900 truncate">{p.name}</p>
                                <p className="text-[10px] text-stone-400 font-mono">ID: {p.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md font-bold text-[10px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-stone-900">
                            ₹{p.price?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-center font-extrabold text-brand-950">
                            {p.views || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-stone-700">
                            {p.quickViews || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-700">
                            {p.cartAdds || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-extrabold text-emerald-700">
                            {p.orders || 0}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                              p.conversionRate > 5 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : p.conversionRate > 0 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-stone-100 text-stone-500'
                            }`}>
                              {p.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: OFFICIAL TAX INVOICES & BILLS */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            
            {/* Invoice Top Callout */}
            <div className="bg-gradient-to-r from-stone-900 via-brand-950 to-stone-900 text-white p-6 sm:p-8 rounded-3xl border border-gold-400/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase tracking-wider">
                  <Receipt size={14} />
                  <span>Amazon & Flipkart Official Bill Format</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-white">
                  Official Tax Invoice & Bill Generator
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                  Generate official retail tax invoices with authentic random handwritten signatures, official boutique stamp seal, amount in words, download as PNG image/photo, print standard A4 PDF, or send directly on WhatsApp.
                </p>
              </div>

              {/* CREATE BILL BUTTON */}
              <button
                onClick={() => handleOpenInvoice(null)}
                className="px-6 py-3.5 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-brand-950 font-extrabold text-sm rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <Plus size={18} />
                <span>Create Custom / Blank Bill</span>
              </button>
            </div>

            {/* Orders Search & Invoice Selection List */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    Select Customer Order to Generate Official Invoice
                  </h3>
                  <p className="text-xs text-stone-500">
                    Auto-populates customer name, mobile, delivery address, ordered kurtis/clothes, sizes & pricing
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Search Order ID, Customer Name, Phone..."
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-700"
                  />
                  <Search size={16} className="absolute left-3 top-3 text-stone-400" />
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-3">
                  <Receipt size={40} className="mx-auto text-stone-400" />
                  <p className="font-bold text-stone-700 text-base">No Customer Orders in System Yet</p>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    When customers place orders via WhatsApp on the website, they will appear here. You can also click <strong>"Create Custom / Blank Bill"</strong> above to generate a bill right now!
                  </p>
                </div>
              ) : filteredInvoiceOrders.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-xs">
                  No orders match search "{invoiceSearchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInvoiceOrders.map((ord) => (
                    <div 
                      key={ord.id}
                      className="bg-[#faf7f2] p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-gold-400 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-white text-stone-800 px-2.5 py-1 rounded-md border border-stone-200">
                              {ord.id}
                            </span>
                            <span className="text-xs text-stone-500">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <h4 className="font-bold text-stone-900 text-base mt-2">{ord.customer?.name}</h4>
                          <p className="text-xs text-stone-600">📞 {ord.customer?.phone} • 📍 {ord.customer?.city || 'India'}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-brand-950 bg-gold-200 px-3 py-1 rounded-full">
                            ₹{ord.totalAmount?.toLocaleString('en-IN')}
                          </span>
                          <p className="text-[11px] text-stone-500 mt-1">{ord.customer?.paymentMethod}</p>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs space-y-1">
                        <p className="font-bold text-stone-700 text-[11px]">Ordered Items ({ord.items?.reduce((a, c) => a + c.quantity, 0)}):</p>
                        {ord.items?.slice(0, 2).map((it, idx) => (
                          <p key={idx} className="text-stone-600 text-xs truncate">
                            • {it.name} (Size: {it.selectedSize}) x{it.quantity} - ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                          </p>
                        ))}
                        {ord.items?.length > 2 && (
                          <p className="text-[11px] text-stone-400 font-semibold">+ {ord.items.length - 2} more item(s)</p>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => handleOpenInvoice(ord)}
                        className="w-full py-3 bg-gradient-to-r from-stone-900 to-brand-950 hover:from-brand-950 hover:to-brand-900 text-gold-200 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <Receipt size={16} className="text-gold-400" />
                        <span>🧾 Generate & Print Official Tax Invoice</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 6: CUSTOMER ORDERS LOG */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Customer WhatsApp Orders & Inquiries
                </h2>
                <p className="text-xs text-stone-500">
                  All customer checkout records with 1-click Invoice generation
                </p>
              </div>
              <span className="text-xs font-bold bg-gold-100 text-gold-900 px-3 py-1 rounded-full">
                Total {orders.length} Inquiries
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-stone-200">
                <ShoppingBag size={36} className="mx-auto text-stone-300 mb-2" />
                <p className="font-serif text-base font-bold text-stone-700">No Orders Placed Yet</p>
                <p className="text-xs text-stone-400 mt-1">
                  When customers checkout on the website, their order records will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between border-b border-stone-100 pb-2">
                        <div>
                          <p className="font-bold text-base text-stone-900">{ord.customer?.name || 'Customer'}</p>
                          <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                            <Phone size={12} /> {ord.customer?.phone}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                          ₹{ord.totalAmount?.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600 space-y-1 mt-2.5">
                        <p><strong>Delivery Address:</strong> {ord.customer?.address}, {ord.customer?.city} ({ord.customer?.pincode})</p>
                        <p><strong>Payment Preference:</strong> {ord.customer?.paymentMethod}</p>
                        <p className="text-[11px] text-stone-400">Date: {new Date(ord.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="bg-stone-50 p-3 rounded-xl text-xs space-y-1.5 mt-2.5">
                        <p className="font-bold text-stone-700">Items Ordered:</p>
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-stone-600">
                            <span>• {it.name} (Size: {it.selectedSize}) x{it.quantity}</span>
                            <span className="font-bold">₹{(it.price * it.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenInvoice(ord)}
                      className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Receipt size={14} className="text-amber-700" />
                      <span>Generate & Print Bill</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: CUSTOMER LEADS & DELIVERY DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Top Leads Header Banner */}
            <div className="bg-gradient-to-r from-stone-900 via-brand-950 to-stone-900 text-white p-6 sm:p-7 rounded-3xl border border-gold-400/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase tracking-wider">
                  <Users size={14} />
                  <span>Customer CRM & Delivery Database</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-white">
                  Customer Leads & Delivery Address Directory ({customers.length})
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                  Permanent records of all customer names, phone numbers, delivery addresses, and order history captured during checkout.
                </p>
              </div>

              <button
                onClick={exportCustomersToCSV}
                disabled={customers.length === 0}
                className="px-5 py-3 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-brand-950 font-extrabold text-xs rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                <span>Export Customer Leads (CSV)</span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by customer name, mobile number, city, pincode, address..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-700"
                />
                <Search size={16} className="absolute left-3 top-3 text-stone-400" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600 shrink-0">Filter:</span>
                <select
                  value={selectedCustomerFilter}
                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  className="px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:border-brand-700 cursor-pointer"
                >
                  <option value="All">All Customer Leads</option>
                  <option value="Repeat">Repeat Buyers (2+ Orders)</option>
                  <option value="COD">Cash On Delivery (COD)</option>
                  <option value="Prepaid">Prepaid / UPI</option>
                </select>
              </div>
            </div>

            {/* Customer Cards Grid */}
            {filteredCustomers.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 shadow-sm">
                <Users size={36} className="mx-auto text-stone-300 mb-2" />
                <p className="font-serif text-base font-bold text-stone-700">No Customer Leads Found</p>
                <p className="text-xs text-stone-400 mt-1">
                  When customers fill their delivery details in checkout, their full address and contact info will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map(cust => (
                  <div key={cust.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-amber-400 transition-colors">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 text-brand-950 font-bold flex items-center justify-center text-sm shrink-0">
                            {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-stone-900 truncate">{cust.name || 'Anonymous Customer'}</h4>
                            <p className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                              <Phone size={11} className="text-stone-400" />
                              <span>{cust.phone || 'No phone'}</span>
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                          cust.totalOrders > 1 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {cust.totalOrders > 1 ? `★ ${cust.totalOrders} Orders` : '1st Order'}
                        </span>
                      </div>

                      {/* Delivery Address Box */}
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5 text-xs text-stone-700">
                        <p className="font-bold text-stone-900 flex items-center gap-1 text-[11px]">
                          <span>📍 Delivery Address:</span>
                        </p>
                        <p className="text-xs text-stone-800 font-medium leading-relaxed">
                          {cust.address || 'Address not provided'}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1 border-t border-stone-200">
                          <span><strong>City:</strong> {cust.city || 'Jaipur'}</span>
                          <span><strong>Pincode:</strong> {cust.pincode || '302002'}</span>
                        </div>
                      </div>

                      {/* Payment & Order Summary */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-stone-500 text-[11px]">Preferred Mode: <strong>{cust.preferredPayment || 'COD'}</strong></span>
                        <span className="font-black text-brand-950 text-xs">Total: ₹{cust.totalSpent?.toLocaleString('en-IN') || 0}</span>
                      </div>
                    </div>

                    {/* Actions: 1-Click WhatsApp, Call & Delete */}
                    <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                      <a
                        href={`https://wa.me/91${String(cust.phone || '').replace(/[^\d]/g, '')}?text=Hello%20${encodeURIComponent(cust.name || 'Customer')},%20greetings%20from%20${encodeURIComponent(settings.storeName || 'Radhika Kurti Collection')}!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                        title="Open WhatsApp Chat with Customer"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>

                      {cust.phone && (
                        <a
                          href={`tel:${cust.phone}`}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                          title="Direct Call Customer"
                        >
                          <Phone size={13} />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteCustomer(cust.id)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Customer Lead"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: CUSTOMER REVIEWS & RATINGS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Buyer Reviews & Testimonials ({reviews.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Showcase genuine customer feedback on your boutique storefront
                </p>
              </div>

              <button
                onClick={() => {
                  setReviewFormData({
                    id: '',
                    name: '',
                    city: 'Jaipur, Rajasthan',
                    rating: 5,
                    date: 'Today',
                    productName: products[0]?.name || 'Anarkali Kurti Set',
                    comment: '',
                    verifiedBuyer: true
                  });
                  setIsReviewModalOpen(true);
                }}
                className="px-5 py-2.5 royal-maroon-bg text-gold-100 font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={16} />
                <span>Add New Testimonial</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex text-amber-500 gap-0.5">
                        {[...Array(r.rating || 5)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>

                    <p className="text-xs text-stone-700 italic">"{r.comment}"</p>
                    <p className="text-[11px] text-brand-900 font-bold">Item: {r.productName}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-stone-900">{r.name}</p>
                      <p className="text-[10px] text-stone-400">{r.city} • {r.date}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: BULK DATA EXPORT */}
        {activeTab === 'export' && (
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                <FileSpreadsheet size={22} className="text-emerald-700" />
                <span>Bulk Data Backup & CSV Export</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Download your complete store catalog and orders history for Excel, Tally, or accounting software.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Products Catalog Backup</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Export all {products.length} products with prices, MRP, categories, fabric details and stock.
                  </p>
                </div>
                <button
                  onClick={handleExportProductsCSV}
                  className="w-full py-2.5 royal-maroon-bg text-gold-100 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download size={14} />
                  <span>Download Products CSV</span>
                </button>
              </div>

              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Customer Orders Report</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Export all {orders.length} order inquiries with customer name, phone, address, and total amounts.
                  </p>
                </div>
                <button
                  onClick={handleExportOrdersCSV}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download size={14} />
                  <span>Download Orders CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: COMPANY & STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                <Building2 size={22} className="text-amber-700" />
                <span>Company Billing & Store Settings</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Configure your company name, GSTIN, billing address, and WhatsApp contact for official Tax Invoices.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              
              {/* Company Details on Bill */}
              <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  Official Company Details on Bill / Invoice
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Company Name (Printed on Bill)
                    </label>
                    <input
                      type="text"
                      required
                      value={storeSettings.storeName}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      GSTIN / Tax Registration No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 08AABCA1234F1Z9"
                      value={storeSettings.companyGst || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, companyGst: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Company Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot No. 42, Hawa Mahal Road, Badi Chaupar"
                    value={storeSettings.companyAddress || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, companyAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      City & State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jaipur, Rajasthan"
                      value={storeSettings.companyCity || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, companyCity: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 302002"
                      value={storeSettings.companyPincode || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, companyPincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Invoice Prefix (e.g. AURA/2026/)
                    </label>
                    <input
                      type="text"
                      value={storeSettings.invoicePrefix || 'AURA/2026/'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, invoicePrefix: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Billing Support Email
                    </label>
                    <input
                      type="email"
                      value={storeSettings.supportEmail || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, supportEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ORDER & SUPPORT REDIRECTION CHANNEL SELECTOR */}
              <div className="p-5 bg-gradient-to-br from-amber-50/90 via-stone-50 to-sky-50/70 border border-amber-300/80 rounded-3xl space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-brand-950 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-700" />
                      <span>Primary Order & Customer Redirection Channel</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 border border-amber-300">
                      Anti-Spam / High-Volume Routing
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Choose where customer inquiries, cart orders, and 1-click buy buttons redirect. Use <strong>Telegram</strong> if sending bulk traffic to avoid WhatsApp temporary number restriction.
                  </p>
                </div>

                {/* 3 Interactive Channel Choice Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* WhatsApp Option */}
                  <div
                    onClick={() => setStoreSettings({ ...storeSettings, orderChannel: 'whatsapp' })}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      (storeSettings.orderChannel || 'whatsapp') === 'whatsapp'
                        ? 'bg-emerald-50/90 border-emerald-600 shadow-md scale-[1.02]'
                        : 'bg-white border-stone-200 hover:border-emerald-300 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageCircle size={18} />
                      </div>
                      {(storeSettings.orderChannel || 'whatsapp') === 'whatsapp' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-extrabold text-stone-900">WhatsApp Only</h4>
                    <p className="text-[10px] text-stone-500 mt-0.5">Direct chat & checkout to WhatsApp number</p>
                  </div>

                  {/* Telegram Option */}
                  <div
                    onClick={() => setStoreSettings({ ...storeSettings, orderChannel: 'telegram' })}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      storeSettings.orderChannel === 'telegram'
                        ? 'bg-sky-50/90 border-sky-600 shadow-md scale-[1.02]'
                        : 'bg-white border-stone-200 hover:border-sky-300 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                        <Send size={16} />
                      </div>
                      {storeSettings.orderChannel === 'telegram' && (
                        <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-extrabold text-stone-900">Telegram Only</h4>
                    <p className="text-[10px] text-stone-500 mt-0.5">High volume safe • No WhatsApp ban risk</p>
                  </div>

                  {/* Dual Mode Option */}
                  <div
                    onClick={() => setStoreSettings({ ...storeSettings, orderChannel: 'both' })}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      storeSettings.orderChannel === 'both'
                        ? 'bg-amber-50/90 border-amber-600 shadow-md scale-[1.02]'
                        : 'bg-white border-stone-200 hover:border-amber-300 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs z-10">
                          <MessageCircle size={14} />
                        </div>
                        <div className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                          <Send size={13} />
                        </div>
                      </div>
                      {storeSettings.orderChannel === 'both' && (
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-extrabold text-stone-900">Dual Mode</h4>
                    <p className="text-[10px] text-stone-500 mt-0.5">Customer picks WhatsApp or Telegram</p>
                  </div>

                </div>

                {/* Input Fields for WhatsApp and Telegram */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  
                  {/* WhatsApp Number Input */}
                  <div className="p-3.5 bg-white border border-emerald-300 rounded-2xl space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone size={14} className="text-emerald-700" />
                      <span>WhatsApp Receiver Number</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +919876543210"
                      value={storeSettings.whatsappNumber || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                    <p className="text-[10px] text-stone-500">Include country code with +91 or digits</p>
                  </div>

                  {/* Telegram Username Input */}
                  <div className="p-3.5 bg-white border border-sky-300 rounded-2xl space-y-1.5 shadow-xs">
                    <label className="block text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Send size={14} className="text-sky-600" />
                      <span>Telegram Channel / Username</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. @shaguncollection or shaguncollection"
                      value={storeSettings.telegramUsername || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, telegramUsername: e.target.value })}
                      className="w-full px-3 py-2 bg-sky-50/40 border border-sky-200 rounded-xl text-xs font-bold text-sky-950 focus:outline-none focus:border-sky-600 font-mono"
                    />
                    <p className="text-[10px] text-stone-500">Customer will be redirected to https://t.me/your_handle</p>
                  </div>

                </div>

              </div>

              {/* ⚡ 15-MINUTE CART COUNTDOWN FLASH DISCOUNT SETTINGS */}
              <div className="p-5 bg-gradient-to-br from-amber-50/90 via-rose-50/40 to-amber-50/80 border-2 border-amber-300 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center shadow-xs">
                      <Flame size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                        <span>15-Minute Cart Countdown Rush Discount</span>
                        <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                          High Conversion
                        </span>
                      </h3>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Increases sales velocity by displaying an urgent live timer discount when customer opens their Shopping Bag.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch Button */}
                  <button
                    type="button"
                    onClick={() => setStoreSettings({ 
                      ...storeSettings, 
                      timerDiscountEnabled: storeSettings.timerDiscountEnabled === false ? true : false 
                    })}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      storeSettings.timerDiscountEnabled !== false
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {storeSettings.timerDiscountEnabled !== false ? (
                      <>
                        <ToggleRight size={18} />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={18} />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                {storeSettings.timerDiscountEnabled !== false && (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      {/* Timer Duration in Minutes */}
                      <div className="p-3.5 bg-white border border-amber-200 rounded-2xl space-y-1 shadow-xs">
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                          <Clock size={13} className="text-amber-700" />
                          <span>Timer Duration</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="180"
                            required
                            value={storeSettings.timerMinutes ?? 15}
                            onChange={(e) => setStoreSettings({ ...storeSettings, timerMinutes: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-amber-50/30 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                          />
                          <span className="text-xs font-bold text-stone-500 shrink-0">Mins</span>
                        </div>
                        <p className="text-[10px] text-stone-500">Default: 15 minutes rush countdown</p>
                      </div>

                      {/* Discount Type */}
                      <div className="p-3.5 bg-white border border-amber-200 rounded-2xl space-y-1 shadow-xs">
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                          <Percent size={13} className="text-amber-700" />
                          <span>Discount Type</span>
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setStoreSettings({ ...storeSettings, timerDiscountType: 'percentage' })}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                              (storeSettings.timerDiscountType || 'percentage') === 'percentage'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            % Off
                          </button>
                          <button
                            type="button"
                            onClick={() => setStoreSettings({ ...storeSettings, timerDiscountType: 'fixed' })}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                              storeSettings.timerDiscountType === 'fixed'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            Flat ₹ Off
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-500">Percentage % or Flat ₹ cash discount</p>
                      </div>

                      {/* Discount Value */}
                      <div className="p-3.5 bg-white border border-amber-200 rounded-2xl space-y-1 shadow-xs">
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                          <Tag size={13} className="text-amber-700" />
                          <span>Discount Amount</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={storeSettings.timerDiscountValue ?? 10}
                            onChange={(e) => setStoreSettings({ ...storeSettings, timerDiscountValue: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-amber-50/30 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                          />
                          <span className="text-xs font-bold text-stone-500 shrink-0">
                            {(storeSettings.timerDiscountType || 'percentage') === 'percentage' ? '%' : '₹'}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500">e.g. 10 for 10% or 200 for ₹200 OFF</p>
                      </div>

                    </div>

                    {/* Custom Offer Headline */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Offer Headline Text (Displayed in Cart Drawer)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ⚡ FLASH SALE: Complete your order in under 15 minutes to unlock EXTRA discount!"
                        value={storeSettings.timerOfferHeading || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, timerOfferHeading: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    {/* Live Customer Cart Banner Preview */}
                    <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200 space-y-1.5 shadow-xs">
                      <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                        👀 Customer Cart Live Preview:
                      </p>
                      <div className="p-3 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-300/90 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center text-xs">
                            <Flame size={14} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-black text-amber-950 uppercase">⚡ {storeSettings.timerMinutes || 15}-Min Rush Deal!</span>
                              <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                                {(storeSettings.timerDiscountType || 'percentage') === 'percentage' ? `${storeSettings.timerDiscountValue ?? 10}% OFF` : `₹${storeSettings.timerDiscountValue ?? 10} OFF`}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-600 line-clamp-1">
                              {storeSettings.timerOfferHeading || `Order in under ${storeSettings.timerMinutes || 15} mins to save on your shopping bag!`}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-black text-brand-950 bg-white border border-amber-300 px-2 py-1 rounded-lg shrink-0 shadow-xs">
                          {String(storeSettings.timerMinutes || 15).padStart(2, '0')}:00
                        </span>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Announcement Bar Text */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Top Announcement Bar Text
                </label>
                <input
                  type="text"
                  value={storeSettings.announcementText}
                  onChange={(e) => setStoreSettings({ ...storeSettings, announcementText: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brand-700"
                />
              </div>

              {/* Invoice Terms */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Invoice Terms & Conditions (Printed at Bottom of Bill)
                </label>
                <textarea
                  rows={3}
                  value={storeSettings.invoiceTerms || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, invoiceTerms: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 royal-maroon-bg text-gold-100 font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check size={16} />
                  <span>Save All Settings</span>
                </button>
              </div>
            </form>

            {/* ☁️ SUPABASE CLOUD DATABASE REAL-TIME SYNC */}
            <div className="p-6 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white rounded-3xl border border-gold-500/40 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg">
                    <Database size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-sm sm:text-base font-bold text-gold-200">
                        Supabase Cloud Database
                      </h3>
                      {isSupabaseConfigured() ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Configured & Active
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Not Connected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Sync products, categories, coupons & orders live across all devices, mobile phones & Vercel.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSqlModal(true)}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-gold-300 text-xs font-bold rounded-xl border border-stone-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-all"
                >
                  <Copy size={13} />
                  <span>Get SQL Table Setup</span>
                </button>
              </div>

              {/* Status Message */}
              {supabaseStatus && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                  supabaseStatus.success
                    ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-600/50 text-rose-200'
                }`}>
                  <span>{supabaseStatus.success ? '✅' : '⚠️'}</span>
                  <span>{supabaseStatus.message}</span>
                </div>
              )}

              {/* Form for Project URL & Anon Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzabcdefg.supabase.co"
                    value={supabaseConfig.url}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-800/90 border border-stone-700 text-white rounded-xl text-xs font-mono focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Supabase Anon / Public API Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseConfig.anonKey}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-800/90 border border-stone-700 text-white rounded-xl text-xs font-mono focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAndTestSupabase}
                  disabled={isTestingSupabase || !supabaseConfig.url || !supabaseConfig.anonKey}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <CheckCircle size={14} />
                  <span>{isTestingSupabase ? 'Testing Connection...' : 'Save & Test Cloud DB'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushAllToCloud}
                  disabled={isPushingCloud || !isSupabaseConfigured()}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#700b1d] to-[#4a040e] hover:from-[#850e24] hover:to-[#540614] disabled:opacity-50 text-gold-200 border border-gold-400/40 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Cloud size={14} />
                  <span>{isPushingCloud ? 'Uploading Products...' : '⚡ Push All Store Data to Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullFromCloud}
                  disabled={isPullingCloud || !isSupabaseConfigured()}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 font-bold text-xs rounded-xl border border-stone-700 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RotateCcw size={13} className={isPullingCloud ? "animate-spin" : ""} />
                  <span>{isPullingCloud ? 'Syncing...' : '🔄 Pull from Cloud'}</span>
                </button>
              </div>

              <div className="text-[11px] text-stone-400 pt-1 flex items-center gap-1.5">
                <span>💡</span>
                <span>
                  Tip: Jab aap yaha credentials save karte hain, to Admin me kiya gaya koi bhi change Supabase Cloud me save hota hai aur live website par sabhi customers ko dikhta hai!
                </span>
              </div>
            </div>

            {/* 1-CLICK LIVE SYNC & DATA BACKUP / RESTORE */}
            <div className="p-6 bg-gradient-to-br from-amber-50 via-white to-gold-50/70 border border-amber-300 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
                    <Download size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-stone-900">
                      Sync & Transfer Store Data (Localhost ↔ Live Vercel)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Export all products, categories, settings & coupons into a JSON backup, or import to update live instant.
                    </p>
                  </div>
                </div>
              </div>

              {importStatusMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <span>{importStatusMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* 1. Export JSON */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-2">
                  <span className="text-xs font-bold text-stone-900 block">Step 1: Export Current Store State</span>
                  <p className="text-[11px] text-stone-500">
                    Download backup or copy full JSON with all your custom changes.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportFullStoreJSON}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download size={14} />
                    <span>Copy JSON & Download Backup</span>
                  </button>
                </div>

                {/* 2. Import JSON */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-2">
                  <span className="text-xs font-bold text-stone-900 block">Step 2: Import & Apply JSON</span>
                  <input
                    type="text"
                    placeholder="Paste exported JSON here..."
                    value={importJsonInput}
                    onChange={(e) => setImportJsonInput(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleImportFullStoreJSON}
                    disabled={!importJsonInput.trim()}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Check size={14} />
                    <span>Import & Apply to Store</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB: LUCKY DRAW & CONTEST STUDIO */}
        {activeTab === 'luckydraw' && (
          <div className="space-y-6">
            
            {/* 1. Header Studio Bar */}
            <div className="bg-gradient-to-r from-[#540614] via-[#700b1d] to-[#3b030c] text-gold-100 p-5 sm:p-6 rounded-3xl border border-gold-400/50 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-gold-400/20 text-gold-200 border border-gold-400/50 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Gift size={13} className="text-gold-300" />
                    Boutique Giveaway Engine
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                    luckyDrawConfig?.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                      : 'bg-stone-700/60 text-stone-300 border border-stone-600'
                  }`}>
                    {luckyDrawConfig?.isActive ? '🟢 Campaign Live on Store' : '🔴 Campaign Paused'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-gold-300 border border-gold-400/40 flex items-center gap-1">
                    ⚡ Supabase Cloud Synced
                  </span>
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-gold-100 tracking-wide">
                  {luckyDrawConfig?.title || "Festive Mega Royal Lucky Draw"}
                </h2>
                <p className="text-xs text-gold-200/80 max-w-2xl font-light">
                  Rule: Customers must order a minimum of <strong className="text-gold-300 font-bold">{luckyDrawConfig?.minProductsRequired || 3} Products</strong> to qualify. Har update Supabase cloud par live sync hota hai!
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                <button
                  type="button"
                  onClick={handleSyncDrawFromCloud}
                  disabled={isDrawSyncing}
                  className="px-3 py-2.5 bg-stone-900/80 hover:bg-stone-800 text-gold-200 border border-gold-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all disabled:opacity-50"
                  title="Sync latest configuration from Supabase Cloud"
                >
                  <RotateCcw size={13} className={isDrawSyncing ? 'animate-spin' : ''} />
                  <span>{isDrawSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleLuckyDrawActive}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
                    luckyDrawConfig?.isActive
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {luckyDrawConfig?.isActive ? '⏸ Pause Campaign' : '▶ Activate Campaign'}
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddPrize}
                  className="px-4 py-2.5 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-brand-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Plus size={15} />
                  <span>+ Add Custom Prize</span>
                </button>

                <button
                  type="button"
                  onClick={handlePickRandomWinner}
                  disabled={isPickingWinner || luckyDrawUsers.length === 0}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Dice5 size={16} className={isPickingWinner ? 'animate-spin' : ''} />
                  <span>{isPickingWinner ? '🎲 Rolling Draw...' : '🎲 Random Pick Winner'}</span>
                </button>
              </div>
            </div>

            {/* 2. Winner Announcement Banner (If Declared) */}
            {luckyDrawConfig.winner && (
              <div className="bg-gradient-to-br from-amber-100 via-gold-50 to-amber-200 p-5 sm:p-6 rounded-3xl border-2 border-gold-400 shadow-xl space-y-4 animate-fadeIn relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-gold-400/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#700b1d] text-gold-300 flex items-center justify-center shrink-0 shadow-md">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-widest bg-gold-200 px-2.5 py-0.5 rounded-full border border-gold-300">
                        🏆 Lucky Draw Winner Declared
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-950 mt-0.5">
                        {luckyDrawConfig.winner.name} — Golden Ticket #{luckyDrawConfig.winner.ticketNumber}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearWinner}
                    className="px-3.5 py-1.5 bg-white/80 hover:bg-white text-stone-700 hover:text-rose-700 border border-stone-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    🔄 Re-roll / Reset Winner
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/90 p-4 rounded-2xl border border-amber-200 text-xs">
                  <div>
                    <span className="text-stone-500 text-[11px] block">Customer Contact</span>
                    <strong className="text-stone-900 font-bold">{luckyDrawConfig.winner.phone}</strong>
                    <span className="text-[10px] text-stone-500 block">{luckyDrawConfig.winner.city || 'Jaipur'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[11px] block">Prize Awarded</span>
                    <strong className="text-brand-900 font-bold">{luckyDrawConfig.winner.prizeTitle}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[11px] block">Declared On</span>
                    <strong className="text-stone-900 font-bold">{luckyDrawConfig.winner.declaredAt || 'Today'}</strong>
                  </div>
                  <div className="flex items-center justify-start sm:justify-end">
                    <a
                      href={`https://wa.me/91${luckyDrawConfig.winner.phone}?text=${encodeURIComponent(
                        `Namaste ${luckyDrawConfig.winner.name} ji! 🌸\n\nHeartiest Congratulations! You have WON the *Radhika Kurti Collection Mega Lucky Draw* (Ticket #${luckyDrawConfig.winner.ticketNumber})!\n\nYour Prize: *${luckyDrawConfig.winner.prizeTitle}* 🎁\n\nPlease confirm your delivery address to dispatch your prize!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <MessageCircle size={15} />
                      <span>Message on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Rolling Lottery Animation Modal */}
            {isPickingWinner && rollingCandidate && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-gradient-to-b from-[#700b1d] to-[#3a040e] text-gold-100 p-8 rounded-3xl border-2 border-gold-400 max-w-md w-full text-center space-y-4 shadow-2xl animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-gold-400/20 border border-gold-400 flex items-center justify-center mx-auto text-gold-300">
                    <Dice5 size={32} className="animate-spin" />
                  </div>
                  <h3 className="font-heading text-xl font-bold tracking-widest text-gold-200 uppercase">
                    🎲 Selecting Random Winner...
                  </h3>
                  <div className="bg-stone-950/80 p-4 rounded-2xl border border-gold-500/40">
                    <p className="text-xs text-gold-300 uppercase tracking-widest">Candidate Ticket</p>
                    <p className="text-2xl font-mono font-extrabold text-white mt-1">{rollingCandidate.ticketNumber}</p>
                    <p className="text-sm font-bold text-gold-200 mt-0.5">{rollingCandidate.name} ({rollingCandidate.city || 'Jaipur'})</p>
                  </div>
                  <p className="text-[11px] text-stone-300">Filtering contestants with minimum {luckyDrawConfig.minProductsRequired || 3} orders...</p>
                </div>
              </div>
            )}

            {/* 4. Two Column Grid: Campaign Rules & Custom Prizes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (5 cols): Campaign Settings & Rule Editor */}
              <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                    <Settings size={18} className="text-amber-700" />
                    <span>Contest Rules & Settings</span>
                  </h3>
                  <span className="text-[10px] text-stone-500 font-semibold bg-stone-100 px-2 py-0.5 rounded-md">
                    Storefront Sync
                  </span>
                </div>

                <form onSubmit={handleSaveLuckyDrawCampaign} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Contest Campaign Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={campaignFormData.title}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, title: e.target.value })}
                      placeholder="e.g. Festive Mega Royal Lucky Draw 🎁"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Headline Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      value={campaignFormData.tagline}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, tagline: e.target.value })}
                      placeholder="e.g. Order minimum 3 Boutique Apparel Items to Enter Giveaway!"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-amber-950 uppercase tracking-wider mb-1">
                        Min. Products Required 🛍️
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={campaignFormData.minProductsRequired}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, minProductsRequired: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-amber-50 border-2 border-amber-300 font-extrabold text-amber-950 rounded-xl text-sm"
                      />
                      <span className="text-[10px] text-amber-800 font-semibold mt-0.5 block">
                        Default: 3 items minimum
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Draw Date
                      </label>
                      <input
                        type="date"
                        value={campaignFormData.announcementDate}
                        onChange={(e) => setCampaignFormData({ ...campaignFormData, announcementDate: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Terms & Conditions / Guidelines
                    </label>
                    <textarea
                      rows={3}
                      value={campaignFormData.terms}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, terms: e.target.value })}
                      placeholder="List participant guidelines..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-700 text-[11px]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="activeCheck"
                      checked={campaignFormData.isActive}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-900 cursor-pointer accent-[#700b1d]"
                    />
                    <label htmlFor="activeCheck" className="text-xs font-bold text-stone-800 cursor-pointer">
                      Campaign is Active & Visible in Header
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 royal-maroon-bg hover:opacity-95 text-gold-100 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Check size={16} />
                    <span>Save Campaign Rules</span>
                  </button>
                </form>
              </div>

              {/* Right Column (7 cols): Custom Prizes & Product Catalog */}
              <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                      <Award size={18} className="text-gold-600" />
                      <span>Custom Giveaway Prizes ({luckyDrawConfig.prizes?.length || 0})</span>
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Add any boutique dress, saree, or luxury gift product of your choice
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddPrize}
                    className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Prize</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(luckyDrawConfig.prizes || []).map((prize, idx) => (
                    <div
                      key={prize.id || idx}
                      className="bg-[#fdfcf9] rounded-2xl border border-stone-200 p-3.5 flex gap-3 shadow-2xs relative group hover:border-gold-400 transition-all"
                    >
                      <div className="w-16 h-20 rounded-xl overflow-hidden border border-amber-300 bg-stone-100 shrink-0 shadow-xs">
                        <img
                          src={normalizeImageUrl(prize.image)}
                          alt={prize.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Prize #{idx + 1}
                          </span>
                          <span className="text-xs font-extrabold text-brand-900">
                            {prize.worth}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                          {prize.title}
                        </h4>
                        <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">
                          {prize.description}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPrize(prize)}
                            className="text-[11px] text-stone-600 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrize(prize.id, prize.title)}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(!luckyDrawConfig.prizes || luckyDrawConfig.prizes.length === 0) && (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                    <Gift size={32} className="mx-auto text-stone-400 mb-2" />
                    <p className="text-xs font-bold text-stone-700">No prizes configured yet</p>
                    <button
                      type="button"
                      onClick={handleOpenAddPrize}
                      className="mt-2 text-xs font-bold text-amber-800 underline cursor-pointer"
                    >
                      Click here to add your first giveaway prize
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* 5. Registered Customer Accounts & Golden Tickets Directory */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                      <Users size={18} className="text-brand-900" />
                      <span>Registered Contestants & Golden Tickets</span>
                    </h3>
                    <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                      {luckyDrawUsers.length} Registered
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Live accounts created by customers with Mobile Number & Password. Minimum 3 product orders needed for eligibility.
                  </p>
                </div>

                {/* Filter Chips & Search */}
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                  <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDrawEligibilityFilter('All')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        drawEligibilityFilter === 'All' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      All ({luckyDrawUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawEligibilityFilter('Eligible')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        drawEligibilityFilter === 'Eligible' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      ✅ Eligible ({luckyDrawUsers.filter(u => getUserDrawEligibility(u.phone, minRequiredForDraw).isEligible).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawEligibilityFilter('Ineligible')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        drawEligibilityFilter === 'Ineligible' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      ⏳ Incomplete ({luckyDrawUsers.filter(u => !getUserDrawEligibility(u.phone, minRequiredForDraw).isEligible).length})
                    </button>
                  </div>

                  <div className="relative flex-1 md:w-56">
                    <input
                      type="text"
                      placeholder="Search ticket, name, phone..."
                      value={drawSearchQuery}
                      onChange={(e) => setDrawSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-brand-700"
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                  </div>
                </div>
              </div>

              {/* Contestants Table */}
              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 uppercase text-[10px] tracking-wider font-extrabold border-b border-stone-200">
                      <th className="p-3.5">Golden Ticket #</th>
                      <th className="p-3.5">Customer / City</th>
                      <th className="p-3.5">Mobile (Login ID) & Password</th>
                      <th className="p-3.5">Ordered Items ({minRequiredForDraw} Req.)</th>
                      <th className="p-3.5">Eligibility</th>
                      <th className="p-3.5">Registered</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {filteredDrawUsers.map((user) => {
                      const { count, isEligible, remainingToUnlock, ordersCount } = getUserDrawEligibility(user.phone, minRequiredForDraw);
                      const isWinner = luckyDrawConfig.winner?.ticketNumber === user.ticketNumber;

                      return (
                        <tr key={user.id || user.phone} className={`hover:bg-amber-50/40 transition-colors ${isWinner ? 'bg-gold-50/80 font-bold' : ''}`}>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono font-black text-xs px-2.5 py-1 bg-stone-900 text-gold-300 rounded-lg border border-gold-400/40 shadow-2xs">
                              {user.ticketNumber}
                            </span>
                            {isWinner && (
                              <span className="ml-2 text-[10px] text-amber-800 font-extrabold bg-gold-200 px-2 py-0.5 rounded-full">
                                🏆 Winner
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-stone-900 block">{user.name}</span>
                            <span className="text-[10px] text-stone-500">{user.city || 'Jaipur'}</span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-800 font-mono">{user.phone}</span>
                            </div>
                            <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 mt-0.5 inline-block">
                              Key: {user.password || '••••'}
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-stone-900">
                                  {count} / {minRequiredForDraw} Products
                                </span>
                                <span className="text-[10px] text-stone-400">({ordersCount} Orders)</span>
                              </div>
                              <div className="w-28 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isEligible ? 'bg-emerald-600' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (count / minRequiredForDraw) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            {isEligible ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 size={12} />
                                <span>Eligible to Win</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                <span>⏳ Need {remainingToUnlock} more</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 whitespace-nowrap text-stone-500 text-[11px]">
                            {user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                          </td>

                          <td className="p-3.5 whitespace-nowrap text-right space-x-1.5">
                            <a
                              href={`https://wa.me/91${user.phone}?text=${encodeURIComponent(
                                `Namaste ${user.name} ji! 🌸\n\nYour Lucky Draw Ticket Number: *${user.ticketNumber}*\n\nStatus: ${
                                  isEligible
                                    ? '✅ You have ordered ' + count + ' products and are fully ELIGIBLE for the giveaway draw!'
                                    : '⏳ You have ordered ' + count + ' products. Order ' + remainingToUnlock + ' more products to enter the draw!'
                                }\n\nCheck live updates at: Radhika Kurti Collection`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg inline-flex items-center border border-emerald-200 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeclareManualWinner(user, luckyDrawConfig.prizes?.[0]?.title)}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                              title="Pick this user as winner"
                            >
                              🏆 Set Winner
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteContestant(user.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove Contestant"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredDrawUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-stone-500">
                          <Gift size={28} className="mx-auto text-stone-400 mb-1" />
                          <p className="font-bold">No contestant tickets found matching filter.</p>
                          <p className="text-[11px] text-stone-400">Customers who create an account in the Lucky Draw modal on the storefront will appear here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* TAB: SPIN & WIN WHEEL STUDIO */}
        {activeTab === 'spinwheel' && (
          <div className="space-y-6">
            
            {/* 1. Header Studio Bar */}
            <div className="bg-gradient-to-r from-[#540614] via-[#700b1d] to-[#3b030c] text-gold-100 p-5 sm:p-6 rounded-3xl border border-gold-400/50 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-gold-400/20 text-gold-200 border border-gold-400/50 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎡</span>
                    Interactive Fortune Wheel
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                    spinWheelConfig?.isEnabled !== false
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                      : 'bg-stone-700/60 text-stone-300 border border-stone-600'
                  }`}>
                    {spinWheelConfig?.isEnabled !== false ? '🟢 Wheel Active on Store' : '🔴 Wheel Disabled'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-gold-300 border border-gold-400/40 flex items-center gap-1">
                    ⚡ Supabase Cloud Synced
                  </span>
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-gold-100 tracking-wide">
                  {spinWheelConfig?.title || "🎡 Spin the Royal Wheel to Win!"}
                </h2>
                <p className="text-xs text-gold-200/80 max-w-2xl font-light">
                  Website khulte hi user ko spin wheel popup dikhega. Admin custom dresses, sarees, free gifts ya discount coupons upload kar sakta hai. Har change Supabase cloud se live sync hota hai!
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                <button
                  type="button"
                  onClick={handleSyncSpinFromCloud}
                  disabled={isSpinSyncing}
                  className="px-3 py-2.5 bg-stone-900/80 hover:bg-stone-800 text-gold-200 border border-gold-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all disabled:opacity-50"
                  title="Sync latest configuration from Supabase Cloud"
                >
                  <RotateCcw size={13} className={isSpinSyncing ? 'animate-spin' : ''} />
                  <span>{isSpinSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleSpinWheelActive}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
                    spinWheelConfig?.isEnabled !== false
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {spinWheelConfig?.isEnabled !== false ? '⏸ Pause Wheel' : '▶ Activate Wheel'}
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddSlice}
                  className="px-4 py-2.5 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-brand-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Plus size={15} />
                  <span>+ Add Wheel Prize Slice</span>
                </button>
              </div>
            </div>

            {/* 2. Wheel Settings Form */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                  <Settings size={18} className="text-amber-700" />
                  <span>Wheel Display & Auto-Popup Settings</span>
                </h3>
              </div>

              <form onSubmit={handleSaveSpinWheelSettings} className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
                <div className="sm:col-span-5">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Modal Heading Title
                  </label>
                  <input
                    type="text"
                    value={spinWheelConfig.title || ''}
                    onChange={(e) => setSpinWheelConfig({ ...spinWheelConfig, title: e.target.value })}
                    placeholder="e.g. 🎡 Spin the Royal Wheel to Win!"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Auto-Popup on Website Load
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="autoOpenCheck"
                      checked={spinWheelConfig.autoOpenOnVisit !== false}
                      onChange={(e) => setSpinWheelConfig({ ...spinWheelConfig, autoOpenOnVisit: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-900 cursor-pointer accent-[#700b1d]"
                    />
                    <label htmlFor="autoOpenCheck" className="text-xs font-bold text-stone-800 cursor-pointer">
                      Show Wheel automatically when website opens
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check size={16} />
                    <span>Save Wheel Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 3. Wheel Slices & Product Prize Catalog */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                    <Award size={18} className="text-gold-600" />
                    <span>Spin Wheel Slices & Product Catalog ({(spinWheelConfig.slices || []).length} Slices)</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Upload custom products, free apparel gifts, or discount promo coupons for each slice.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddSlice}
                  className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Slice</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(spinWheelConfig.slices || []).map((slice, idx) => (
                  <div
                    key={slice.id || idx}
                    className="bg-[#fdfcf9] rounded-2xl border border-stone-200 p-4 space-y-3 shadow-2xs relative group hover:border-gold-400 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md text-white shadow-2xs" style={{ backgroundColor: slice.color || '#700b1d' }}>
                          Slice #{idx + 1}
                        </span>
                        <span className="text-xs font-black text-brand-950 font-mono">
                          {slice.worth}
                        </span>
                      </div>

                      {slice.image ? (
                        <div className="w-full h-28 rounded-xl overflow-hidden border border-amber-300 bg-stone-100 shadow-xs">
                          <img
                            src={normalizeImageUrl(slice.image)}
                            alt={slice.label}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-16 rounded-xl bg-amber-50/70 border border-dashed border-amber-300 flex items-center justify-center text-stone-400 text-xs font-bold">
                          <span>🎟️ Discount Coupon Slice</span>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                          {slice.label}
                        </h4>
                        <p className="text-[10px] text-stone-500 line-clamp-1">
                          {slice.subtext || slice.type}
                        </p>
                      </div>

                      {slice.couponCode && (
                        <div className="p-1.5 bg-stone-100 rounded-lg text-center font-mono text-[11px] font-extrabold text-stone-800 border border-stone-200">
                          Code: {slice.couponCode}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSlice(slice, idx)}
                        className="text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={12} /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlice(idx, slice.label)}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Live Spin Winners Activity Logs */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                    <PartyPopper size={18} className="text-amber-700" />
                    <span>Recent Spin & Win Activity Records</span>
                  </h3>
                  <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                    {spinWinsHistory.length} Recorded
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 uppercase text-[10px] tracking-wider font-extrabold border-b border-stone-200">
                      <th className="p-3.5">Prize Won</th>
                      <th className="p-3.5">Value</th>
                      <th className="p-3.5">Promo Coupon</th>
                      <th className="p-3.5">Customer Name & Contact</th>
                      <th className="p-3.5">Claim Status</th>
                      <th className="p-3.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {spinWinsHistory.map((win) => (
                      <tr key={win.id} className="hover:bg-amber-50/40">
                        <td className="p-3.5 font-bold text-stone-900">
                          {win.prizeTitle}
                        </td>
                        <td className="p-3.5 font-black text-brand-900">
                          {win.prizeWorth}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-stone-800">
                          {win.couponCode || '—'}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-stone-900 block">{win.userName}</span>
                          <span className="text-[10px] text-stone-500 font-mono">{win.userPhone}</span>
                        </td>
                        <td className="p-3.5">
                          {win.claimed ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                              ✓ Claimed to Account
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-full">
                              Guest Spin
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-stone-500 text-[11px] whitespace-nowrap">
                          {win.wonAt ? new Date(win.wonAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </td>
                      </tr>
                    ))}

                    {spinWinsHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-stone-500">
                          No spin wheel plays recorded yet. As visitors spin the wheel, wins will show here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* 3. DEDICATED FOOTER */}
      <footer className="p-4 text-center text-xs text-stone-500 border-t border-stone-200 bg-white">
        © {new Date().getFullYear()} {settings.storeName || "AURA ETHNIC"}. Boutique Admin & Invoicing Portal.
      </footer>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div 
            className="relative w-full max-w-2xl bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400 p-5 sm:p-6 overflow-hidden my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-brand-950 flex items-center gap-2">
                <Edit3 size={18} className="text-gold-600" />
                <span>{editingProduct ? 'Edit Item Details, Photo & Offer' : 'Add New Women Fashion Item'}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Product / Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Katan Banarasi Silk Saree or Chikankari Kurti"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700"
                />
              </div>

              {/* Multi-Image Gallery Studio (3-4+ Photos with Google Drive Link & File Upload) */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/80 via-stone-50 to-amber-50/40 rounded-3xl border border-amber-300/80 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200">
                  <div>
                    <label className="block font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 text-xs sm:text-sm">
                      <ImageIcon size={16} className="text-[#700b1d]" />
                      <span>Product Photo Gallery ({(formData.images || [formData.image]).length} Photos)</span>
                    </label>
                    <p className="text-[11px] text-stone-600">
                      Add 3 to 4 photos per product (Front view, Side angle, Fabric zoom, Dupatta/Back view).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProductImageSlot}
                    className="self-start sm:self-auto px-3 py-1.5 royal-maroon-bg text-gold-100 rounded-xl text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>+ Add Another Photo</span>
                  </button>
                </div>

                {/* PROMINENT BULK MULTI-PHOTO UPLOAD DROPZONE (3-4 Photos at once) */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={handleDropMultipleProductImages}
                  className="p-3 sm:p-4 bg-amber-100/60 border-2 border-dashed border-amber-400 hover:border-[#700b1d] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors text-center sm:text-left shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#700b1d] text-gold-200 flex items-center justify-center shrink-0 shadow-xs">
                      {isCompressingMultiple ? (
                        <div className="w-5 h-5 border-2 border-gold-200 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ImageIcon size={20} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="font-extrabold text-amber-950 text-xs sm:text-sm">
                          {isCompressingMultiple ? '⚡ Compressing & Adding Photos...' : '📁 Select 3-4 Photos Together (Bulk Upload)'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gold-400 text-stone-950 text-[9px] font-black rounded-md uppercase tracking-wider">
                          Fast Multi-Select
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Select multiple files or drag & drop. All photos automatically compress to lightweight WebP & fill the slots!
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <label className="px-3.5 py-2 royal-maroon-bg text-gold-100 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95">
                      <Upload size={14} />
                      <span>{isCompressingMultiple ? 'Processing...' : 'Browse 3-4 Photos'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUploadMultipleProductImages}
                        disabled={isCompressingMultiple}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* List of Photo Slots */}
                <div className="space-y-3">
                  {(formData.images && formData.images.length > 0 ? formData.images : [formData.image || '']).map((imgUrl, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2 relative"
                    >
                      {/* Slot Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            idx === 0 
                              ? 'royal-maroon-bg text-gold-100 border border-gold-400/40' 
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {idx === 0 ? '★ Photo 1 (Main / Cover View)' : `Photo ${idx + 1} (Additional View)`}
                          </span>
                          {isGoogleDriveUrl(imgUrl) && (
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check size={10} /> Google Drive Converted
                            </span>
                          )}
                        </div>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProductImage(idx)}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Remove this photo slot"
                          >
                            <Trash2 size={13} />
                            <span className="text-[10px]">Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Input Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Thumbnail & Drag-and-Drop Zone */}
                        <div className="sm:col-span-3">
                          <div 
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => handleDropProductImage(idx, e)}
                            className="aspect-[3/4] w-20 sm:w-24 mx-auto rounded-xl overflow-hidden border-2 border-dashed border-amber-400 hover:border-[#700b1d] shadow-sm bg-stone-100 relative group cursor-pointer transition-all flex flex-col items-center justify-center text-center"
                            title="Drag & Drop image here or click Paste (Ctrl+V)"
                          >
                            {imgUrl ? (
                              <>
                                <img 
                                  src={normalizeImageUrl(imgUrl)} 
                                  alt={`View ${idx + 1}`} 
                                  className="w-full h-full object-cover object-top"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-[9px] font-bold">
                                  <span>Drop new photo</span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-[9px] p-2 text-center group-hover:text-amber-900">
                                <ImageIcon size={18} className="mb-1 text-amber-600 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-[9px]">Drop photo or</span>
                                <span className="text-[8px] text-amber-700 font-extrabold">Ctrl + V</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* URL, Paste & Upload Inputs */}
                        <div className="sm:col-span-9 space-y-2">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-stone-700">
                                Option A: Paste Image or Link (Ctrl + V)
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePasteFromClipboardBtn(idx)}
                                className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                title="Paste copied image from clipboard"
                              >
                                <Copy size={11} />
                                <span>📋 Paste (Ctrl+V)</span>
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Click here & press Ctrl + V (or paste URL / Drive link)"
                              value={imgUrl}
                              onChange={(e) => handleUpdateProductImage(idx, e.target.value)}
                              onPaste={(e) => handlePasteProductImage(idx, e)}
                              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 focus:border-[#700b1d] focus:bg-white rounded-lg text-xs shadow-xs font-mono"
                            />
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-stone-700 block mb-1">
                              Option B: Choose Image(s) from Device (Single or Multiple)
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleUploadProductImage(idx, e)}
                              className="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-stone-900 file:text-gold-200 hover:file:bg-black cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Thumbnail Strip Summary */}
                {(formData.images && formData.images.filter(Boolean).length > 1) && (
                  <div className="pt-2 border-t border-amber-200">
                    <span className="text-[10px] font-bold text-stone-600 block mb-1">
                      Live Customer Preview Strip ({formData.images.filter(Boolean).length} Photos):
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {formData.images.filter(Boolean).map((img, i) => (
                        <div key={i} className="w-12 h-16 rounded-lg overflow-hidden border border-amber-400 shadow-xs relative shrink-0">
                          <img src={normalizeImageUrl(img)} alt="" className="w-full h-full object-cover object-top" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-bold text-center">
                            #{i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Category, Selling Price, Original MRP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-800"
                  >
                    {categories.map(cat => {
                      const name = typeof cat === 'string' ? cat : cat.name;
                      return <option key={name} value={name}>{name}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-brand-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Original MRP (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Custom Offer & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gold-50/60 rounded-2xl border border-gold-200">
                <div>
                  <label className="block font-bold text-amber-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Tag size={12} className="text-amber-700" />
                    <span>Custom Offer Text</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 50% OFF • Buy 1 Get 1 • Free Dupatta"
                    value={formData.offer || ''}
                    onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Display Ribbon Badge
                  </label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  >
                    <option value="">None</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Trending">Trending</option>
                    <option value="New Arrival">New Arrival</option>
                    <option value="Wedding Edit">Wedding Edit</option>
                    <option value="Festive Pick">Festive Pick</option>
                    <option value="Super Saver">Super Saver</option>
                    <option value="Hot Deal">Hot Deal</option>
                  </select>
                </div>
              </div>

              {/* Sizes Available */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Available Sizes / Fit
                </label>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map((sz) => {
                    const isSelected = (formData.sizes || []).includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => handleSizeToggle(sz)}
                        className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-brand-900 text-gold-200 border-brand-950'
                            : 'bg-white text-stone-600 border-stone-300 hover:border-brand-700'
                        }`}
                      >
                        {sz} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fabric, Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Fabric / Material</label>
                  <input
                    type="text"
                    placeholder="e.g. Pure Katan Silk / Chanderi / Cotton"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Color / Tone</label>
                  <input
                    type="text"
                    placeholder="e.g. Crimson Red & Gold"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Stock Status & Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inStockCheck"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="rounded text-brand-900 focus:ring-brand-800"
                  />
                  <label htmlFor="inStockCheck" className="font-bold text-stone-800 cursor-pointer">
                    Item In Stock (Available for ordering)
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Description & Styling Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter details about embroidery, cut, occasion..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{editingProduct ? 'Save Changes' : 'Create Item'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="relative w-full max-w-md bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400 p-6 overflow-hidden my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
                <FolderPlus size={18} className="text-gold-600" />
                <span>{editingCategory ? 'Edit Category' : 'Create New Women Category'}</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Designer Gowns, Sharara Sets, Nightwear"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700"
                />
              </div>

              {/* Category Photo & Icon */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gold-400 bg-white flex items-center justify-center text-2xl shadow-sm shrink-0">
                    {categoryFormData.image ? (
                      <img 
                        src={normalizeImageUrl(categoryFormData.image)} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    ) : (
                      categoryFormData.icon || '👗'
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-1">
                      Category Emoji / Icon
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 👗, 🥻, 👑, 💎, 👠"
                      value={categoryFormData.icon}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-base"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                      Category Photo / Paste (Ctrl + V)
                    </label>
                    {isGoogleDriveUrl(categoryFormData.image) && (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <Check size={11} /> Drive converted
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Click & press Ctrl + V (or paste image URL / Drive link)"
                    value={categoryFormData.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategoryFormData({ ...categoryFormData, image: normalizeImageUrl(val) });
                    }}
                    onPaste={async (e) => {
                      const clipboardData = e.clipboardData;
                      if (!clipboardData) return;
                      const items = clipboardData.items;
                      if (items) {
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.indexOf('image') !== -1 || items[i].kind === 'file') {
                            const file = items[i].getAsFile();
                            if (file) {
                              e.preventDefault();
                              const res = await compressImageFile(file);
                              if (res) setCategoryFormData(prev => ({ ...prev, image: res }));
                              return;
                            }
                          }
                        }
                      }
                      const txt = clipboardData.getData('text');
                      if (txt && (txt.startsWith('http') || txt.startsWith('data:image/') || isGoogleDriveUrl(txt))) {
                        e.preventDefault();
                        let clean = normalizeImageUrl(txt);
                        if (clean.startsWith('data:image/')) clean = await compressDataUrl(clean);
                        setCategoryFormData(prev => ({ ...prev, image: clean }));
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#700b1d]"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Or Choose Photo File from Device:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryFileUpload}
                    className="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-stone-900 file:text-gold-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* Offer Tag */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Tag size={12} className="text-amber-700" />
                  <span>Category Offer / Highlight Tag</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 40% OFF • Trending Collection • New Arrivals"
                  value={categoryFormData.offer}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, offer: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium Silk and Georgette Partywear"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl cursor-pointer hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check size={16} />
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400 p-6 overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
                <Percent size={18} className="text-gold-600" />
                <span>Create New Discount Coupon</span>
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Coupon Code (e.g. FESTIVE30) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROYAL25"
                  value={couponFormData.code}
                  onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-sm font-bold uppercase focus:outline-none focus:border-brand-700 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">Discount Type</label>
                  <select
                    value={couponFormData.discountType}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-semibold"
                  >
                    <option value="percentage">Percentage (%) OFF</option>
                    <option value="flat">Flat Amount (₹) OFF</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Value {couponFormData.discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={couponFormData.discountValue}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-brand-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0 for no minimum"
                  value={couponFormData.minOrderAmount}
                  onChange={(e) => setCouponFormData({ ...couponFormData, minOrderAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Coupon Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special festive celebration discount"
                  value={couponFormData.description}
                  onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check size={16} />
                  <span>Create Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400 p-6 overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
                <MessageSquareQuote size={18} className="text-gold-600" />
                <span>Add Customer Testimonial</span>
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radhika Agarwal"
                    value={reviewFormData.name}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={reviewFormData.city}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Product Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Banarasi Handloom Saree"
                  value={reviewFormData.productName}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, productName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Customer Review Comment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write the customer's review feedback..."
                  value={reviewFormData.comment}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check size={16} />
                  <span>Publish Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL INVOICE & BILL GENERATOR MODAL */}
      {isInvoiceModalOpen && (
        <OfficialInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          orders={orders}
          selectedOrder={selectedOrderForInvoice}
          settings={storeSettings}
          products={products}
        />
      )}

      {/* ADD / EDIT GIVEAWAY PRIZE MODAL */}
      {isPrizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="relative w-full max-w-md bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400 p-6 overflow-hidden my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
                <Gift size={18} className="text-amber-700" />
                <span>{editingPrizeId ? 'Edit Giveaway Prize' : 'Add Custom Giveaway Prize Product'}</span>
              </h3>
              <button
                onClick={() => setIsPrizeModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePrize} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Prize Title / Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heritage Pure Katan Banarasi Silk Saree"
                  value={prizeFormData.title}
                  onChange={(e) => setPrizeFormData({ ...prizeFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Estimated Worth / Price Tag (₹)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹4,999"
                  value={prizeFormData.worth}
                  onChange={(e) => setPrizeFormData({ ...prizeFormData, worth: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-brand-950"
                />
              </div>

              {/* Prize Photo & Uploader */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border border-gold-400 bg-white flex items-center justify-center text-xs text-stone-400 shadow-sm shrink-0">
                    {prizeFormData.image ? (
                      <img
                        src={normalizeImageUrl(prizeFormData.image)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <Gift size={20} className="mx-auto text-amber-600 mb-1" />
                        <span className="text-[9px]">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider block">
                      Prize Photo
                    </span>
                    <p className="text-[10px] text-stone-500">
                      Paste direct link, Google Drive link, or choose from device.
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Click & press Ctrl + V (or paste URL / Drive link)"
                    value={prizeFormData.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrizeFormData({ ...prizeFormData, image: normalizeImageUrl(val) });
                    }}
                    onPaste={async (e) => {
                      const clipboardData = e.clipboardData;
                      if (!clipboardData) return;
                      const items = clipboardData.items;
                      if (items) {
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.indexOf('image') !== -1 || items[i].kind === 'file') {
                            const file = items[i].getAsFile();
                            if (file) {
                              e.preventDefault();
                              const res = await compressImageFile(file);
                              if (res) setPrizeFormData(prev => ({ ...prev, image: res }));
                              return;
                            }
                          }
                        }
                      }
                      const txt = clipboardData.getData('text');
                      if (txt && (txt.startsWith('http') || txt.startsWith('data:image/') || isGoogleDriveUrl(txt))) {
                        e.preventDefault();
                        let clean = normalizeImageUrl(txt);
                        if (clean.startsWith('data:image/')) clean = await compressDataUrl(clean);
                        setPrizeFormData(prev => ({ ...prev, image: clean }));
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Or Choose Image from Device:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePrizeFileUpload}
                    className="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-stone-900 file:text-gold-200 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Prize Description & Highlights
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handcrafted festive designer wear with free shipping."
                  value={prizeFormData.description}
                  onChange={(e) => setPrizeFormData({ ...prizeFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPrizeModalOpen(false)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl cursor-pointer hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check size={16} />
                  <span>{editingPrizeId ? 'Update Prize' : 'Save Prize'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SPIN WHEEL SLICE MODAL */}
      {isSliceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="relative w-full max-w-md bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400 p-6 overflow-hidden my-auto max-h-[90vh] overflow-y-auto text-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
                <span className="text-xl">🎡</span>
                <span>{editingSliceIndex !== null ? 'Edit Wheel Prize Slice' : 'Add Custom Wheel Prize Slice'}</span>
              </h3>
              <button
                onClick={() => setIsSliceModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Slice Prize Label / Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Katan Silk Kurti or Flat ₹500 OFF"
                  value={sliceFormData.label}
                  onChange={(e) => setSliceFormData({ ...sliceFormData, label: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Prize Category / Type
                  </label>
                  <select
                    value={sliceFormData.type}
                    onChange={(e) => setSliceFormData({ ...sliceFormData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-semibold text-stone-800"
                  >
                    <option value="product">👗 Free Product / Dress</option>
                    <option value="coupon">🎟️ Discount Coupon</option>
                    <option value="discount">⚡ Percentage (%) OFF</option>
                    <option value="gift">💎 Luxury Gift</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Estimated Worth / Value
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1,999 or 25% OFF"
                    value={sliceFormData.worth}
                    onChange={(e) => setSliceFormData({ ...sliceFormData, worth: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-brand-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Promo Coupon Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SPIN500 or FREEKURTI"
                    value={sliceFormData.couponCode}
                    onChange={(e) => setSliceFormData({ ...sliceFormData, couponCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold uppercase text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Free Gift on Order"
                    value={sliceFormData.subtext}
                    onChange={(e) => setSliceFormData({ ...sliceFormData, subtext: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Slice Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sliceFormData.color || '#700b1d'}
                      onChange={(e) => setSliceFormData({ ...sliceFormData, color: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={sliceFormData.color || '#700b1d'}
                      onChange={(e) => setSliceFormData({ ...sliceFormData, color: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Text Font Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sliceFormData.textColor || '#fde047'}
                      onChange={(e) => setSliceFormData({ ...sliceFormData, textColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={sliceFormData.textColor || '#fde047'}
                      onChange={(e) => setSliceFormData({ ...sliceFormData, textColor: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Slice Photo / Uploader */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border border-gold-400 bg-white flex items-center justify-center text-xs text-stone-400 shadow-sm shrink-0">
                    {sliceFormData.image ? (
                      <img
                        src={normalizeImageUrl(sliceFormData.image)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <Gift size={20} className="mx-auto text-amber-600 mb-1" />
                        <span className="text-[9px]">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider block">
                      Prize Photo / Preview
                    </span>
                    <p className="text-[10px] text-stone-500">
                      Paste direct URL, Google Drive link, press Ctrl+V or select from device.
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Click & press Ctrl + V (or paste URL / Drive link)"
                    value={sliceFormData.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSliceFormData({ ...sliceFormData, image: normalizeImageUrl(val) });
                    }}
                    onPaste={async (e) => {
                      const clipboardData = e.clipboardData;
                      if (!clipboardData) return;
                      const items = clipboardData.items;
                      if (items) {
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.indexOf('image') !== -1 || items[i].kind === 'file') {
                            const file = items[i].getAsFile();
                            if (file) {
                              e.preventDefault();
                              const res = await compressImageFile(file);
                              if (res) setSliceFormData(prev => ({ ...prev, image: res }));
                              return;
                            }
                          }
                        }
                      }
                      const txt = clipboardData.getData('text');
                      if (txt && (txt.startsWith('http') || txt.startsWith('data:image/') || isGoogleDriveUrl(txt))) {
                        e.preventDefault();
                        let clean = normalizeImageUrl(txt);
                        if (clean.startsWith('data:image/')) clean = await compressDataUrl(clean);
                        setSliceFormData(prev => ({ ...prev, image: clean }));
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Or Choose Photo File from Device:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSliceFileUpload}
                    className="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-stone-900 file:text-gold-200 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSliceModalOpen(false)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl cursor-pointer hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check size={16} />
                  <span>{editingSliceIndex !== null ? 'Update Slice' : 'Save Slice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SQL SCHEMA MODAL FOR SUPABASE */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-stone-900 border border-gold-500/40 text-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Database size={20} className="text-emerald-400" />
                <h3 className="font-heading text-base font-bold text-gold-200">
                  Supabase SQL Setup Script
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              1. Apne <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-gold-300 underline font-bold">Supabase Dashboard</a> me jaakar <strong>SQL Editor</strong> kholein.<br />
              2. Ye script paste karein aur <strong>Run</strong> daba dein. Sabhi 6 tables (products, categories, settings, coupons, reviews, orders) auto-create ho jayenge.
            </p>

            <div className="flex-1 overflow-y-auto bg-stone-950 p-4 rounded-2xl border border-stone-800 font-mono text-[11px] text-emerald-300 select-all max-h-64">
              <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCHEMA}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Copy size={14} />
                <span>{copiedSql ? '✓ Copied SQL to Clipboard!' : 'Copy SQL Script'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
