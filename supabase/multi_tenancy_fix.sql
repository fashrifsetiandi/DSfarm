-- ============================================
-- RUBY FARM - MULTI-TENANCY FIX
-- Run this script in Supabase SQL Editor to fix "Duplicate Key" errors across different accounts.
-- This changes unique constraints from Global (e.g. "NZW" exists anywhere) 
-- to User-Scoped (e.g. "NZW" is unique only for specific user).
-- ============================================

-- 1. Settings: Breeds
ALTER TABLE settings_breeds DROP CONSTRAINT IF EXISTS settings_breeds_breed_code_key;
ALTER TABLE settings_breeds ADD CONSTRAINT unique_breed_code_per_user UNIQUE (user_id, breed_code);

-- 2. Settings: Finance Categories
ALTER TABLE settings_finance_categories DROP CONSTRAINT IF EXISTS settings_finance_categories_category_code_key;
ALTER TABLE settings_finance_categories ADD CONSTRAINT unique_category_code_per_user UNIQUE (user_id, category_code);

-- 3. Settings: Feed Types
ALTER TABLE settings_feed_types DROP CONSTRAINT IF EXISTS settings_feed_types_feed_code_key;
ALTER TABLE settings_feed_types ADD CONSTRAINT unique_feed_code_per_user UNIQUE (user_id, feed_code);

-- 4. Kandang
ALTER TABLE kandang DROP CONSTRAINT IF EXISTS kandang_kandang_code_key;
ALTER TABLE kandang ADD CONSTRAINT unique_kandang_code_per_user UNIQUE (user_id, kandang_code);

-- 5. Livestock
ALTER TABLE livestock DROP CONSTRAINT IF EXISTS livestock_livestock_code_key;
ALTER TABLE livestock ADD CONSTRAINT unique_livestock_code_per_user UNIQUE (user_id, livestock_code);

-- 6. Births
ALTER TABLE births DROP CONSTRAINT IF EXISTS births_birth_code_key;
ALTER TABLE births ADD CONSTRAINT unique_birth_code_per_user UNIQUE (user_id, birth_code);

-- 7. Offspring
ALTER TABLE offspring DROP CONSTRAINT IF EXISTS offspring_offspring_code_key;
ALTER TABLE offspring ADD CONSTRAINT unique_offspring_code_per_user UNIQUE (user_id, offspring_code);

-- Note: id_anakan might be globally unique in original design, but better scoped too
ALTER TABLE offspring DROP CONSTRAINT IF EXISTS offspring_id_anakan_key;
ALTER TABLE offspring ADD CONSTRAINT unique_id_anakan_per_user UNIQUE (user_id, id_anakan);

-- 8. Financial Transactions
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_transaction_code_key;
ALTER TABLE financial_transactions ADD CONSTRAINT unique_transaction_code_per_user UNIQUE (user_id, transaction_code);

-- 9. Equipment
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_equipment_code_key;
ALTER TABLE equipment ADD CONSTRAINT unique_equipment_code_per_user UNIQUE (user_id, equipment_code);

-- 10. Feed Purchases
ALTER TABLE feed_purchases DROP CONSTRAINT IF EXISTS feed_purchases_purchase_code_key;
ALTER TABLE feed_purchases ADD CONSTRAINT unique_purchase_code_per_user UNIQUE (user_id, purchase_code);

-- 11. Feed Usage
ALTER TABLE feed_usage DROP CONSTRAINT IF EXISTS feed_usage_usage_code_key;
ALTER TABLE feed_usage ADD CONSTRAINT unique_usage_code_per_user UNIQUE (user_id, usage_code);

-- 12. Push Subscriptions (Already unique per endpoint, but let's check setup)
-- endpoint TEXT NOT NULL UNIQUE -> This should technically stay global because the endpoint URL is unique to the browser/device.
-- No change needed for push_subscriptions.

-- ============================================
-- CHECK: Verify RLS is enabled (Safe check)
-- ============================================
ALTER TABLE settings_breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_feed_types ENABLE ROW LEVEL SECURITY;
-- (and so on, usually enabled, but good to ensure)
