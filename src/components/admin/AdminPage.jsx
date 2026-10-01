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
  Zap
} from 'lucide-react';
import { SIZES, INITIAL_PRODUCTS, DEFAULT_CATEGORIES } from '../../data/initialProducts';
import { INITIAL_COUPONS, INITIAL_REVIEWS } from '../../data/initialCoupons';
import { OfficialInvoiceModal } from './OfficialInvoiceModal';
import { normalizeImageUrl, isGoogleDriveUrl } from '../../utils/imageUrl';
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
  categories = [], 
  onSaveCategories, 
  coupons = [],
  onSaveCoupons,
  reviews = [],
  onSaveReviews,
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

  const handleUpdateProductImage = (index, url) => {
    const cleanUrl = normalizeImageUrl(url);
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

  const handleUploadProductImage = (index, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultUrl = reader.result;
        const currentImgs = [...(formData.images && formData.images.length > 0 ? formData.images : [formData.image || ''])];
        currentImgs[index] = resultUrl;
        setFormData(prev => ({
          ...prev,
          image: index === 0 ? resultUrl : (prev.image || currentImgs[0]),
          images: currentImgs
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Photo File Upload for Category
  const handleCategoryFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
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
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const cleanImages = (formData.images || [formData.image])
      .map(img => typeof img === 'string' ? normalizeImageUrl(img.trim()) : '')
      .filter(Boolean);
    const primaryImg = cleanImages[0] || normalizeImageUrl(formData.image) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
    const finalImages = cleanImages.length > 0 ? cleanImages : [primaryImg];

    const finalProduct = {
      ...formData,
      image: primaryImg,
      images: finalImages
    };

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? finalProduct : p);
      setSaveSuccessMsg(`Item "${finalProduct.name}" updated with ${finalImages.length} photos!`);
    } else {
      updatedProducts = [{ ...finalProduct, id: `item-${Date.now()}` }, ...products];
      setSaveSuccessMsg(`New item "${finalProduct.name}" added with ${finalImages.length} photos!`);
    }

    onSaveProducts(updatedProducts);
    setIsEditModalOpen(false);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Delete Product
  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this item from your boutique catalog?')) {
      const updated = products.filter(p => p.id !== id);
      onSaveProducts(updated);
      setSaveSuccessMsg('Item deleted successfully.');
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
  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return;

    let updatedCategories;
    if (editingCategory) {
      updatedCategories = categories.map(c => {
        const cName = typeof c === 'string' ? c : c.name;
        const editingName = typeof editingCategory === 'string' ? editingCategory : editingCategory.name;
        if (c.id === editingCategory.id || cName === editingName) {
          return { ...categoryFormData, name: categoryFormData.name.trim() };
        }
        return c;
      });
      setSaveSuccessMsg(`Category "${categoryFormData.name}" updated successfully!`);
    } else {
      const newCat = { ...categoryFormData, id: `cat-${Date.now()}`, name: categoryFormData.name.trim() };
      updatedCategories = [...categories, newCat];
      setSaveSuccessMsg(`New Category "${newCat.name}" created successfully!`);
    }

    onSaveCategories(updatedCategories);
    setIsCategoryModalOpen(false);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Delete Category
  const handleDeleteCategory = (catId, catName) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      const updatedCategories = categories.filter(c => {
        const name = typeof c === 'string' ? c : c.name;
        return c.id !== catId && name !== catName;
      });
      onSaveCategories(updatedCategories);
      setSaveSuccessMsg(`Category "${catName}" removed.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Coupon Handlers
  const handleSaveCoupon = (e) => {
    e.preventDefault();
    if (!couponFormData.code.trim()) return;

    const newCoupon = {
      ...couponFormData,
      id: `coup-${Date.now()}`,
      code: couponFormData.code.trim().toUpperCase(),
      discountValue: Number(couponFormData.discountValue) || 10,
      minOrderAmount: Number(couponFormData.minOrderAmount) || 0
    };

    const updated = [newCoupon, ...coupons.filter(c => c.code !== newCoupon.code)];
    onSaveCoupons(updated);
    setIsCouponModalOpen(false);
    setSaveSuccessMsg(`Coupon "${newCoupon.code}" created successfully!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleToggleCoupon = (code) => {
    const updated = coupons.map(c => c.code === code ? { ...c, isActive: !c.isActive } : c);
    onSaveCoupons(updated);
  };

  const handleDeleteCoupon = (code) => {
    if (window.confirm(`Delete coupon "${code}"?`)) {
      const updated = coupons.filter(c => c.code !== code);
      onSaveCoupons(updated);
      setSaveSuccessMsg(`Coupon "${code}" deleted.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Review Handlers
  const handleSaveReview = (e) => {
    e.preventDefault();
    if (!reviewFormData.name.trim() || !reviewFormData.comment.trim()) return;

    const newRev = {
      ...reviewFormData,
      id: `rev-${Date.now()}`
    };

    const updated = [newRev, ...reviews];
    onSaveReviews(updated);
    setIsReviewModalOpen(false);
    setSaveSuccessMsg('Customer review added successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleDeleteReview = (id) => {
    if (window.confirm('Delete this customer testimonial?')) {
      const updated = reviews.filter(r => r.id !== id);
      onSaveReviews(updated);
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

  // Reset Demo Catalog
  const handleResetCatalog = () => {
    if (window.confirm('Reset full store catalog and categories to default Women Collection?')) {
      onSaveProducts(INITIAL_PRODUCTS);
      onSaveCategories(DEFAULT_CATEGORIES);
      onSaveCoupons(INITIAL_COUPONS);
      onSaveReviews(INITIAL_REVIEWS);
      setSaveSuccessMsg('Catalog, Coupons & Reviews restored to default!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
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
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 border-amber-400 shadow-md bg-[#0a1b24] p-1">
              <img src="/logo.png" alt="Radhika Kurti Collection" className="w-full h-full object-contain" />
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
            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center border-2 border-amber-400 shadow-md bg-[#0a1b24] p-1 shrink-0">
              <img src="/logo.png" alt="Radhika Kurti Collection" className="w-full h-full object-contain" />
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
            <span>Orders ({orders.length})</span>
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
            <span>Buyer Reviews ({reviews.length})</span>
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

                <button
                  onClick={handleResetCatalog}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-300 cursor-pointer"
                  title="Restore full demo catalog"
                >
                  <RotateCcw size={14} />
                  <span>Reset Demo</span>
                </button>

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

        {/* TAB 7: CUSTOMER REVIEWS & RATINGS */}
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
                        {/* Thumbnail */}
                        <div className="sm:col-span-3">
                          <div className="aspect-[3/4] w-20 sm:w-24 mx-auto rounded-xl overflow-hidden border-2 border-gold-400 shadow-sm bg-stone-100 relative group">
                            {imgUrl ? (
                              <img 
                                src={normalizeImageUrl(imgUrl)} 
                                alt={`View ${idx + 1}`} 
                                className="w-full h-full object-cover object-top"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-[9px] p-2 text-center">
                                <ImageIcon size={16} className="mb-1 text-stone-300" />
                                <span>Add Photo</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* URL & Upload Inputs */}
                        <div className="sm:col-span-9 space-y-2">
                          <div>
                            <span className="text-[11px] font-semibold text-stone-700 block mb-1">
                              Option A: Paste Google Drive link or Image URL
                            </span>
                            <input
                              type="text"
                              placeholder="https://drive.google.com/file/d/... or https://..."
                              value={imgUrl}
                              onChange={(e) => handleUpdateProductImage(idx, e.target.value)}
                              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-[#700b1d] focus:bg-white shadow-xs font-mono"
                            />
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-stone-700 block mb-1">
                              Option B: Upload from Device
                            </span>
                            <input
                              type="file"
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
                      Category Photo / Google Drive Link
                    </label>
                    {isGoogleDriveUrl(categoryFormData.image) && (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <Check size={11} /> Drive converted
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Paste image URL or Google Drive link (https://drive.google.com/...)"
                    value={categoryFormData.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategoryFormData({ ...categoryFormData, image: normalizeImageUrl(val) });
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#700b1d]"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Or Upload Photo File:</span>
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
