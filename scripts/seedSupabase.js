import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS, DEFAULT_CATEGORIES } from '../src/data/initialProducts.js';
import { INITIAL_SETTINGS } from '../src/data/initialSettings.js';
import { INITIAL_COUPONS, INITIAL_REVIEWS } from '../src/data/initialCoupons.js';

const SUPABASE_URL = 'https://kzjfxhevbgthcwaceyml.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pyP-vHhudmH1SvCS26ggBQ_qjDCyIJp';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  console.log('🚀 Connecting to Supabase and seeding initial store data...');

  // 1. Seed Categories
  console.log(`📂 Seeding ${DEFAULT_CATEGORIES.length} categories...`);
  const categoryRows = DEFAULT_CATEGORIES.map(c => ({
    id: String(c.id || c.name),
    name: c.name,
    icon: c.icon || '👗',
    image: c.image || null,
    offer: c.offer || null,
    description: c.description || null
  }));
  const { error: catErr } = await supabase.from('categories').upsert(categoryRows, { onConflict: 'id' });
  if (catErr) console.error('❌ Category seed error:', catErr);
  else console.log('✅ Categories seeded successfully.');

  // 2. Seed Products
  console.log(`👗 Seeding ${INITIAL_PRODUCTS.length} products...`);
  const productRows = INITIAL_PRODUCTS.map(p => ({
    id: String(p.id),
    name: p.name,
    category: p.category,
    price: p.price,
    original_price: p.originalPrice || null,
    image: p.image,
    images: p.images || [p.image],
    sizes: p.sizes || ['S', 'M', 'L', 'XL'],
    fabric: p.fabric || null,
    color: p.color || null,
    badge: p.badge || null,
    offer: p.offer || null,
    in_stock: p.inStock !== false,
    rating: p.rating || 4.9,
    reviews_count: p.reviewsCount || 42,
    description: p.description || null
  }));
  const { error: prodErr } = await supabase.from('products').upsert(productRows, { onConflict: 'id' });
  if (prodErr) console.error('❌ Products seed error:', prodErr);
  else console.log('✅ Products seeded successfully.');

  // 3. Seed Settings
  console.log('⚙️ Seeding store settings...');
  const { error: setErr } = await supabase.from('settings').upsert({
    id: 'store_config',
    data: INITIAL_SETTINGS,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
  if (setErr) console.error('❌ Settings seed error:', setErr);
  else console.log('✅ Settings seeded successfully.');

  // 4. Seed Coupons
  console.log(`🏷️ Seeding ${INITIAL_COUPONS.length} coupons...`);
  const couponRows = INITIAL_COUPONS.map(c => ({
    id: String(c.id || c.code),
    code: c.code,
    discount_type: c.discountType,
    discount_value: c.discountValue,
    min_order_amount: c.minOrderAmount || 0,
    description: c.description || null,
    is_active: c.isActive !== false
  }));
  const { error: cpnErr } = await supabase.from('coupons').upsert(couponRows, { onConflict: 'id' });
  if (cpnErr) console.error('❌ Coupons seed error:', cpnErr);
  else console.log('✅ Coupons seeded successfully.');

  // 5. Seed Reviews
  console.log(`⭐ Seeding ${INITIAL_REVIEWS.length} reviews...`);
  const reviewRows = INITIAL_REVIEWS.map(r => ({
    id: String(r.id),
    name: r.name,
    city: r.city || '',
    rating: r.rating || 5,
    date: r.date || 'Recent',
    product_name: r.productName || '',
    comment: r.comment || '',
    verified_buyer: r.verifiedBuyer !== false
  }));
  const { error: revErr } = await supabase.from('reviews').upsert(reviewRows, { onConflict: 'id' });
  if (revErr) console.error('❌ Reviews seed error:', revErr);
  else console.log('✅ Reviews seeded successfully.');

  console.log('\n🎉 ALL STORE DATA SUCCESSFULLY SYNCED TO SUPABASE CLOUD DATABASE!');
}

seed().catch(console.error);
