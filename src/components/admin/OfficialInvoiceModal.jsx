import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Edit3, 
  Save, 
  Plus, 
  Trash2, 
  MessageCircle, 
  FileText, 
  Building2, 
  User, 
  CheckCircle2, 
  QrCode, 
  Crown,
  Search,
  Sparkles,
  Share2,
  Image as ImageIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { numberToIndianWords } from '../../utils/numberToWords';
import { SignatureSeal } from './SignatureSeal';

export const OfficialInvoiceModal = ({ 
  isOpen, 
  onClose, 
  orders = [], 
  selectedOrder = null, 
  settings = {}, 
  products = [] 
}) => {
  if (!isOpen) return null;

  const invoiceRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrderId, setActiveOrderId] = useState(selectedOrder?.id || (orders[0]?.id || ''));

  // Invoice Data State
  const [invoiceData, setInvoiceData] = useState(() => {
    const ord = selectedOrder || orders[0];
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const randomInvNum = Math.floor(1000 + Math.random() * 9000);

    if (ord) {
      return {
        invoiceNumber: `${settings.invoicePrefix || 'AURA/2026/'}${randomInvNum}`,
        invoiceDate: formattedDate,
        orderId: ord.id || `ORD-${Date.now()}`,
        orderDate: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : formattedDate,
        paymentMethod: ord.customer?.paymentMethod || 'Cash on Delivery (COD)',
        
        // Company Details
        companyName: settings.storeName || 'AURA ETHNIC BOUTIQUE PVT. LTD.',
        companyAddress: settings.companyAddress || 'Plot No. 42, Hawa Mahal Road, Badi Chaupar',
        companyCity: settings.companyCity || 'Jaipur, Rajasthan',
        companyPincode: settings.companyPincode || '302002',
        companyGst: settings.companyGst || '08AABCA1234F1Z9',
        companyPhone: settings.whatsappNumber || '+919876543210',
        companyEmail: settings.supportEmail || 'billing@auraethnic.com',

        // Customer Details
        customerName: ord.customer?.name || 'Valued Customer',
        customerPhone: ord.customer?.phone || '9876543210',
        customerAddress: ord.customer?.address || 'Flat 402, Lotus Tower, Near Diamond Plaza',
        customerCity: ord.customer?.city || 'Jaipur',
        customerState: ord.customer?.state || 'Rajasthan',
        customerPincode: ord.customer?.pincode || '302001',

        // Items
        items: (ord.items && ord.items.length > 0) ? ord.items.map((it, idx) => ({
          id: idx + 1,
          name: it.name,
          size: it.selectedSize || 'Standard',
          hsn: '6204',
          quantity: it.quantity || 1,
          unitPrice: it.price || 999,
          originalPrice: it.originalPrice || it.price || 999
        })) : [
          {
            id: 1,
            name: 'Royal Zari Embroidered Anarkali Kurti Set',
            size: 'L',
            hsn: '6204',
            quantity: 1,
            unitPrice: 1899,
            originalPrice: 3499
          }
        ],

        discountAmount: ord.discount || 0,
        shippingCharges: 0,
        gstRate: 5, // 5% GST on apparel
        notes: ord.customer?.notes || 'Customer requested standard delivery with boutique packaging.',
        terms: settings.invoiceTerms || '1. 7-Day Hassle-Free Size Exchange on intact tags.\n2. Dry Clean recommended for all silk, zari, and embroidered apparel.\n3. All disputes subject to Jaipur jurisdiction.'
      };
    }

    // Default Fallback Data
    return {
      invoiceNumber: `${settings.invoicePrefix || 'AURA/2026/'}${randomInvNum}`,
      invoiceDate: formattedDate,
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      orderDate: formattedDate,
      paymentMethod: 'Cash on Delivery (COD)',
      companyName: settings.storeName || 'AURA ETHNIC BOUTIQUE PVT. LTD.',
      companyAddress: settings.companyAddress || 'Plot No. 42, Hawa Mahal Road, Badi Chaupar',
      companyCity: settings.companyCity || 'Jaipur, Rajasthan',
      companyPincode: settings.companyPincode || '302002',
      companyGst: settings.companyGst || '08AABCA1234F1Z9',
      companyPhone: settings.whatsappNumber || '+919876543210',
      companyEmail: settings.supportEmail || 'billing@auraethnic.com',

      customerName: 'Ananya Sharma',
      customerPhone: '9876543210',
      customerAddress: 'Flat 402, Lotus Tower, Near Diamond Plaza',
      customerCity: 'Jaipur',
      customerState: 'Rajasthan',
      customerPincode: '302001',

      items: [
        {
          id: 1,
          name: 'Royal Zari Embroidered Anarkali Kurti Set',
          size: 'L',
          hsn: '6204',
          quantity: 1,
          unitPrice: 1899,
          originalPrice: 3499
        }
      ],
      discountAmount: 0,
      shippingCharges: 0,
      gstRate: 5,
      notes: 'Thank you for shopping with AURA ETHNIC BOUTIQUE!',
      terms: settings.invoiceTerms || '1. 7-Day Hassle-Free Size Exchange on intact tags.\n2. Dry Clean recommended for silk & zari apparel.\n3. All disputes subject to Jaipur jurisdiction.'
    };
  });

  // Handle switching order from dropdown
  const handleSelectOrder = (orderId) => {
    setActiveOrderId(orderId);
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const randomInvNum = Math.floor(1000 + Math.random() * 9000);

      setInvoiceData(prev => ({
        ...prev,
        invoiceNumber: `${settings.invoicePrefix || 'AURA/2026/'}${randomInvNum}`,
        orderId: ord.id,
        orderDate: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : formattedDate,
        paymentMethod: ord.customer?.paymentMethod || 'Cash on Delivery (COD)',
        customerName: ord.customer?.name || prev.customerName,
        customerPhone: ord.customer?.phone || prev.customerPhone,
        customerAddress: ord.customer?.address || prev.customerAddress,
        customerCity: ord.customer?.city || prev.customerCity,
        customerState: ord.customer?.state || prev.customerState,
        customerPincode: ord.customer?.pincode || prev.customerPincode,
        discountAmount: ord.discount || 0,
        notes: ord.customer?.notes || prev.notes,
        items: (ord.items && ord.items.length > 0) ? ord.items.map((it, idx) => ({
          id: idx + 1,
          name: it.name,
          size: it.selectedSize || 'Standard',
          hsn: '6204',
          quantity: it.quantity || 1,
          unitPrice: it.price || 999,
          originalPrice: it.originalPrice || it.price || 999
        })) : prev.items
      }));
    }
  };

  // Calculations
  const subtotal = invoiceData.items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
  const discountTotal = Number(invoiceData.discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const gstAmount = Math.round((taxableAmount * (Number(invoiceData.gstRate) || 5)) / 105); // GST Inclusive calculation (standard retail)
  const netAmountBeforeGst = taxableAmount - gstAmount;
  const shippingAmount = Number(invoiceData.shippingCharges) || 0;
  const grandTotal = Math.max(0, taxableAmount + shippingAmount);
  const amountInWords = numberToIndianWords(grandTotal);

  // Print Invoice (Save as PDF)
  const handlePrint = () => {
    window.print();
  };

  // Download Invoice as PNG Image
  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingImage(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2.5, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Invoice-${invoiceData.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Could not download image. You can also use Print -> Save as PDF!');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Send WhatsApp Invoice to Customer
  const handleSendWhatsAppInvoice = () => {
    const cleanPhone = (invoiceData.customerPhone || '').replace(/[^0-9]/g, '');
    const itemsList = invoiceData.items.map((it, idx) => 
      `${idx + 1}. *${it.name}* (Size: ${it.size}) x${it.quantity} = ₹${(it.unitPrice * it.quantity).toLocaleString('en-IN')}`
    ).join('\n');

    const msg = 
`🧾 *OFFICIAL TAX INVOICE / BILL*
*${invoiceData.companyName}*
━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${invoiceData.invoiceNumber}
📅 *Invoice Date:* ${invoiceData.invoiceDate}
📦 *Order ID:* ${invoiceData.orderId}
👤 *Billed To:* ${invoiceData.customerName}
📞 *Mobile:* ${invoiceData.customerPhone}
📍 *Delivery Address:* ${invoiceData.customerAddress}, ${invoiceData.customerCity} (${invoiceData.customerPincode})
━━━━━━━━━━━━━━━━━━━━
🛍️ *ORDERED ITEMS:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ₹${subtotal.toLocaleString('en-IN')}
${discountTotal > 0 ? `🎁 *Discount Applied:* -₹${discountTotal.toLocaleString('en-IN')}\n` : ''}🚚 *Shipping:* ${shippingAmount === 0 ? 'FREE' : `₹${shippingAmount}`}
⭐ *GRAND TOTAL:* *₹${grandTotal.toLocaleString('en-IN')}*
💵 *Payment Mode:* ${invoiceData.paymentMethod}
━━━━━━━━━━━━━━━━━━━━
🙏 *Thank you for shopping with ${invoiceData.companyName}!*
For any exchange / support, contact WhatsApp: ${invoiceData.companyPhone}`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Add Item in Edit Mode
  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      name: 'Designer Kurti / Saree',
      size: 'M',
      hsn: '6204',
      quantity: 1,
      unitPrice: 999,
      originalPrice: 1999
    };
    setInvoiceData({ ...invoiceData, items: [...invoiceData.items, newItem] });
  };

  // Remove Item in Edit Mode
  const handleRemoveItem = (id) => {
    if (invoiceData.items.length <= 1) {
      alert('Invoice must have at least 1 item.');
      return;
    }
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter(item => item.id !== id)
    });
  };

  // Update Item in Edit Mode
  const handleUpdateItem = (id, field, value) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-5xl bg-stone-100 rounded-3xl shadow-2xl border border-gold-400/60 overflow-hidden my-auto max-h-[96vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* TOP CONTROLS & ACTIONS BAR (Hidden when Printing) */}
        <div className="no-print royal-maroon-bg text-gold-100 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gold-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-400/50 flex items-center justify-center text-gold-300">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold tracking-wide">
                  Official Tax Invoice & Bill Generator
                </h2>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Amazon / Flipkart Format
                </span>
              </div>
              <p className="text-xs text-gold-200">
                Generate, edit, print A4 PDF or download PNG invoice image for customers
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Toggle Edit Mode */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                isEditing 
                  ? 'bg-amber-400 text-stone-950 hover:bg-amber-300' 
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
              <span className="truncate">{isEditing ? 'Done' : 'Edit Bill'}</span>
            </button>

            {/* Download as Image PNG */}
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="Download Bill as Image / Photo (PNG)"
            >
              <Download size={14} />
              <span className="truncate">{isGeneratingImage ? 'Saving...' : 'PNG Image'}</span>
            </button>

            {/* Print / Save as PDF */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-brand-950 font-bold text-xs rounded-xl shadow-md hover:shadow-gold-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              title="Print or Save as Official PDF (A4)"
            >
              <Printer size={14} />
              <span className="truncate">Print / PDF</span>
            </button>

            {/* Send WhatsApp Invoice */}
            <button
              onClick={handleSendWhatsAppInvoice}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              title="Send bill summary directly to customer on WhatsApp"
            >
              <MessageCircle size={14} />
              <span className="truncate">WhatsApp</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="col-span-2 sm:col-span-1 p-2 rounded-xl text-gold-200 hover:text-white hover:bg-white/10 flex items-center justify-center border border-white/10 sm:border-0"
            >
              <X size={18} />
              <span className="sm:hidden text-xs font-bold ml-1">Close Bill</span>
            </button>
          </div>
        </div>

        {/* Mobile Swipe Notice */}
        <div className="no-print md:hidden bg-amber-100/90 text-amber-950 text-[11px] font-bold px-3 py-1.5 text-center border-b border-amber-300 flex items-center justify-center gap-1.5">
          <span>👉 Swipe horizontally on the bill to view full tax table & official rubber stamp</span>
        </div>

        {/* ORDER SELECTOR STRIP (Hidden when Printing) */}
        {orders.length > 0 && (
          <div className="no-print bg-stone-200/90 px-4 py-2.5 border-b border-stone-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-stone-700 flex items-center gap-1">
                <Search size={14} />
                <span>Load Existing Order:</span>
              </span>
              <select
                value={activeOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:border-brand-700"
              >
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.id} - {ord.customer?.name} (₹{ord.totalAmount})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] text-stone-500 font-medium">
              💡 Tip: Click "Edit Bill Details" to customize company name, address, GST, or prices before printing.
            </span>
          </div>
        )}

        {/* INVOICE DOCUMENT CONTAINER (A4 Standard View) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-200/50 flex justify-center">
          
          <div 
            id="invoice-document"
            ref={invoiceRef}
            className="w-full max-w-[850px] bg-white p-6 sm:p-10 shadow-2xl border border-stone-300 text-stone-900 font-sans text-xs leading-relaxed"
            style={{ minHeight: '1050px' }}
          >
            
            {/* 1. INVOICE HEADER */}
            <div className="flex items-start justify-between border-b-2 border-stone-800 pb-4 mb-4">
              {/* Brand Logo & Name */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <img 
                      src={settings?.logoUrl || "/logo.png"} 
                      alt="Brand Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    />
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={invoiceData.companyName}
                      onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                      className="font-bold text-base border border-amber-300 p-1 rounded font-serif"
                    />
                  ) : (
                    <h1 className="font-serif text-lg sm:text-xl font-extrabold tracking-wider text-stone-950 uppercase">
                      {invoiceData.companyName}
                    </h1>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 font-semibold tracking-widest uppercase">
                  Designer Women's Fashion & Ethnic Boutique
                </p>
                <p className="text-[11px] text-stone-600">
                  {invoiceData.companyAddress}, {invoiceData.companyCity} - {invoiceData.companyPincode}
                </p>
                <p className="text-[11px] text-stone-600">
                  <strong>GSTIN:</strong> {invoiceData.companyGst} | <strong>Phone:</strong> {invoiceData.companyPhone}
                </p>
              </div>

              {/* Tax Invoice Badge & Number */}
              <div className="text-right space-y-1">
                <div className="inline-block bg-stone-900 text-gold-300 font-bold px-3 py-1 text-[11px] uppercase tracking-wider rounded">
                  TAX INVOICE
                </div>
                <p className="text-[10px] text-stone-500 uppercase tracking-wide">Original For Recipient</p>
                
                <div className="pt-2 text-stone-800 space-y-0.5">
                  <p>
                    <strong>Invoice No:</strong>{' '}
                    {isEditing ? (
                      <input
                        type="text"
                        value={invoiceData.invoiceNumber}
                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                        className="border border-stone-300 px-1 py-0.5 text-xs w-36"
                      />
                    ) : (
                      <span className="font-bold font-mono">{invoiceData.invoiceNumber}</span>
                    )}
                  </p>
                  <p>
                    <strong>Invoice Date:</strong>{' '}
                    {isEditing ? (
                      <input
                        type="text"
                        value={invoiceData.invoiceDate}
                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                        className="border border-stone-300 px-1 py-0.5 text-xs w-28"
                      />
                    ) : (
                      <span>{invoiceData.invoiceDate}</span>
                    )}
                  </p>
                  <p>
                    <strong>Order ID:</strong> <span className="font-mono text-stone-700">{invoiceData.orderId}</span>
                  </p>
                  <p>
                    <strong>Payment Mode:</strong>{' '}
                    {isEditing ? (
                      <select
                        value={invoiceData.paymentMethod}
                        onChange={(e) => setInvoiceData({ ...invoiceData, paymentMethod: e.target.value })}
                        className="border border-stone-300 px-1 py-0.5 text-xs"
                      >
                        <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                        <option value="UPI / Online Prepaid">UPI / Online Prepaid</option>
                        <option value="Credit / Debit Card">Credit / Debit Card</option>
                      </select>
                    ) : (
                      <span className="font-bold text-emerald-800">{invoiceData.paymentMethod}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. CUSTOMER & SHIPPING ADDRESS SECTION */}
            <div className="grid grid-cols-2 gap-4 border border-stone-300 p-3.5 mb-4 bg-stone-50/50 rounded-lg">
              
              {/* Sold By / Merchant Details */}
              <div className="border-r border-stone-200 pr-3 space-y-1">
                <p className="font-bold uppercase text-[10px] tracking-wider text-stone-500">Sold By / Merchant</p>
                <p className="font-bold text-stone-900">{invoiceData.companyName}</p>
                <p className="text-stone-600">{invoiceData.companyAddress}</p>
                <p className="text-stone-600">{invoiceData.companyCity}, Pincode: {invoiceData.companyPincode}</p>
                <p className="text-stone-600">Email: {invoiceData.companyEmail}</p>
                <p className="text-stone-600">State / UT Code: 08 (Rajasthan)</p>
              </div>

              {/* Billed & Shipped To (Customer) */}
              <div className="pl-1 space-y-1">
                <p className="font-bold uppercase text-[10px] tracking-wider text-stone-500">Billed & Shipped To (Customer)</p>
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={invoiceData.customerName}
                      onChange={(e) => setInvoiceData({ ...invoiceData, customerName: e.target.value })}
                      className="w-full border border-stone-300 p-1 text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Customer Mobile"
                      value={invoiceData.customerPhone}
                      onChange={(e) => setInvoiceData({ ...invoiceData, customerPhone: e.target.value })}
                      className="w-full border border-stone-300 p-1 text-xs"
                    />
                    <textarea
                      rows={2}
                      placeholder="Delivery Address"
                      value={invoiceData.customerAddress}
                      onChange={(e) => setInvoiceData({ ...invoiceData, customerAddress: e.target.value })}
                      className="w-full border border-stone-300 p-1 text-xs"
                    />
                    <div className="grid grid-cols-3 gap-1">
                      <input
                        type="text"
                        placeholder="City"
                        value={invoiceData.customerCity}
                        onChange={(e) => setInvoiceData({ ...invoiceData, customerCity: e.target.value })}
                        className="border border-stone-300 p-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={invoiceData.customerState}
                        onChange={(e) => setInvoiceData({ ...invoiceData, customerState: e.target.value })}
                        className="border border-stone-300 p-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={invoiceData.customerPincode}
                        onChange={(e) => setInvoiceData({ ...invoiceData, customerPincode: e.target.value })}
                        className="border border-stone-300 p-1 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-stone-900">{invoiceData.customerName}</p>
                    <p className="text-stone-700">Phone: <strong>{invoiceData.customerPhone}</strong></p>
                    <p className="text-stone-600">{invoiceData.customerAddress}</p>
                    <p className="text-stone-600">{invoiceData.customerCity}, {invoiceData.customerState} - {invoiceData.customerPincode}</p>
                    <p className="text-stone-600">Place of Supply: {invoiceData.customerState || 'Rajasthan'}</p>
                  </>
                )}
              </div>

            </div>

            {/* 3. ORDER ITEMS TABLE */}
            <div className="border border-stone-300 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-300 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 border-r border-stone-200 text-center w-10">#</th>
                    <th className="p-2.5 border-r border-stone-200">Description of Goods</th>
                    <th className="p-2.5 border-r border-stone-200 text-center w-16">HSN</th>
                    <th className="p-2.5 border-r border-stone-200 text-center w-16">Qty</th>
                    <th className="p-2.5 border-r border-stone-200 text-right w-24">Gross (₹)</th>
                    <th className="p-2.5 text-right w-28">Total Amount (₹)</th>
                    {isEditing && <th className="p-2.5 text-center w-12 no-print">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {invoiceData.items.map((item, index) => {
                    const lineTotal = Number(item.unitPrice) * Number(item.quantity);
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30">
                        <td className="p-2.5 border-r border-stone-200 text-center font-bold text-stone-500">
                          {index + 1}
                        </td>

                        {/* Description */}
                        <td className="p-2.5 border-r border-stone-200">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                className="w-full border border-stone-300 p-1 text-xs font-bold"
                              />
                              <div className="flex gap-2 items-center">
                                <span className="text-[10px] text-stone-500">Size:</span>
                                <input
                                  type="text"
                                  value={item.size}
                                  onChange={(e) => handleUpdateItem(item.id, 'size', e.target.value)}
                                  className="border border-stone-300 p-0.5 text-xs w-20"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-stone-900">{item.name}</p>
                              <p className="text-[10px] text-stone-500">
                                Size: <strong className="text-stone-700">{item.size}</strong> • Women Ethnic Wear
                              </p>
                            </div>
                          )}
                        </td>

                        {/* HSN */}
                        <td className="p-2.5 border-r border-stone-200 text-center font-mono text-[11px] text-stone-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleUpdateItem(item.id, 'hsn', e.target.value)}
                              className="w-14 border border-stone-300 text-center p-0.5"
                            />
                          ) : (
                            item.hsn
                          )}
                        </td>

                        {/* Qty */}
                        <td className="p-2.5 border-r border-stone-200 text-center font-bold text-stone-800">
                          {isEditing ? (
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                              className="w-12 border border-stone-300 text-center p-0.5"
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>

                        {/* Unit Price */}
                        <td className="p-2.5 border-r border-stone-200 text-right font-medium">
                          {isEditing ? (
                            <input
                              type="number"
                              min={1}
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                              className="w-20 border border-stone-300 text-right p-0.5"
                            />
                          ) : (
                            `₹${Number(item.unitPrice).toLocaleString('en-IN')}`
                          )}
                        </td>

                        {/* Total */}
                        <td className="p-2.5 text-right font-extrabold text-stone-950">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </td>

                        {/* Delete in edit mode */}
                        {isEditing && (
                          <td className="p-2.5 text-center no-print">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete row"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add row button in edit mode */}
              {isEditing && (
                <div className="p-2 bg-stone-50 border-t border-stone-200 text-center no-print">
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-1 bg-stone-800 text-white rounded text-xs font-bold flex items-center gap-1 mx-auto hover:bg-stone-900"
                  >
                    <Plus size={13} />
                    <span>Add Another Item Row</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. BILL TOTALS & AMOUNT IN WORDS */}
            <div className="grid grid-cols-12 gap-4 mb-4 items-start">
              
              {/* Left Column: Words & Tax Details */}
              <div className="col-span-7 space-y-2.5 border border-stone-200 p-3 rounded-lg bg-stone-50/40">
                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Amount In Words:</p>
                  <p className="font-serif font-bold text-stone-900 text-xs italic">
                    {amountInWords}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-600 space-y-0.5">
                  <p className="font-bold text-stone-700">Tax Breakdown (5% GST Included):</p>
                  <div className="flex justify-between text-stone-500 text-[10px]">
                    <span>• Taxable Value (Net): ₹{netAmountBeforeGst.toLocaleString('en-IN')}</span>
                    <span>• CGST (2.5%): ₹{Math.round(gstAmount / 2).toLocaleString('en-IN')}</span>
                    <span>• SGST (2.5%): ₹{Math.round(gstAmount / 2).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {invoiceData.notes && (
                  <div className="pt-1 text-[11px] text-stone-600">
                    <strong>Special Note:</strong> {invoiceData.notes}
                  </div>
                )}
              </div>

              {/* Right Column: Calculations Breakdown */}
              <div className="col-span-5 border border-stone-300 p-3 rounded-lg bg-stone-50 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-700">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Discount / Promo:</span>
                    <span>-₹{discountTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-700">
                  <span>Shipping & Handling:</span>
                  <span className="text-emerald-700 font-bold">
                    {shippingAmount === 0 ? 'FREE' : `₹${shippingAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="flex justify-between text-stone-700">
                  <span>GST Amount (5% Incl.):</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-extrabold text-stone-950 pt-2 border-t-2 border-stone-800">
                  <span>Grand Total:</span>
                  <span className="font-serif">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>

            {/* 5. INVOICE FOOTER, TERMS & SIGNATURE */}
            <div className="pt-4 border-t-2 border-stone-800 grid grid-cols-12 gap-4 items-end">
              
              {/* Terms & Verification */}
              <div className="col-span-7 space-y-1 text-[10px] text-stone-600 leading-tight">
                <p className="font-bold uppercase tracking-wider text-stone-800">Terms & Conditions:</p>
                <p className="whitespace-pre-line text-stone-500">{invoiceData.terms}</p>
                
                <div className="flex items-center gap-4 pt-2">
                  <div className="p-1 border border-stone-300 rounded bg-white">
                    <QrCode size={42} className="text-stone-800" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 text-[11px]">Official Tax Invoice Verification</p>
                    <p className="text-stone-500">Scan QR to verify authentic merchant record • 100% Original</p>
                  </div>
                </div>
              </div>

              {/* Authorized Signatory Box */}
              <div className="col-span-5 text-right space-y-1 flex flex-col items-end">
                <p className="text-[10px] text-stone-600 mb-1">
                  For <strong>{invoiceData.companyName}</strong>
                </p>

                {/* Realistic Dynamic Signature & Stamp Seal */}
                <SignatureSeal 
                  companyName={invoiceData.companyName}
                  signatoryName="Pawan Kumar (Proprietor)"
                  isEditing={isEditing}
                />
              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM HELPER STRIP */}
        <div className="no-print bg-white p-3 border-t border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600 px-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Official Amazon / Flipkart Tax Invoice format compliant with GST and Indian Retail standards.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 royal-maroon-bg text-gold-100 rounded-lg text-xs font-bold"
          >
            Close Invoice
          </button>
        </div>

      </div>
    </div>
  );
};
