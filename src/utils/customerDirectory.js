import { idbGet, idbSet } from './indexedDBStorage';
import { getSupabase } from './supabaseClient';

const CUSTOMERS_KEY = 'aura_kurti_customers_v2';

/**
 * Gets all stored customer leads
 */
export const getStoredCustomers = () => {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load customer directory", e);
  }
  return [];
};

/**
 * Saves customer directory array to storage
 */
export const saveStoredCustomers = (customers) => {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (e) {
    console.warn("Customer directory storage warning", e);
  }
  idbSet(CUSTOMERS_KEY, customers);
};

/**
 * Record or update customer delivery info
 * @param {object} customerData - { name, phone, address, city, pincode, paymentMethod }
 * @param {object} orderDetails - { orderId, amount, items, channel, date }
 */
export const recordCustomerLead = (customerData = {}, orderDetails = null) => {
  if (!customerData || (!customerData.name && !customerData.phone)) return;

  const current = getStoredCustomers();
  const cleanPhone = String(customerData.phone || '').replace(/[^\d+]/g, '').trim();
  const customerId = cleanPhone ? `cust-${cleanPhone}` : `cust-${Date.now()}`;

  const existingIndex = current.findIndex(c => 
    (cleanPhone && c.phone && c.phone.replace(/[^\d+]/g, '') === cleanPhone) ||
    (c.name && customerData.name && c.name.toLowerCase().trim() === customerData.name.toLowerCase().trim() && c.pincode === customerData.pincode)
  );

  const now = new Date().toISOString();
  let updatedRecord;

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    const orderHistory = existing.orderHistory || [];
    
    if (orderDetails) {
      orderHistory.unshift({
        orderId: orderDetails.orderId || `ORD-${Date.now()}`,
        amount: Number(orderDetails.amount || 0),
        itemsCount: Array.isArray(orderDetails.items) ? orderDetails.items.length : 1,
        itemsSummary: Array.isArray(orderDetails.items) 
          ? orderDetails.items.map(i => `${i.name} (x${i.quantity || 1})`).join(', ') 
          : 'Apparel',
        date: orderDetails.date || now,
        status: orderDetails.status || 'Order Inquired'
      });
    }

    const totalOrders = (existing.totalOrders || 0) + (orderDetails ? 1 : 0);
    const totalSpent = (existing.totalSpent || 0) + (orderDetails ? Number(orderDetails.amount || 0) : 0);

    updatedRecord = {
      ...existing,
      name: customerData.name || existing.name,
      phone: customerData.phone || existing.phone,
      address: customerData.address || existing.address,
      city: customerData.city || customerData.cityState || existing.city,
      pincode: customerData.pincode || existing.pincode,
      preferredPayment: customerData.paymentMethod || existing.preferredPayment || 'COD',
      totalOrders,
      totalSpent,
      lastActiveAt: now,
      orderHistory: orderHistory.slice(0, 20)
    };

    current[existingIndex] = updatedRecord;
  } else {
    // New customer profile
    const orderHistory = [];
    if (orderDetails) {
      orderHistory.push({
        orderId: orderDetails.orderId || `ORD-${Date.now()}`,
        amount: Number(orderDetails.amount || 0),
        itemsCount: Array.isArray(orderDetails.items) ? orderDetails.items.length : 1,
        itemsSummary: Array.isArray(orderDetails.items) 
          ? orderDetails.items.map(i => `${i.name} (x${i.quantity || 1})`).join(', ') 
          : 'Apparel',
        date: orderDetails.date || now,
        status: orderDetails.status || 'Order Inquired'
      });
    }

    updatedRecord = {
      id: customerId,
      name: customerData.name || 'Boutique Customer',
      phone: customerData.phone || '',
      address: customerData.address || '',
      city: customerData.city || customerData.cityState || '',
      pincode: customerData.pincode || '',
      preferredPayment: customerData.paymentMethod || 'COD',
      totalOrders: orderDetails ? 1 : 0,
      totalSpent: orderDetails ? Number(orderDetails.amount || 0) : 0,
      createdAt: now,
      lastActiveAt: now,
      orderHistory
    };

    current.unshift(updatedRecord);
  }

  saveStoredCustomers(current);

  // Background cloud sync to Supabase
  try {
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('customers').upsert({
        id: updatedRecord.id,
        name: updatedRecord.name,
        phone: updatedRecord.phone,
        address: updatedRecord.address,
        city: updatedRecord.city,
        pincode: updatedRecord.pincode,
        total_orders: updatedRecord.totalOrders,
        total_spent: updatedRecord.totalSpent,
        last_active_at: updatedRecord.lastActiveAt
      }, { onConflict: 'id' }).catch(() => {});
    }
  } catch {}

  return updatedRecord;
};

/**
 * Delete a customer lead from directory
 */
export const deleteCustomerLead = (id) => {
  const current = getStoredCustomers();
  const updated = current.filter(c => c.id !== id);
  saveStoredCustomers(updated);

  try {
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('customers').delete().eq('id', id).catch(() => {});
    }
  } catch {}
};

/**
 * Export Customer Directory to standard CSV format
 */
export const exportCustomersToCSV = () => {
  const customers = getStoredCustomers();
  if (customers.length === 0) return;

  const headers = ['Customer Name', 'Phone Number', 'Delivery Address', 'City / State', 'Pincode', 'Payment Mode', 'Total Orders', 'Total Spent (INR)', 'Last Active'];
  const rows = customers.map(c => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.city || '').replace(/"/g, '""')}"`,
    `"${(c.pincode || '').replace(/"/g, '""')}"`,
    `"${c.preferredPayment || 'COD'}"`,
    c.totalOrders || 0,
    c.totalSpent || 0,
    `"${c.lastActiveAt ? new Date(c.lastActiveAt).toLocaleDateString('en-IN') : ''}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Radhika_Boutique_Customer_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
