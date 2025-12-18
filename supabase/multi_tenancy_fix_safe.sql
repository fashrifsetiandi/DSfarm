-- ============================================
-- RUBY FARM - SAFE MULTI-TENANCY FIX
-- Run this script in Supabase SQL Editor
-- This script only fixes settings tables (Breeds, Finance Categories, Feed Types)
-- and handles cases where constraints may or may not exist.
-- ============================================

-- 1. Settings: Breeds - Fix duplicate breed_code issue
DO $$
BEGIN
    -- Try to drop the old global unique constraint
    ALTER TABLE settings_breeds DROP CONSTRAINT IF EXISTS settings_breeds_breed_code_key;
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Constraint settings_breeds_breed_code_key does not exist, skipping...';
END $$;

-- Check if the new constraint already exists before creating
DO $$
BEGIN
    -- Try to create the new user-scoped unique constraint
    ALTER TABLE settings_breeds ADD CONSTRAINT unique_breed_code_per_user UNIQUE (user_id, breed_code);
    RAISE NOTICE 'Created unique_breed_code_per_user constraint on settings_breeds';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint unique_breed_code_per_user already exists on settings_breeds, skipping...';
    WHEN undefined_column THEN
        RAISE NOTICE 'Column user_id or breed_code does not exist on settings_breeds, skipping...';
END $$;

-- 2. Settings: Finance Categories
DO $$
BEGIN
    ALTER TABLE settings_finance_categories DROP CONSTRAINT IF EXISTS settings_finance_categories_category_code_key;
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Constraint settings_finance_categories_category_code_key does not exist, skipping...';
END $$;

DO $$
BEGIN
    ALTER TABLE settings_finance_categories ADD CONSTRAINT unique_category_code_per_user UNIQUE (user_id, category_code);
    RAISE NOTICE 'Created unique_category_code_per_user constraint on settings_finance_categories';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint unique_category_code_per_user already exists, skipping...';
    WHEN undefined_column THEN
        RAISE NOTICE 'Column user_id or category_code does not exist, skipping...';
END $$;

-- 3. Settings: Feed Types
DO $$
BEGIN
    ALTER TABLE settings_feed_types DROP CONSTRAINT IF EXISTS settings_feed_types_feed_code_key;
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Constraint settings_feed_types_feed_code_key does not exist, skipping...';
END $$;

DO $$
BEGIN
    ALTER TABLE settings_feed_types ADD CONSTRAINT unique_feed_code_per_user UNIQUE (user_id, feed_code);
    RAISE NOTICE 'Created unique_feed_code_per_user constraint on settings_feed_types';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint unique_feed_code_per_user already exists, skipping...';
    WHEN undefined_column THEN
        RAISE NOTICE 'Column user_id or feed_code does not exist, skipping...';
END $$;

-- ============================================
-- DONE! 
-- Breed codes like "NZW" can now be used by multiple users.
-- ============================================
SELECT 'Multi-tenancy fix for settings tables completed successfully!' as result;
