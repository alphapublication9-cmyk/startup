import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Settings, 
  ShoppingBag, 
  Upload, 
  Check, 
  Sparkles, 
  Phone, 
  DollarSign, 
  Image as ImageIcon,
  RotateCcw,
  ListOrdered,
  Eye,
  LogOut,
  Tag,
  CheckCircle2,
  Layers,
  FolderPlus,
  Percent,
  FileText,
  Printer,
  Receipt,
  Search,
  Building2,
  Timer,
  Clock,
  Flame,
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { SIZES, INITIAL_PRODUCTS, DEFAULT_CATEGORIES } from '../../data/initialProducts';
import { OfficialInvoiceModal } from './OfficialInvoiceModal';
import { normalizeImageUrl, isGoogleDriveUrl } from '../../utils/imageUrl';

export const AdminDashboard = ({ 
  isOpen, 
  onClose, 
  products, 
  onSaveProducts, 
  categories = [],
  onSaveCategories,
  settings, 
  onSaveSettings, 
  orders = [], 
  onLogout 
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'invoices' | 'settings' | 'orders'
  const [filterCategoryInTable, setFilterCategoryInTable] = useState('All');
  
  // Product Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Category Add / Edit State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState({ name: '', icon: '👗', description: '' });

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // Form State for Product Add / Edit
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: categories[0]?.name || 'Kurtis & Suits',
    price: 999,
    originalPrice: 1999,
    image: '',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '',
    color: '',
    badge: 'Trending',
    offer: 'Flat 40% OFF',
    rating: 4.8,
    reviewsCount: 30,
    inStock: true,
    description: ''
  });

  // Settings Form State
  const [storeSettings, setStoreSettings] = useState({ ...settings });

  // Open Edit Product Modal
  const handleOpenEditProduct = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        sizes: product.sizes || ['S', 'M', 'L', 'XL'],
        offer: product.offer || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        id: `item-${Date.now()}`,
        name: '',
        category: categories[0]?.name || 'Kurtis & Suits',
        price: 999,
        originalPrice: 1999,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        fabric: 'Pure Artisan Fabric',
        color: 'Multicolor',
        badge: 'New Arrival',
        offer: 'Festive Special • Flat 40% OFF',
        rating: 4.9,
        reviewsCount: 12,
        inStock: true,
        description: 'Handcrafted premium ethnic fashion ensemble with fine detailing.'
      });
    }
    setIsEditModalOpen(true);
  };

  // Handle Photo File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Size in Form
  const handleSizeToggle = (size) => {
    const currentSizes = formData.sizes || [];
    if (currentSizes.includes(size)) {
      setFormData({ ...formData, sizes: currentSizes.filter(s => s !== size) });
    } else {
      setFormData({ ...formData, sizes: [...currentSizes, size] });
    }
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? { ...formData } : p);
      setSaveSuccessMsg('Item updated successfully!');
    } else {
      updatedProducts = [{ ...formData, id: `item-${Date.now()}` }, ...products];
      setSaveSuccessMsg('New Women Fashion item added successfully!');
    }

    onSaveProducts(updatedProducts);
    setIsEditModalOpen(false);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
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

  // Category Actions
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatData.name.trim()) return;

    const newCategory = {
      id: `cat-${Date.now()}`,
      name: newCatData.name.trim(),
      icon: newCatData.icon.trim() || '👗',
      description: newCatData.description.trim() || newCatData.name
    };

    const updatedCategories = [...categories, newCategory];
    onSaveCategories(updatedCategories);
    setNewCatData({ name: '', icon: '👗', description: '' });
    setIsCategoryModalOpen(false);
    setSaveSuccessMsg(`Category "${newCategory.name}" created successfully!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleDeleteCategory = (catId, catName) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      const updatedCategories = categories.filter(c => c.id !== catId && c.name !== catName);
      onSaveCategories(updatedCategories);
      setSaveSuccessMsg(`Category "${catName}" removed.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Invoice Open Handler
  const handleOpenInvoice = (order = null) => {
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  // Save Store Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    onSaveSettings(storeSettings);
    setSaveSuccessMsg('Store, Company & WhatsApp settings updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Reset to Default Products & Categories
  const handleResetCatalog = () => {
    if (window.confirm('Reset full store catalog and categories to default Women Collection?')) {
      onSaveProducts(INITIAL_PRODUCTS);
      onSaveCategories(DEFAULT_CATEGORIES);
      setSaveSuccessMsg('Catalog & Categories restored to default!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  // Filtered products for admin table
  const tableProducts = filterCategoryInTable === 'All'
    ? products
    : products.filter(p => p.category === filterCategoryInTable);

  // Filtered orders for invoice generator
  const filteredInvoiceOrders = orders.filter(ord => {
    const q = invoiceSearchQuery.toLowerCase();
    const orderId = (ord.id || '').toLowerCase();
    const customerName = (ord.customer?.name || '').toLowerCase();
    const phone = (ord.customer?.phone || '').toLowerCase();
    return orderId.includes(q) || customerName.includes(q) || phone.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-6xl bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400/80 overflow-hidden my-auto max-h-[94vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Admin Header */}
        <div className="royal-maroon-bg text-gold-100 p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-400/50 flex items-center justify-center text-gold-300">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide">
                  Boutique Admin Panel
                </h2>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Admin: PAWAN420
                </span>
              </div>
              <p className="text-xs text-gold-200">
                Products • Categories • Official Invoices • Prices & Offers • Orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-700/50"
              title="Logout Admin"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gold-200 hover:text-white hover:bg-white/10"
            >
              <X size={22} />
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

        {/* Tab Navigation */}
        <div className="bg-stone-100 px-4 sm:px-6 pt-3 border-b border-stone-200 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'products'
                ? 'bg-[#fdfcf9] text-brand-950 border-stone-200 -mb-[1px] shadow-sm'
                : 'text-stone-600 hover:text-stone-900 border-transparent'
            }`}
          >
            <ShoppingBag size={15} className="text-gold-700" />
            <span>All Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'categories'
                ? 'bg-[#fdfcf9] text-brand-950 border-stone-200 -mb-[1px] shadow-sm'
                : 'text-stone-600 hover:text-stone-900 border-transparent'
            }`}
          >
            <Layers size={15} className="text-gold-700" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'invoices'
                ? 'bg-[#fdfcf9] text-brand-950 border-stone-200 -mb-[1px] shadow-sm'
                : 'text-stone-600 hover:text-stone-900 border-transparent'
            }`}
          >
            <Receipt size={15} className="text-amber-700" />
            <span className="font-extrabold text-brand-900">🧾 Official Invoices & Bills</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'orders'
                ? 'bg-[#fdfcf9] text-brand-950 border-stone-200 -mb-[1px] shadow-sm'
                : 'text-stone-600 hover:text-stone-900 border-transparent'
            }`}
          >
            <ListOrdered size={15} className="text-gold-700" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'settings'
                ? 'bg-[#fdfcf9] text-brand-950 border-stone-200 -mb-[1px] shadow-sm'
                : 'text-stone-600 hover:text-stone-900 border-transparent'
            }`}
          >
            <Settings size={15} className="text-gold-700" />
            <span>Company & Store Settings</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-h-[68vh]">
          
          {/* TAB 1: ALL WOMEN FASHION PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900">
                      Product Catalog ({products.length} Items)
                    </h3>
                    <p className="text-xs text-stone-500">
                      Manage photos, prices, offers, sizes, and stock
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {/* Category Filter in Table */}
                  <select
                    value={filterCategoryInTable}
                    onChange={(e) => setFilterCategoryInTable(e.target.value)}
                    className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:border-brand-700"
                  >
                    <option value="All">Filter: All Categories ({products.length})</option>
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
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-300"
                    title="Restore full demo catalog"
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditProduct(null)}
                    className="flex-1 sm:flex-initial px-4 py-2 royal-maroon-bg text-gold-100 font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
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
                        <th className="p-3">Photo</th>
                        <th className="p-3">Title & Fabric</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price (₹)</th>
                        <th className="p-3">MRP (₹)</th>
                        <th className="p-3">Offer / Tag</th>
                        <th className="p-3">Sizes</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {tableProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-14 object-cover object-top rounded-lg border border-stone-200 shadow-sm"
                            />
                          </td>
                          <td className="p-3 max-w-[200px]">
                            <p className="font-bold text-stone-900 line-clamp-1">{p.name}</p>
                            <p className="text-[10px] text-stone-400 line-clamp-1">{p.fabric}</p>
                          </td>
                          <td className="p-3">
                            <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md font-semibold text-[11px] whitespace-nowrap">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-brand-950 text-sm">
                            ₹{p.price.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-stone-400 line-through">
                            ₹{p.originalPrice?.toLocaleString('en-IN') || '-'}
                          </td>
                          <td className="p-3 max-w-[150px]">
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
                          <td className="p-3">
                            <div className="flex gap-1 flex-wrap max-w-[110px]">
                              {(p.sizes || []).map(sz => (
                                <span key={sz} className="text-[9px] font-bold bg-gold-100 text-gold-900 px-1.5 py-0.2 rounded">
                                  {sz}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200"
                              title="Edit Photo, Price & Offer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    Women's Fashion Categories ({categories.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Add new categories, delete categories, or organize collections
                  </p>
                </div>

                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-4 py-2 royal-maroon-bg text-gold-100 font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <FolderPlus size={16} />
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat, idx) => {
                  const catName = typeof cat === 'string' ? cat : cat.name;
                  const catIcon = typeof cat === 'string' ? '👗' : (cat.icon || '👗');
                  const catDesc = typeof cat === 'string' ? cat : (cat.description || '');
                  const count = products.filter(p => p.category === catName).length;

                  return (
                    <div
                      key={cat.id || idx}
                      className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between gap-3 hover:border-gold-400 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center text-2xl shadow-inner shrink-0">
                          {catIcon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-stone-900">{catName}</h4>
                          <p className="text-[11px] text-stone-500 line-clamp-1">{catDesc}</p>
                          <span className="inline-block mt-1 bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {count} Items Listed
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(cat.id, catName)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: OFFICIAL TAX INVOICE & BILL GENERATOR */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-stone-900 via-brand-950 to-stone-900 text-white p-5 rounded-3xl border border-gold-400/40 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                    <Receipt size={14} />
                    <span>Amazon & Flipkart Standard Tax Invoice</span>
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold">
                    Official Customer Bill & Invoice Generator
                  </h3>
                  <p className="text-xs text-stone-300 max-w-xl">
                    Generate official Tax Invoices with your company name, GSTIN, customer details, ordered items, and taxes. Download as PNG image, print A4 PDF, or send directly on WhatsApp.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenInvoice(null)}
                  className="px-5 py-3 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-brand-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus size={18} />
                  <span>Create Custom / Blank Bill</span>
                </button>
              </div>

              {/* Order Search & Quick Invoice List */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-stone-900">
                      Select Customer Order to Generate Official Bill
                    </h4>
                    <p className="text-xs text-stone-500">
                      Click "Generate Official Bill" on any placed order to auto-fill all items and address
                    </p>
                  </div>

                  {/* Search input */}
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="Search by Order ID, Customer, Phone..."
                      value={invoiceSearchQuery}
                      onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-700"
                    />
                    <Search size={15} className="absolute left-3 top-2.5 text-stone-400" />
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500">
                    <Receipt size={32} className="mx-auto text-stone-400 mb-2" />
                    <p className="font-bold text-stone-700">No Customer Orders in Database Yet</p>
                    <p className="text-xs text-stone-400 mt-1">
                      You can click <strong>"Create Custom / Blank Bill"</strong> above to generate a bill for any walk-in or manual customer!
                    </p>
                  </div>
                ) : filteredInvoiceOrders.length === 0 ? (
                  <div className="p-6 text-center text-stone-500 text-xs">
                    No orders match your search query "{invoiceSearchQuery}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredInvoiceOrders.map((ord) => (
                      <div 
                        key={ord.id}
                        className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:border-gold-400 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold bg-stone-100 text-stone-800 px-2 py-0.5 rounded">
                                {ord.id}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <h5 className="font-bold text-stone-900 text-sm mt-1">{ord.customer?.name}</h5>
                            <p className="text-xs text-stone-500">📞 {ord.customer?.phone} • 📍 {ord.customer?.city}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-extrabold text-brand-950 bg-gold-100 px-2.5 py-1 rounded-full">
                              ₹{ord.totalAmount?.toLocaleString('en-IN')}
                            </span>
                            <p className="text-[10px] text-stone-500 mt-1">{ord.customer?.paymentMethod}</p>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="bg-stone-50 p-2.5 rounded-xl text-xs space-y-1">
                          <p className="font-bold text-stone-700 text-[11px]">Items in this Order ({ord.items?.reduce((a, c) => a + c.quantity, 0)}):</p>
                          {ord.items?.slice(0, 2).map((it, idx) => (
                            <p key={idx} className="text-[11px] text-stone-600 truncate">
                              • {it.name} (Size: {it.selectedSize}) x{it.quantity} - ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                            </p>
                          ))}
                          {ord.items?.length > 2 && (
                            <p className="text-[10px] text-stone-400 font-semibold">+ {ord.items.length - 2} more items</p>
                          )}
                        </div>

                        {/* Generate Bill CTA */}
                        <button
                          onClick={() => handleOpenInvoice(ord)}
                          className="w-full py-2.5 bg-gradient-to-r from-stone-900 to-brand-950 hover:from-brand-950 hover:to-brand-900 text-gold-200 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                        >
                          <Receipt size={15} className="text-gold-400" />
                          <span>🧾 Generate Official Tax Invoice / Bill</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER ORDERS / INQUIRIES LOG */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    Customer WhatsApp Orders History
                  </h3>
                  <p className="text-xs text-stone-500">
                    Log of checkout requests prepared for WhatsApp with 1-click Invoice button
                  </p>
                </div>
                <span className="text-xs font-bold bg-gold-100 text-gold-900 px-3 py-1 rounded-full">
                  Total {orders.length} Orders Logged
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
                    <div key={ord.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between border-b border-stone-100 pb-2">
                          <div>
                            <p className="font-bold text-sm text-stone-900">{ord.customer?.name || 'Customer'}</p>
                            <p className="text-xs text-stone-500 flex items-center gap-1">
                              <Phone size={12} /> {ord.customer?.phone}
                            </p>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ₹{ord.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="text-xs text-stone-600 space-y-1 mt-2">
                          <p><strong>Address:</strong> {ord.customer?.address}, {ord.customer?.city} ({ord.customer?.pincode})</p>
                          <p><strong>Payment:</strong> {ord.customer?.paymentMethod}</p>
                          <p className="text-[11px] text-stone-400">Date: {new Date(ord.createdAt).toLocaleString()}</p>
                        </div>

                        <div className="bg-stone-50 p-2 rounded-xl text-xs space-y-1 mt-2">
                          <p className="font-bold text-stone-700">Items Ordered:</p>
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-stone-600">
                              <span>• {it.name} (Size: {it.selectedSize}) x{it.quantity}</span>
                              <span>₹{(it.price * it.quantity).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action to create Invoice */}
                      <button
                        onClick={() => handleOpenInvoice(ord)}
                        className="w-full mt-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
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

          {/* TAB 5: STORE & COMPANY BILLING SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Building2 size={20} className="text-amber-700" />
                  <span>Company Billing & Store Settings</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Configure your company name, GSTIN, billing address, and WhatsApp contact for official Tax Invoices.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                
                {/* Company Name on Bill */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                    Official Company Details on Bill / Invoice
                  </h4>

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
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
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
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
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
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
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
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
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
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
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
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
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
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Phone size={14} />
                    <span>WhatsApp Order Receiver Phone Number</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +919876543210 or 919876543210"
                    value={storeSettings.whatsappNumber}
                    onChange={(e) => setStoreSettings({ ...storeSettings, whatsappNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* ⚡ 15-MINUTE CART COUNTDOWN FLASH DISCOUNT SETTINGS */}
                <div className="p-5 bg-gradient-to-br from-amber-50/90 via-rose-50/40 to-amber-50/80 border-2 border-amber-300 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center shadow-xs">
                        <Flame size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                          <span>15-Minute Cart Countdown Rush Discount</span>
                          <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                            High Conversion
                          </span>
                        </h4>
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
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 royal-maroon-bg text-gold-100 font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    <span>Save All Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
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
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
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

              {/* Photo Upload with Google Drive & Cloud Link Auto-Conversion */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <ImageIcon size={14} className="text-[#700b1d]" />
                    <span>Item Photo (Google Drive Link, Image URL, or Upload)</span>
                  </label>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    ⚡ Google Drive Supported
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-3">
                    <div className="aspect-[3/4] w-24 mx-auto rounded-xl overflow-hidden border-2 border-gold-400 shadow-sm bg-stone-100">
                      {formData.image ? (
                        <img 
                          src={normalizeImageUrl(formData.image)} 
                          alt="Preview" 
                          className="w-full h-full object-cover object-top" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-[10px] p-2 text-center">
                          <ImageIcon size={18} className="mb-1 text-stone-300" />
                          <span>No Photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-9 space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-stone-700">Option 1: Image URL or Google Drive Link</span>
                        {isGoogleDriveUrl(formData.image) && (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <Check size={11} /> Google Drive link converted
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Paste image URL or Google Drive link (https://drive.google.com/...)"
                        value={formData.image}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, image: normalizeImageUrl(val) });
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-[#700b1d] shadow-xs"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">
                        💡 <em>Tip: Google Drive link ko public ("Anyone with the link can view") rakhein.</em>
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-stone-700 block mb-1">Option 2: Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-gold-200 hover:file:bg-black cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
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
                        className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors ${
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
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>{editingProduct ? 'Save Changes' : 'Create Item'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="relative w-full max-w-md bg-[#fdfcf9] rounded-3xl shadow-2xl border border-gold-400 p-6 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-950 flex items-center gap-2">
                <FolderPlus size={18} className="text-gold-600" />
                <span>Create New Women Category</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Designer Gowns, Sharara Sets, Nightwear"
                  value={newCatData.name}
                  onChange={(e) => setNewCatData({ ...newCatData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand-700"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Category Icon / Emoji
                </label>
                <input
                  type="text"
                  placeholder="e.g. 👗, 🥻, 👑, 💎, 👠"
                  value={newCatData.icon}
                  onChange={(e) => setNewCatData({ ...newCatData, icon: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium Silk and Georgette Partywear"
                  value={newCatData.description}
                  onChange={(e) => setNewCatData({ ...newCatData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 royal-maroon-bg text-gold-100 font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>Create Category</span>
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

    </div>
  );
};
