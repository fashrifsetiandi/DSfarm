# PHASE 05: Multi-Tenancy Bug Fix
**Status:** 🟡 In Progress
**Date:** 2025-12-19

> **🔗 Context:**
> *Melanjutkan dari Phase 04. Ditemukan bug dimana kode ras (breed_code) seperti "NZW" bersifat globally unique, sehingga jika akun A membuat "NZW", akun B tidak bisa membuat "NZW" juga.*

---

## 🧠 Bridge Notes (Learning Journal)

### 1. Multi-Tenancy Data Isolation
> **🎓 Teori:** Multi-tenancy adalah arsitektur dimana satu aplikasi melayani banyak pengguna (tenant) dengan data yang terisolasi. Constraint UNIQUE harus di-scope per tenant, bukan global.
> 
> **💼 Praktek:** Di PostgreSQL, kita ubah `UNIQUE(breed_code)` menjadi `UNIQUE(user_id, breed_code)` agar setiap user bisa punya kode yang sama secara independen.
>
> **🇺🇸 Keywords:** *Multi-Tenancy, Composite Unique Key, Row Level Security (RLS)*

---

## 📋 Task Checklist (Traffic Light)

- [x] **Fix Breed Code Uniqueness**
  - *Why:* Agar tiap user bisa membuat kode ras yang sama (e.g. "NZW") tanpa konflik
  - [x] Buat SQL script `multi_tenancy_fix_safe.sql`
  - [x] Update `complete_setup.sql` dengan user-scoped UNIQUE constraints
  - [ ] Jalankan script di Supabase SQL Editor
  - [ ] Verifikasi 2 akun berbeda bisa buat "NZW"

---

## 🐛 Bugs & Fixes

<details>
<summary><strong>Klik untuk lihat riwayat error</strong></summary>

**Issue 1:** Breed code duplikasi antar akun
- **Cause:** Tabel `settings_breeds` memiliki constraint `breed_code VARCHAR(10) UNIQUE NOT NULL` yang bersifat global
- **Expected Behavior:** Tiap akun bisa punya breed code yang sama secara independen
- **Solution:** Mengubah constraint menjadi `UNIQUE(user_id, breed_code)` via SQL script

**Issue 2:** Script multi_tenancy_fix.sql gagal
- **Error:** `column "livestock_code" named in key does not exist`
- **Cause:** Database production memiliki skema berbeda dari `complete_setup.sql`
- **Solution:** Buat `multi_tenancy_fix_safe.sql` yang hanya memperbaiki 3 tabel settings

</details>

---

## 📁 File yang Dimodifikasi

```
supabase/
└── multi_tenancy_fix_safe.sql   # NEW - Safe SQL fix script
```

---

## 🛡️ Verification (Definition of Done)

1. [ ] **Manual Test:** Buat breed "NZW" dengan 2 akun berbeda
2. [ ] **Console Check:** Tidak ada error saat insert breed
3. [ ] **Database Check:** Verify constraint di Supabase Table Editor

---

## 🚀 SQL Script untuk Dijalankan

```sql
-- Fix untuk Settings: Breeds
ALTER TABLE settings_breeds DROP CONSTRAINT IF EXISTS settings_breeds_breed_code_key;
ALTER TABLE settings_breeds ADD CONSTRAINT unique_breed_code_per_user UNIQUE (user_id, breed_code);

-- Fix untuk Settings: Finance Categories
ALTER TABLE settings_finance_categories DROP CONSTRAINT IF EXISTS settings_finance_categories_category_code_key;
ALTER TABLE settings_finance_categories ADD CONSTRAINT unique_category_code_per_user UNIQUE (user_id, category_code);

-- Fix untuk Settings: Feed Types
ALTER TABLE settings_feed_types DROP CONSTRAINT IF EXISTS settings_feed_types_feed_code_key;
ALTER TABLE settings_feed_types ADD CONSTRAINT unique_feed_code_per_user UNIQUE (user_id, feed_code);
```

---

## 🚀 Git Commits (Fase Ini)

| Commit | Message |
|--------|---------|
| `fe2bb1b` | fix: add safe multi-tenancy SQL fix script for breed codes |
| `17f1a07` | fix: update complete_setup.sql with user-scoped UNIQUE constraints for multi-tenancy |
