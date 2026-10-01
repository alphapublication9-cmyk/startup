import { createClient } from '@supabase/supabase-js';

// SOURCE DATABASE (Current Supabase)
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL || 'https://kzjfxhevbgthcwaceyml.supabase.co';
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY || 'sb_publishable_pyP-vHhudmH1SvCS26ggBQ_qjDCyIJp';

// TARGET DATABASE (New Supabase) - Pass as arguments or set environment variables
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL || process.argv[2];
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_KEY || process.argv[3];

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_KEY) {
  console.log(`
❌ Usage:
  node scripts/cloneDatabase.js <NEW_SUPABASE_URL> <NEW_SUPABASE_ANON_KEY>

Example:
  node scripts/cloneDatabase.js https://xyz.supabase.co eyJhbGciOi...
`);
  process.exit(1);
}

const sourceDb = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const targetDb = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

const tables = ['categories', 'products', 'settings', 'coupons', 'reviews', 'orders'];

async function cloneTable(tableName) {
  console.log(`🔄 Copying table "${tableName}"...`);
  const { data, error } = await sourceDb.from(tableName).select('*');
  if (error) {
    console.error(`⚠️ Failed to fetch from ${tableName}:`, error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.log(`ℹ️ Table "${tableName}" is empty in source DB.`);
    return;
  }

  const { error: insertError } = await targetDb.from(tableName).upsert(data, { onConflict: 'id' });
  if (insertError) {
    console.error(`❌ Failed to insert into new DB table "${tableName}":`, insertError.message);
  } else {
    console.log(`✅ Successfully copied ${data.length} records into "${tableName}".`);
  }
}

async function cloneAll() {
  console.log(`🚀 Starting Database Clone:`);
  console.log(`   Source: ${OLD_SUPABASE_URL}`);
  console.log(`   Target: ${NEW_SUPABASE_URL}\n`);

  for (const table of tables) {
    await cloneTable(table);
  }

  console.log(`\n🎉 ALL DATA CLONED SUCCESSFULLY TO NEW DATABASE!`);
}

cloneAll().catch(console.error);
