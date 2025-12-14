-- ============================================
-- RUBY FARM - COMPLETE DATABASE SETUP
-- Run this file ONCE in Supabase SQL Editor
-- ============================================

-- Drop existing tables if any (clean slate)
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS feed_usage CASCADE;
DROP TABLE IF EXISTS feed_purchases CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS offspring CASCADE;
DROP TABLE IF EXISTS births CASCADE;
DROP TABLE IF EXISTS livestock CASCADE;
DROP TABLE IF EXISTS kandang CASCADE;
DROP TABLE IF EXISTS settings_feed_types CASCADE;
DROP TABLE IF EXISTS settings_finance_categories CASCADE;
DROP TABLE IF EXISTS settings_breeds CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop functions if exist
DROP FUNCTION IF EXISTS get_ancestors CASCADE;
DROP FUNCTION IF EXISTS get_siblings CASCADE;
DROP FUNCTION IF EXISTS calculate_inbreeding_coefficient CASCADE;

-- ============================================
-- STEP 1: CREATE TABLES (schema.sql)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Settings: Breeds
CREATE TABLE settings_breeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    breed_code VARCHAR(10) UNIQUE NOT NULL,
    breed_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Settings: Finance Categories
CREATE TABLE settings_finance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_code VARCHAR(10) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('income', 'expense')) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Settings: Feed Types
CREATE TABLE settings_feed_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feed_code VARCHAR(10) UNIQUE NOT NULL,
    feed_name VARCHAR(100) NOT NULL,
    unit_of_measure VARCHAR(20) CHECK (unit_of_measure IN ('kg', 'sak', 'karung')) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Kandang (Cages)
CREATE TABLE kandang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    kandang_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    capacity INTEGER NOT NULL DEFAULT 10,
    current_occupancy INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Livestock (Indukan)
CREATE TABLE livestock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    livestock_code VARCHAR(30) NOT NULL UNIQUE,
    breed_id UUID REFERENCES settings_breeds(id) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('jantan', 'betina')) NOT NULL,
    birth_date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    kandang_id UUID REFERENCES kandang(id),
    acquisition_date DATE,
    acquisition_source VARCHAR(100),
    acquisition_price DECIMAL(12,2),
    mother_id UUID REFERENCES livestock(id),
    father_id UUID REFERENCES livestock(id),
    generation INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'aktif',
    status_farm VARCHAR(20) DEFAULT 'infarm' CHECK (status_farm IN ('infarm', 'terjual', 'mati')),
    health_status VARCHAR(50) DEFAULT 'sehat',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Births (Breeding Records)
CREATE TABLE births (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    birth_code VARCHAR(30) NOT NULL UNIQUE,
    mother_id UUID REFERENCES livestock(id) NOT NULL,
    father_id UUID REFERENCES livestock(id),
    
    -- Breeding Management Fields
    mating_date DATE,
    palpation_date DATE,
    palpation_result BOOLEAN DEFAULT false,
    
    birth_date DATE NOT NULL,
    total_born INTEGER DEFAULT 0,
    total_alive INTEGER DEFAULT 0,
    total_dead INTEGER DEFAULT 0,
    
    -- Gender breakdown
    male_count INTEGER DEFAULT 0,
    female_count INTEGER DEFAULT 0,
    
    -- Weaning tracking
    weaned_count INTEGER DEFAULT 0,
    male_weaned INTEGER DEFAULT 0,
    female_weaned INTEGER DEFAULT 0,
    weaning_success_rate DECIMAL(5,2),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Offspring (Anakan)
CREATE TABLE offspring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    offspring_code VARCHAR(30) NOT NULL UNIQUE,
    id_anakan VARCHAR(50) UNIQUE,
    birth_id UUID REFERENCES births(id),
    mother_id UUID REFERENCES livestock(id) NOT NULL,
    father_id UUID REFERENCES livestock(id),
    birth_date DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('jantan', 'betina')),
    weight_kg DECIMAL(5,2),
    kandang_id UUID REFERENCES kandang(id),
    generation INTEGER DEFAULT 1,
    weaning_date DATE,
    ready_to_sell_date DATE,
    status_farm VARCHAR(20) DEFAULT 'anakan',
    health_status VARCHAR(50) DEFAULT 'sehat',
    status_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Livestock Growth Logs (Tracking Bobot)
CREATE TABLE livestock_growth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    livestock_id UUID REFERENCES livestock(id) ON DELETE CASCADE NOT NULL,
    measurement_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Livestock Health Records (Catatan Kesehatan)
CREATE TABLE livestock_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    livestock_id UUID REFERENCES livestock(id) ON DELETE CASCADE NOT NULL,
    record_date DATE NOT NULL,
    record_type VARCHAR(20) CHECK (record_type IN ('checkup', 'vaksin', 'sakit', 'pengobatan')) NOT NULL,
    description TEXT NOT NULL,
    treatment TEXT,
    cost DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10a. Offspring Growth Logs (Tracking Bobot Anakan)
CREATE TABLE offspring_growth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    offspring_id UUID REFERENCES offspring(id) ON DELETE CASCADE NOT NULL,
    measurement_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10b. Offspring Health Records (Catatan Kesehatan Anakan)
CREATE TABLE offspring_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    offspring_id UUID REFERENCES offspring(id) ON DELETE CASCADE NOT NULL,
    record_date DATE NOT NULL,
    record_type VARCHAR(20) CHECK (record_type IN ('checkup', 'vaksin', 'sakit', 'pengobatan')) NOT NULL,
    description TEXT NOT NULL,
    treatment TEXT,
    cost DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Financial Transactions
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_code VARCHAR(30) NOT NULL UNIQUE,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('income', 'expense')) NOT NULL,
    category_id UUID REFERENCES settings_finance_categories(id) NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Equipment
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    equipment_code VARCHAR(30) NOT NULL UNIQUE,
    equipment_name VARCHAR(100) NOT NULL,
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    current_value DECIMAL(12,2),
    condition VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Feed Purchases
CREATE TABLE feed_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    purchase_code VARCHAR(30) NOT NULL UNIQUE,
    feed_type_id UUID REFERENCES settings_feed_types(id) NOT NULL,
    purchase_date DATE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2),
    total_price DECIMAL(12,2),
    supplier VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Feed Usage
CREATE TABLE feed_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    usage_code VARCHAR(30) NOT NULL UNIQUE,
    feed_type_id UUID REFERENCES settings_feed_types(id) NOT NULL,
    usage_date DATE NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Push Subscriptions
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: CREATE TRIGGERS (functions.sql)
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_breeds_updated_at BEFORE UPDATE ON settings_breeds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_finance_categories_updated_at BEFORE UPDATE ON settings_finance_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_feed_types_updated_at BEFORE UPDATE ON settings_feed_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kandang_updated_at BEFORE UPDATE ON kandang FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON livestock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_births_updated_at BEFORE UPDATE ON births FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offspring_updated_at BEFORE UPDATE ON offspring FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_livestock_growth_logs_updated_at BEFORE UPDATE ON livestock_growth_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_livestock_health_records_updated_at BEFORE UPDATE ON livestock_health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feed_purchases_updated_at BEFORE UPDATE ON feed_purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feed_usage_updated_at BEFORE UPDATE ON feed_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate codes
CREATE OR REPLACE FUNCTION generate_kandang_code()
RETURNS TRIGGER AS $$
DECLARE
    v_code VARCHAR(30);
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM kandang WHERE user_id = NEW.user_id;
    v_code := 'KDG-A' || LPAD((v_count + 1)::TEXT, 2, '0');
    NEW.kandang_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_kandang_code BEFORE INSERT ON kandang FOR EACH ROW EXECUTE FUNCTION generate_kandang_code();

-- Livestock code generation
CREATE OR REPLACE FUNCTION generate_livestock_code()
RETURNS TRIGGER AS $$
DECLARE
    v_breed_code VARCHAR(10);
    v_gender_prefix VARCHAR(1);
    v_count INTEGER;
    v_code VARCHAR(30);
BEGIN
    SELECT breed_code INTO v_breed_code FROM settings_breeds WHERE id = NEW.breed_id;
    v_gender_prefix := CASE WHEN NEW.gender = 'jantan' THEN 'M' ELSE 'F' END;
    
    SELECT COUNT(*) INTO v_count 
    FROM livestock 
    WHERE user_id = NEW.user_id 
    AND breed_id = NEW.breed_id 
    AND gender = NEW.gender;
    
    v_code := v_breed_code || '-' || v_gender_prefix || LPAD((v_count + 1)::TEXT, 2, '0');
    NEW.livestock_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_livestock_code BEFORE INSERT ON livestock FOR EACH ROW EXECUTE FUNCTION generate_livestock_code();

-- Generation auto-calculate
CREATE OR REPLACE FUNCTION calculate_generation()
RETURNS TRIGGER AS $$
DECLARE
    v_mother_gen INTEGER := 0;
    v_father_gen INTEGER := 0;
BEGIN
    IF NEW.mother_id IS NOT NULL THEN
        SELECT generation INTO v_mother_gen FROM livestock WHERE id = NEW.mother_id;
    END IF;
    IF NEW.father_id IS NOT NULL THEN
        SELECT generation INTO v_father_gen FROM livestock WHERE id = NEW.father_id;
    END IF;
    
    IF v_mother_gen = 0 AND v_father_gen = 0 THEN
        NEW.generation := 1;
    ELSE
        NEW.generation := GREATEST(v_mother_gen, v_father_gen) + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_generation BEFORE INSERT ON livestock FOR EACH ROW EXECUTE FUNCTION calculate_generation();
CREATE TRIGGER set_offspring_generation BEFORE INSERT ON offspring FOR EACH ROW EXECUTE FUNCTION calculate_generation();

-- Birth code
CREATE OR REPLACE FUNCTION generate_birth_code()
RETURNS TRIGGER AS $$
DECLARE
    v_year VARCHAR(4);
    v_count INTEGER;
    v_code VARCHAR(30);
BEGIN
    v_year := TO_CHAR(NEW.birth_date, 'YYYY');
    SELECT COUNT(*) INTO v_count FROM births WHERE user_id = NEW.user_id AND EXTRACT(YEAR FROM birth_date) = EXTRACT(YEAR FROM NEW.birth_date);
    v_code := 'BIRTH-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
    NEW.birth_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_birth_code BEFORE INSERT ON births FOR EACH ROW EXECUTE FUNCTION generate_birth_code();

-- Offspring code
CREATE OR REPLACE FUNCTION generate_offspring_code()
RETURNS TRIGGER AS $$
DECLARE
    v_year VARCHAR(4);
    v_count INTEGER;
    v_code VARCHAR(30);
BEGIN
    v_year := TO_CHAR(NEW.birth_date, 'YYYY');
    SELECT COUNT(*) INTO v_count FROM offspring WHERE user_id = NEW.user_id AND EXTRACT(YEAR FROM birth_date) = EXTRACT(YEAR FROM NEW.birth_date);
    v_code := 'OF-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
    NEW.offspring_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_offspring_code BEFORE INSERT ON offspring FOR EACH ROW EXECUTE FUNCTION generate_offspring_code();

-- ID Anakan generation (CRITICAL!)
CREATE OR REPLACE FUNCTION generate_offspring_id_anakan()
RETURNS TRIGGER AS $$
DECLARE
    v_breed_code VARCHAR(10);
    v_mother_short VARCHAR(10);
    v_father_short VARCHAR(10);
    v_date_str VARCHAR(6);
    v_seq INTEGER;
    v_id_anakan VARCHAR(50);
BEGIN
    -- Get breed code from mother's breed
    SELECT sb.breed_code INTO v_breed_code
    FROM livestock l
    LEFT JOIN settings_breeds sb ON l.breed_id = sb.id
    WHERE l.id = NEW.mother_id;
    
    -- Get short code for mother (last part after last dash, e.g., "F01" from "NZW-F01")
    SELECT 
        CASE 
            WHEN livestock_code LIKE '%-%' THEN SUBSTRING(livestock_code FROM POSITION('-' IN livestock_code) + 1)
            ELSE livestock_code
        END
    INTO v_mother_short 
    FROM livestock WHERE id = NEW.mother_id;
    
    -- Get short code for father
    IF NEW.father_id IS NOT NULL THEN
        SELECT 
            CASE 
                WHEN livestock_code LIKE '%-%' THEN SUBSTRING(livestock_code FROM POSITION('-' IN livestock_code) + 1)
                ELSE livestock_code
            END
        INTO v_father_short 
        FROM livestock WHERE id = NEW.father_id;
    ELSE
        v_father_short := 'UNK';
    END IF;
    
    -- Format: YYMMDD
    v_date_str := TO_CHAR(NEW.birth_date, 'YYMMDD');
    
    -- Get sequence number for this birth
    SELECT COUNT(*) + 1 INTO v_seq
    FROM offspring
    WHERE mother_id = NEW.mother_id
    AND father_id IS NOT DISTINCT FROM NEW.father_id
    AND birth_date = NEW.birth_date;
    
    -- FORMAT: NZW-M01.F01-251203-01 (breed_code-father_short.mother_short-date-seq)
    v_id_anakan := COALESCE(v_breed_code, 'UNK') || '-' || v_father_short || '.' || v_mother_short || '-' || v_date_str || '-' || LPAD(v_seq::TEXT, 2, '0');
    
    NEW.id_anakan := v_id_anakan;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_offspring_id_anakan BEFORE INSERT ON offspring FOR EACH ROW EXECUTE FUNCTION generate_offspring_id_anakan();

-- Transaction code
CREATE OR REPLACE FUNCTION generate_transaction_code()
RETURNS TRIGGER AS $$
DECLARE
    v_year VARCHAR(4);
    v_count INTEGER;
    v_code VARCHAR(30);
BEGIN
    v_year := TO_CHAR(NEW.transaction_date, 'YYYY');
    SELECT COUNT(*) INTO v_count FROM financial_transactions WHERE user_id = NEW.user_id AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM NEW.transaction_date);
    v_code := 'TRX-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
    NEW.transaction_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_code BEFORE INSERT ON financial_transactions FOR EACH ROW EXECUTE FUNCTION generate_transaction_code();

-- Equipment, Feed codes (similar pattern)
CREATE OR REPLACE FUNCTION generate_equipment_code()
RETURNS TRIGGER AS $$
DECLARE v_count INTEGER; v_code VARCHAR(30);
BEGIN
    SELECT COUNT(*) INTO v_count FROM equipment WHERE user_id = NEW.user_id;
    v_code := 'EQP-' || LPAD((v_count + 1)::TEXT, 3, '0');
    NEW.equipment_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_equipment_code BEFORE INSERT ON equipment FOR EACH ROW EXECUTE FUNCTION generate_equipment_code();

CREATE OR REPLACE FUNCTION generate_purchase_code()
RETURNS TRIGGER AS $$
DECLARE v_count INTEGER; v_code VARCHAR(30);
BEGIN
    SELECT COUNT(*) INTO v_count FROM feed_purchases WHERE user_id = NEW.user_id;
    v_code := 'FP-' || LPAD((v_count + 1)::TEXT, 3, '0');
    NEW.purchase_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_purchase_code BEFORE INSERT ON feed_purchases FOR EACH ROW EXECUTE FUNCTION generate_purchase_code();

CREATE OR REPLACE FUNCTION generate_usage_code()
RETURNS TRIGGER AS $$
DECLARE v_count INTEGER; v_code VARCHAR(30);
BEGIN
    SELECT COUNT(*) INTO v_count FROM feed_usage WHERE user_id = NEW.user_id;
    v_code := 'FU-' || LPAD((v_count + 1)::TEXT, 3, '0');
    NEW.usage_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_usage_code BEFORE INSERT ON feed_usage FOR EACH ROW EXECUTE FUNCTION generate_usage_code();

-- ============================================
-- KANDANG OCCUPANCY AUTO-UPDATE TRIGGERS
-- Auto-update current_occupancy when animals are added/moved/removed
-- ============================================

-- Trigger for OFFSPRING table
CREATE OR REPLACE FUNCTION update_kandang_occupancy_on_offspring_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.kandang_id IS NOT NULL THEN
            UPDATE kandang 
            SET current_occupancy = current_occupancy + 1 
            WHERE id = NEW.kandang_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        IF OLD.kandang_id IS DISTINCT FROM NEW.kandang_id THEN
            -- Decrement old kandang
            IF OLD.kandang_id IS NOT NULL THEN
                UPDATE kandang 
                SET current_occupancy = GREATEST(0, current_occupancy - 1) 
                WHERE id = OLD.kandang_id;
            END IF;
            -- Increment new kandang
            IF NEW.kandang_id IS NOT NULL THEN
                UPDATE kandang 
                SET current_occupancy = current_occupancy + 1 
                WHERE id = NEW.kandang_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.kandang_id IS NOT NULL THEN
            UPDATE kandang 
            SET current_occupancy = GREATEST(0, current_occupancy - 1) 
            WHERE id = OLD.kandang_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_offspring_kandang_occupancy
    AFTER INSERT OR UPDATE OR DELETE ON offspring
    FOR EACH ROW
    EXECUTE FUNCTION update_kandang_occupancy_on_offspring_change();

-- Trigger for LIVESTOCK table
CREATE OR REPLACE FUNCTION update_kandang_occupancy_on_livestock_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.kandang_id IS NOT NULL THEN
            UPDATE kandang 
            SET current_occupancy = current_occupancy + 1 
            WHERE id = NEW.kandang_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        IF OLD.kandang_id IS DISTINCT FROM NEW.kandang_id THEN
            -- Decrement old kandang
            IF OLD.kandang_id IS NOT NULL THEN
                UPDATE kandang 
                SET current_occupancy = GREATEST(0, current_occupancy - 1) 
                WHERE id = OLD.kandang_id;
            END IF;
            -- Increment new kandang
            IF NEW.kandang_id IS NOT NULL THEN
                UPDATE kandang 
                SET current_occupancy = current_occupancy + 1 
                WHERE id = NEW.kandang_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.kandang_id IS NOT NULL THEN
            UPDATE kandang 
            SET current_occupancy = GREATEST(0, current_occupancy - 1) 
            WHERE id = OLD.kandang_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_livestock_kandang_occupancy
    AFTER INSERT OR UPDATE OR DELETE ON livestock
    FOR EACH ROW
    EXECUTE FUNCTION update_kandang_occupancy_on_livestock_change();

-- ============================================
-- STEP 3: GENEALOGY FUNCTIONS
-- ============================================

-- Get ancestors (simplified version that works)
CREATE OR REPLACE FUNCTION get_ancestors(
    target_id UUID,
    max_generations INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    code VARCHAR,
    gender VARCHAR,
    generation INTEGER,
    relationship VARCHAR,
    is_livestock BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE family_tree AS (
        -- Base: target offspring or livestock
        SELECT 
            o.id,
            o.id_anakan as code,
            o.gender,
            0 as gen,
            'self'::VARCHAR as rel,
            false as is_livestock
        FROM offspring o
        WHERE o.id = target_id
        
        UNION ALL
        
        -- Recursive: get parents
        SELECT 
            l.id,
            l.livestock_code as code,
            l.gender,
            ft.gen + 1,
            CASE 
                WHEN l.gender = 'betina' THEN 'mother'
                ELSE 'father'
            END,
            true
        FROM family_tree ft
        JOIN offspring o ON o.id = ft.id
        JOIN livestock l ON (l.id = o.mother_id OR l.id = o.father_id)
        WHERE ft.gen < max_generations
    )
    SELECT * FROM family_tree;
END;
$$ LANGUAGE plpgsql;

-- Get siblings
CREATE OR REPLACE FUNCTION get_siblings(target_id UUID)
RETURNS TABLE (
    id UUID,
    code VARCHAR,
    gender VARCHAR,
    birth_date DATE,
    is_full_sibling BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.id_anakan as code,
        o.gender,
        o.birth_date,
        (o.mother_id = t.mother_id AND o.father_id = t.father_id) as is_full_sibling
    FROM offspring o
    CROSS JOIN (SELECT mother_id, father_id FROM offspring WHERE id = target_id) t
    WHERE o.id != target_id
    AND (o.mother_id = t.mother_id OR o.father_id = t.father_id);
END;
$$ LANGUAGE plpgsql;

-- Calculate inbreeding (simplified)
CREATE OR REPLACE FUNCTION calculate_inbreeding_coefficient(
    mother_id UUID,
    father_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
    coefficient DECIMAL := 0.0;
BEGIN
    -- Simplified: return 0 for now (can be enhanced later)
    RETURN coefficient;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_feed_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE kandang ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE births ENABLE ROW LEVEL SECURITY;
ALTER TABLE offspring ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock_growth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies (user can only see their own data)
CREATE POLICY user_profiles_policy ON user_profiles FOR ALL USING (id = auth.uid());
CREATE POLICY settings_breeds_policy ON settings_breeds FOR ALL USING (user_id = auth.uid());
CREATE POLICY settings_finance_categories_policy ON settings_finance_categories FOR ALL USING (user_id = auth.uid());
CREATE POLICY settings_feed_types_policy ON settings_feed_types FOR ALL USING (user_id = auth.uid());
CREATE POLICY kandang_policy ON kandang FOR ALL USING (user_id = auth.uid());
CREATE POLICY livestock_policy ON livestock FOR ALL USING (user_id = auth.uid());
CREATE POLICY births_policy ON births FOR ALL USING (user_id = auth.uid());
CREATE POLICY offspring_policy ON offspring FOR ALL USING (user_id = auth.uid());
CREATE POLICY livestock_growth_logs_policy ON livestock_growth_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY livestock_health_records_policy ON livestock_health_records FOR ALL USING (user_id = auth.uid());
CREATE POLICY financial_transactions_policy ON financial_transactions FOR ALL USING (user_id = auth.uid());
CREATE POLICY equipment_policy ON equipment FOR ALL USING (user_id = auth.uid());
CREATE POLICY feed_purchases_policy ON feed_purchases FOR ALL USING (user_id = auth.uid());
CREATE POLICY feed_usage_policy ON feed_usage FOR ALL USING (user_id = auth.uid());
CREATE POLICY push_subscriptions_policy ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- ============================================
-- ✅ DATABASE SETUP COMPLETE!
-- ============================================
-- You should now have:
-- - 15 tables created
-- - 17+ triggers for auto-generation
-- - 3 genealogy functions
-- - RLS enabled with policies
-- ============================================
-- 
-- OPTIONAL: DUMMY DATA (scroll down)
-- The section below contains sample data for testing.
-- You can run it or skip it based on your needs.
-- ============================================


-- ================================================================
-- 100% MATCHED with complete_setup.sql schema
-- Run this AFTER running complete_setup.sql
-- ================================================================

DO $$
DECLARE
    v_user_id UUID;
    
    -- Settings IDs
    v_breed_nzw UUID;
    v_breed_rex UUID;
    v_breed_flemish UUID;
    v_cat_pakan UUID;
    v_cat_obat UUID;
    v_cat_perawatan UUID;
    v_cat_penjualan UUID;
    v_feed_pelet UUID;
    v_feed_rumput UUID;
    v_feed_konsentrat UUID;
    
    -- Core IDs
    v_kandang_a1 UUID;
    v_kandang_a2 UUID;
    v_kandang_b1 UUID;
    v_livestock_pejantan1 UUID;
    v_livestock_betina1 UUID;
    v_livestock_betina2 UUID;
    v_livestock_betina3 UUID;
    v_birth1 UUID;
    v_birth2 UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found! Please register first.';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Inserting Dummy Data...';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE '========================================';
    
    -- ============================================
    -- 1. SETTINGS: BREEDS
    -- ============================================
    INSERT INTO settings_breeds (user_id, breed_code, breed_name, description) VALUES
    (v_user_id, 'NZW', 'New Zealand White', 'Ras putih, daging berkualitas tinggi')
    RETURNING id INTO v_breed_nzw;
    
    INSERT INTO settings_breeds (user_id, breed_code, breed_name, description) VALUES
    (v_user_id, 'REX', 'Rex', 'Bulu halus, cocok untuk fur')
    RETURNING id INTO v_breed_rex;
    
    INSERT INTO settings_breeds (user_id, breed_code, breed_name, description) VALUES
    (v_user_id, 'FG', 'Flemish Giant', 'Ras raksasa, 7-10kg')
    RETURNING id INTO v_breed_flemish;
    
    RAISE NOTICE '✓ 3 Breeds';
    
    -- ============================================
    -- 2. SETTINGS: FINANCE CATEGORIES
    -- ============================================
    INSERT INTO settings_finance_categories (user_id, category_code, category_name, transaction_type, description) VALUES
    (v_user_id, 'PAKAN', 'Pakan & Konsentrat', 'expense', 'Pembelian pakan kelinci')
    RETURNING id INTO v_cat_pakan;
    
    INSERT INTO settings_finance_categories (user_id, category_code, category_name, transaction_type, description) VALUES
    (v_user_id, 'OBAT', 'Obat & Vitamin', 'expense', 'Obat dan suplemen')
    RETURNING id INTO v_cat_obat;
    
    INSERT INTO settings_finance_categories (user_id, category_code, category_name, transaction_type, description) VALUES
    (v_user_id, 'PRWT', 'Perawatan', 'expense', 'Maintenance kandang')
    RETURNING id INTO v_cat_perawatan;
    
    INSERT INTO settings_finance_categories (user_id, category_code, category_name, transaction_type, description) VALUES
    (v_user_id, 'JUAL', 'Penjualan', 'income', 'Hasil penjualan')
    RETURNING id INTO v_cat_penjualan;
    
    RAISE NOTICE '✓ 4 Finance Categories';
    
    -- ============================================
    -- 3. SETTINGS: FEED TYPES
    -- ============================================
    INSERT INTO settings_feed_types (user_id, feed_code, feed_name, unit_of_measure, description) VALUES
    (v_user_id, 'PLT', 'Pelet Komersial', 'kg', 'Pakan pelet siap pakai')
    RETURNING id INTO v_feed_pelet;
    
    INSERT INTO settings_feed_types (user_id, feed_code, feed_name, unit_of_measure, description) VALUES
    (v_user_id, 'RMP', 'Rumput Gajah', 'kg', 'Hijauan segar')
    RETURNING id INTO v_feed_rumput;
    
    INSERT INTO settings_feed_types (user_id, feed_code, feed_name, unit_of_measure, description) VALUES
    (v_user_id, 'KON', 'Konsentrat BR1', 'kg', 'Konsentrat premium')
    RETURNING id INTO v_feed_konsentrat;
    
    RAISE NOTICE '✓ 3 Feed Types';
    
    -- ============================================
    -- 4. KANDANG (CAGES)
    -- ============================================
    INSERT INTO kandang (user_id, kandang_code, name, location, capacity, current_occupancy, description) VALUES
    (v_user_id, 'A-01', 'Kandang Indukan A1', 'Blok A, Baris 1', 4, 2, 'Untuk indukan betina')
    RETURNING id INTO v_kandang_a1;
    
    INSERT INTO kandang (user_id, kandang_code, name, location, capacity, current_occupancy, description) VALUES
    (v_user_id, 'A-02', 'Kandang Indukan A2', 'Blok A, Baris 2', 4, 1, 'Untuk indukan betina')
    RETURNING id INTO v_kandang_a2;
    
    INSERT INTO kandang (user_id, kandang_code, name, location, capacity, current_occupancy, description) VALUES
    (v_user_id, 'B-01', 'Kandang Pejantan B1', 'Blok B, Baris 1', 2, 1, 'Khusus pejantan')
    RETURNING id INTO v_kandang_b1;
    
    RAISE NOTICE '✓ 3 Kandang';
    
    -- ============================================
    -- 5. LIVESTOCK (INDUKAN)
    -- ============================================
    INSERT INTO livestock (
        user_id, breed_id, gender, birth_date, weight_kg,
        kandang_id, status, status_farm, health_status, generation, notes
    ) VALUES (
        v_user_id, v_breed_nzw, 'jantan', '2023-01-15', 3.8,
        v_kandang_b1, 'pejantan_aktif', 'infarm', 'sehat', 1, 'Pejantan unggul, produktif'
    ) RETURNING id INTO v_livestock_pejantan1;
    
    INSERT INTO livestock (
        user_id, breed_id, gender, birth_date, weight_kg,
        kandang_id, status, status_farm, health_status, generation, notes
    ) VALUES (
        v_user_id, v_breed_nzw, 'betina', '2023-02-20', 3.5,
        v_kandang_a1, 'siap_kawin', 'infarm', 'sehat', 1, 'Indukan betina produktif'
    ) RETURNING id INTO v_livestock_betina1;
    
    INSERT INTO livestock (
        user_id, breed_id, gender, birth_date, weight_kg,
        kandang_id, status, status_farm, health_status, generation, notes
    ) VALUES (
        v_user_id, v_breed_rex, 'betina', '2023-03-10', 3.6,
        v_kandang_a1, 'bunting', 'infarm', 'sehat', 1, 'Bunting usia 2 minggu'
    ) RETURNING id INTO v_livestock_betina2;
    
    INSERT INTO livestock (
        user_id, breed_id, gender, birth_date, weight_kg,
        kandang_id, status, status_farm, health_status, generation, notes
    ) VALUES (
        v_user_id, v_breed_flemish, 'betina', '2022-11-05', 4.5,
        v_kandang_a2, 'menyusui', 'infarm', 'sehat', 1, 'Baru melahirkan 9 anakan'
    ) RETURNING id INTO v_livestock_betina3;
    
    RAISE NOTICE '✓ 4 Livestock (1 jantan, 3 betina)';
    
    -- ============================================
    -- 6. BIRTHS (KELAHIRAN)
    -- ============================================
    INSERT INTO births (
        user_id, birth_code, mother_id, father_id, birth_date,
        total_born, total_alive, total_dead, notes
    ) VALUES (
        v_user_id, 'B-241101', v_livestock_betina3, v_livestock_pejantan1, '2024-11-01',
        9, 9, 0, 'Kelahiran normal, semua anakan sehat'
    ) RETURNING id INTO v_birth1;
    
    INSERT INTO births (
        user_id, birth_code, mother_id, father_id, birth_date,
        total_born, total_alive, total_dead, notes
    ) VALUES (
        v_user_id, 'B-240910', v_livestock_betina1, v_livestock_pejantan1, '2024-09-10',
        8, 8, 0, 'Kelahiran lancar, induk dan anak dalam kondisi baik'
    ) RETURNING id INTO v_birth2;
    
    RAISE NOTICE '✓ 2 Births';
    
    -- ============================================
    -- 7. OFFSPRING (ANAKAN)
    -- ============================================
    -- Offspring dari Birth 1 (9 anakan, masih nursing)
    INSERT INTO offspring (
        user_id, birth_id, mother_id, father_id, birth_date, gender,
        weight_kg, kandang_id, status_farm, health_status
    ) VALUES 
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'jantan', 0.8, v_kandang_a2, 'anakan', 'sehat'),
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'betina', 0.75, v_kandang_a2, 'anakan', 'sehat'),
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'jantan', 0.82, v_kandang_a2, 'anakan', 'sehat'),
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'betina', 0.78, v_kandang_a2, 'anakan', 'sehat'),
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'jantan', 0.85, v_kandang_a2, 'anakan', 'sehat'),
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'betina', 0.77, v_kandang_a2, 'anakan', 'sehat'),
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'jantan', 0.80, v_kandang_a2, 'anakan', 'sehat'),
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'betina', 0.76, v_kandang_a2, 'anakan', 'sehat'),
    (v_user_id, v_birth1, v_livestock_betina3, v_livestock_pejantan1, '2024-11-01', 'jantan', 0.83, v_kandang_a2, 'anakan', 'sehat');
    
    -- Offspring dari Birth 2 (8 anakan, sudah pertumbuhan/weaned)
    INSERT INTO offspring (
        user_id, birth_id, mother_id, father_id, birth_date, gender,
        weight_kg, kandang_id, weaning_date, status_farm, health_status
    ) VALUES 
    (v_user_id, v_birth2, v_livestock_betina1, v_livestock_pejantan1, '2024-09-10', 'jantan', 2.1, v_kandang_a1, '2024-11-05', 'pertumbuhan', 'sehat'),
    (v_user_id, v_birth2, v_livestock_betina1, v_livestock_pejantan1, '2024-09-10', 'betina', 2.0, v_kandang_a1, '2024-11-05', 'pertumbuhan', 'sehat'),
    (v_user_id, v_birth2, v_livestock_betina1, v_livestock_pejantan1, '2024-09-10', 'jantan', 2.2, v_kandang_a1, '2024-11-05', 'siap_jual', 'sehat'),
    (v_user_id, v_birth2, v_livestock_betina1, v_livestock_pejantan1, '2024-09-10', 'betina', 2.0, v_kandang_a1, '2024-11-05', 'pertumbuhan', 'sehat'),
    (v_user_id, v_birth2, v_livestock_betina1, v_livestock_pejantan1, '2024-09-10', 'jantan', 2.3, v_kandang_a1, '2024-11-05', 'siap_jual', 'sehat'),
    (v_user_id, v_birth2, v_livestock_betina1, v_livestock_pejantan1, '2024-09-10', 'betina', 1.9, v_kandang_a1, '2024-11-05', 'pertumbuhan', 'sehat'),
    (v_user_id, v_birth2, v_livestock_betina1, v_livestock_pejantan1, '2024-09-10', 'jantan', 2.2, v_kandang_a1, '2024-11-05', 'siap_jual', 'sehat'),
    (v_user_id, v_birth2, v_livestock_betina1, v_livestock_pejantan1, '2024-09-10', 'betina', 2.1, v_kandang_a1, '2024-11-05', 'pertumbuhan', 'sehat');
    
    RAISE NOTICE '✓ 17 Offspring (9 anakan + 8 pertumbuhan)';
    
    -- ============================================
    -- 8. LIVESTOCK GROWTH LOGS (Tracking Bobot)
    -- ============================================
    -- Growth logs for Pejantan 1
    INSERT INTO livestock_growth_logs (user_id, livestock_id, measurement_date, weight_kg, notes) VALUES
    (v_user_id, v_livestock_pejantan1, '2023-01-15', 1.2, 'Bobot lahir'),
    (v_user_id, v_livestock_pejantan1, '2023-02-15', 2.0, 'Pertumbuhan normal bulan pertama'),
    (v_user_id, v_livestock_pejantan1, '2023-03-15', 2.8, 'Mulai diberi konsentrat'),
    (v_user_id, v_livestock_pejantan1, '2023-04-15', 3.4, 'Mencapai bobot dewasa'),
    (v_user_id, v_livestock_pejantan1, '2024-01-15', 3.8, 'Bobot stabil, kondisi prima');
    
    -- Growth logs for Betina 1
    INSERT INTO livestock_growth_logs (user_id, livestock_id, measurement_date, weight_kg, notes) VALUES
    (v_user_id, v_livestock_betina1, '2023-02-20', 1.1, 'Bobot lahir'),
    (v_user_id, v_livestock_betina1, '2023-03-20', 1.8, 'Pertumbuhan baik'),
    (v_user_id, v_livestock_betina1, '2023-04-20', 2.6, 'Fase pertumbuhan cepat'),
    (v_user_id, v_livestock_betina1, '2024-01-20', 3.5, 'Bobot ideal betina dewasa');
    
    -- Growth logs for Betina 2
    INSERT INTO livestock_growth_logs (user_id, livestock_id, measurement_date, weight_kg, notes) VALUES
    (v_user_id, v_livestock_betina2, '2023-03-10', 1.3, 'Bobot lahir'),
    (v_user_id, v_livestock_betina2, '2023-04-10', 1.9, 'Pertumbuhan normal'),
    (v_user_id, v_livestock_betina2, '2023-05-10', 2.5, 'Fase pertumbuhan aktif'),
    (v_user_id, v_livestock_betina2, '2024-10-01', 3.6, 'Bobot saat bunting, naik normal');
    
    -- Growth logs for Betina 3
    INSERT INTO livestock_growth_logs (user_id, livestock_id, measurement_date, weight_kg, notes) VALUES
    (v_user_id, v_livestock_betina3, '2022-11-05', 1.2, 'Bobot lahir'),
    (v_user_id, v_livestock_betina3, '2023-01-05', 2.0, 'Pertumbuhan baik di 2 bulan'),
    (v_user_id, v_livestock_betina3, '2023-03-05', 2.8, 'Bobot mendekati dewasa'),
    (v_user_id, v_livestock_betina3, '2024-10-01', 4.2, 'Bobot sebelum melahirkan'),
    (v_user_id, v_livestock_betina3, '2024-11-15', 4.5, 'Bobot setelah melahirkan, sedang menyusui');
    
    RAISE NOTICE '✓ 18 Growth Logs';
    
    -- ============================================
    -- 9. LIVESTOCK HEALTH RECORDS (Catatan Kesehatan)
    -- ============================================
    -- Health  records for Pejantan 1
    INSERT INTO livestock_health_records (user_id, livestock_id, record_date, record_type, description, treatment, cost) VALUES
    (v_user_id, v_livestock_pejantan1, '2023-02-01', 'vaksin', 'Vaksinasi rutin pertama', 'Vaksin RHD + Myxomatosis', 40000),
    (v_user_id, v_livestock_pejantan1, '2023-08-01', 'vaksin', 'Vaksinasi booster 6 bulan', 'Vaksin RHD + Myxomatosis', 40000),
    (v_user_id, v_livestock_pejantan1, '2024-02-01', 'vaksin', 'Vaksinasi tahunan', 'Vaksin RHD + Myxomatosis', 45000),
    (v_user_id, v_livestock_pejantan1, '2024-05-15', 'checkup', 'Pemeriksaan rutin kesehatan reproduksi', 'Tidak ada masalah, kondisi prima', 25000);
    
    -- Health records for Betina 1
    INSERT INTO livestock_health_records (user_id, livestock_id, record_date, record_type, description, treatment, cost) VALUES
    (v_user_id, v_livestock_betina1, '2023-03-01', 'vaksin', 'Vaksinasi pertama', 'Vaksin RHD + Myxomatosis', 40000),
    (v_user_id, v_livestock_betina1, '2023-09-01', 'vaksin', 'Vaksinasi booster', 'Vaksin RHD + Myxomatosis', 40000),
    (v_user_id, v_livestock_betina1, '2024-03-01', 'checkup', 'Pemeriksaan kesehatan umum', 'Kondisi sehat, siap kawin', 20000);
    
    -- Health records for Betina 2
    INSERT INTO livestock_health_records (user_id, livestock_id, record_date, record_type, description, treatment, cost) VALUES
    (v_user_id, v_livestock_betina2, '2023-04-05', 'vaksin', 'Vaksinasi pertama', 'Vaksin RHD + Myxomatosis', 40000),
    (v_user_id, v_livestock_betina2, '2023-10-05', 'vaksin', 'Vaksinasi booster', 'Vaksin RHD + Myxomatosis', 40000),
    (v_user_id, v_livestock_betina2, '2024-10-01', 'checkup', 'Pemeriksaan kebuntingan', 'Kondisi bunting normal, estimasi lahir 2 minggu', 30000);
    
    -- Health records for Betina 3
    INSERT INTO livestock_health_records (user_id, livestock_id, record_date, record_type, description, treatment, cost) VALUES
    (v_user_id, v_livestock_betina3, '2022-12-01', 'vaksin', 'Vaksinasi pertama', 'Vaksin RHD + Myxomatosis', 35000),
    (v_user_id, v_livestock_betina3, '2023-06-01', 'vaksin', 'Vaksinasi booster', 'Vaksin RHD + Myxomatosis', 40000),
    (v_user_id, v_livestock_betina3, '2024-09-05', 'checkup', 'Pemeriksaan pra-kelahiran', 'Kondisi baik, siap melahirkan', 25000),
    (v_user_id, v_livestock_betina3, '2024-11-01', 'checkup', 'Pemeriksaan pasca-kelahiran', 'Kelahiran 9 anakan, induk dan anak sehat', 30000),
    (v_user_id, v_livestock_betina3, '2024-07-10', 'sakit', 'Diare ringan', 'Probiotik + pengurangan pakan hijau', 45000);
    
    RAISE NOTICE '✓ 15 Health Records';
    
    -- ============================================
    -- 10. FINANCIAL TRANSACTIONS
    -- ============================================
    INSERT INTO financial_transactions (user_id, category_id, transaction_date, transaction_type, amount, description) VALUES
    (v_user_id, v_cat_pakan, '2024-11-01', 'expense', 500000, 'Beli pelet 50kg'),
    (v_user_id, v_cat_pakan, '2024-11-15', 'expense', 300000, 'Beli rumput 100kg'),
    (v_user_id, v_cat_obat, '2024-11-05', 'expense', 150000, 'Vitamin & suplemen'),
    (v_user_id, v_cat_obat, '2024-10-20', 'expense', 200000, 'Vaksinasi'),
    (v_user_id, v_cat_perawatan, '2024-10-10', 'expense', 250000, 'Perbaikan kandang A-02'),
    (v_user_id, v_cat_penjualan, '2024-11-20', 'income', 1200000, 'Jual 4 anakan @ 300rb'),
    (v_user_id, v_cat_penjualan, '2024-10-25', 'income', 2000000, 'Jual indukan betina'),
    (v_user_id, v_cat_penjualan, '2024-11-10', 'income', 900000, 'Jual 3 anakan @ 300rb');
    
    RAISE NOTICE '✓ 8 Financial Transactions (5 expense, 3 income)';
    
    -- ============================================
    -- 11. FEED PURCHASES
    -- ============================================
    INSERT INTO feed_purchases (user_id, feed_type_id, purchase_date, quantity, unit_price, total_price, supplier, notes) VALUES
    (v_user_id, v_feed_pelet, '2024-11-01', 50.0, 10000, 500000, 'Toko Pakan Jaya', 'Pelet kualitas premium'),
    (v_user_id, v_feed_rumput, '2024-11-15', 100.0, 3000, 300000, 'Petani Lokal', 'Rumput segar'),
    (v_user_id, v_feed_konsentrat, '2024-10-20', 25.0, 12000, 300000, 'Distributor BR1', 'Konsentrat BR1 premium');
    
    RAISE NOTICE '✓ 3 Feed Purchases';
    
    -- ============================================
    -- SUMMARY
    -- ============================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DUMMY DATA INSERTION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- 3 Breeds';
    RAISE NOTICE '- 4 Finance Categories';
    RAISE NOTICE '- 3 Feed Types';
    RAISE NOTICE '- 3 Kandang';
    RAISE NOTICE '- 4 Livestock (Indukan)';
    RAISE NOTICE '- 2 Births';
    RAISE NOTICE '- 17 Offspring (Anakan)';
    RAISE NOTICE '- 18 Growth Logs';
    RAISE NOTICE '- 15 Health Records';
    RAISE NOTICE '- 8 Financial Transactions';
    RAISE NOTICE '- 3 Feed Purchases';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TOTAL: 80 records inserted';
    RAISE NOTICE 'Now REFRESH your browser!';
    RAISE NOTICE '========================================';

EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'ERROR: Duplicate data detected!';
        RAISE NOTICE 'Some data already exists. Please run delete_all_data.sql first.';
        RAISE;
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: %', SQLERRM;
        RAISE;
END $$;
