# DEVLOG: RubyFarm - Sistem Manajemen Peternakan Kelinci

> **Reminder SOP (4D-SAVE):**
> 1. **D**evlog First (Baca ini dulu)
> 2. **D**efinition/Bridge (Paham Teori vs Praktek?)
> 3. **D**iscuss Plan (Sudah setuju alurnya?)
> 4. **D**ebug Sherlock (Hipotesis dulu!)
> 5. **S**AVE Deep Context (`/checkpoint` kalau chat mulai error)

---

## 📊 Project Status Overview
| Modul | Status | Notes |
|-------|--------|-------|
| Authentication | ✅ Complete | Email/Password login, manual registration |
| Dashboard | ✅ Complete | Stats cards, breeding calendar |
| Livestock (Indukan) | ✅ Complete | CRUD, breeding tab, status management |
| Offspring (Anakan) | ✅ Complete | Auto-generated from breeding, status lifecycle |
| Kandang | ✅ Complete | Block grouping, occupancy tracking |
| Finance | ✅ Complete | Income/expense, category breakdown |
| Inventory | ✅ Complete | Equipment + Feed purchases |
| Settings | ✅ Complete | Breeds, Feed Types, Finance Categories |
| Mobile UI | ✅ Complete | Responsive card layouts |

---

## 📅 Log Entry: 2025-12-15 🕒 18:00 - 19:30 JST
**Fokus Hari Ini:** Mobile UI Responsiveness Fixes

### 1. 🌉 The Bridge (Pelajaran Hari Ini)
* **Teori:** *Responsive Design* - UI harus adaptif terhadap berbagai ukuran layar (mobile, tablet, desktop).
* **Praktek:** Di React + TailwindCSS, kita pakai *breakpoint prefix* seperti `sm:`, `md:`, `lg:` untuk conditional styling.
* **Trade-off:** Card layout lebih mudah di-tap di mobile, tapi tabel lebih efisien menampilkan data di desktop.
* **Vocab:** *Responsive Design, Breakpoints, Mobile-First, Touch Targets*.

### 2. 📝 Rangkuman Eksekusi
* ✅ Fixed: `InventoryPage.tsx` - Equipment & Feed tables now use card layout on mobile
* ✅ Fixed: `SettingsBreedsPage.tsx` - Card layout for breeds list
* ✅ Fixed: `SettingsFeedTypesPage.tsx` - Card layout with unit badge
* ✅ Fixed: `SettingsFinanceCategoriesPage.tsx` - Card layout with type icons
* ✅ Fixed: `LivestockPage.tsx` - Card layout + separated status dropdown from row click
* ✅ Fixed: `OffspringPage.tsx` - Card layout + separated status dropdown from row click

### 3. 🔍 Detail Pengerjaan (Klik untuk Membuka)
<details>
<summary><strong>Klik disini untuk melihat Log Lengkap (Step-by-Step)</strong></summary>

> **Masalah Awal:**
> - Tables dengan `px-6` padding terlalu lebar untuk mobile
> - Status dropdown di dalam clickable row menyebabkan konflik klik
> - Data terpotong dan tidak bisa dibaca di layar kecil
>
> **Solusi yang Diterapkan:**
> 1. Pattern: Mobile Card View (`sm:hidden`) + Desktop Table View (`hidden sm:table`)
> 2. Reduced padding: `px-6` → `px-4` untuk tabel desktop
> 3. `onClick={(e) => e.stopPropagation()}` untuk dropdown agar tidak trigger row click
>
> **Kode Pattern:**
> ```tsx
> {/* Mobile Card View */}
> <div className="sm:hidden divide-y divide-gray-200">
>     {items.map((item) => (
>         <div key={item.id} className="p-4">
>             {/* Card content */}
>         </div>
>     ))}
> </div>
> 
> {/* Desktop Table View */}
> <table className="hidden sm:table min-w-full">
>     {/* Table content */}
> </table>
> ```
>
> **Commits:**
> - `fb48479` - fix: improve mobile UI with responsive card layouts
> - `021c896` - fix: add mobile card layouts for LivestockPage and OffspringPage

</details>

---

## 📅 Log Entry: 2025-12-14 🕒 14:00 - 14:30 JST
**Fokus:** Manual Registration Database Error Fix

### 1. 🌉 The Bridge
* **Teori:** *Database Constraints* - Primary key dan foreign key menjaga integritas data.
* **Praktek:** Error "duplicate key" biasanya karena id collision atau RLS policy issue.
* **Vocab:** *Primary Key, Foreign Key, Row Level Security (RLS)*.

### 2. 📝 Rangkuman Eksekusi
* ✅ Fixed: Manual registration flow
* ✅ Investigated database error messages

---

## 📅 Log Entry: 2025-12-14 🕒 12:00 - 13:30 JST
**Fokus:** Debugging Google OAuth Login

### 1. 🌉 The Bridge
* **Teori:** *OAuth 2.0* - Protokol autentikasi yang memungkinkan login via third-party (Google).
* **Praktek:** Supabase handles OAuth flow, tapi redirect URI harus exact match.
* **Vocab:** *OAuth, Redirect URI, Callback URL, Access Token*.

### 2. 📝 Rangkuman Eksekusi
* ✅ Configured Google OAuth in Supabase
* ✅ Fixed redirect URI mismatch
* ✅ Implemented proper callback handling

---

## 🚨 Known Issues & Backlog

### High Priority
- [ ] None currently

### Medium Priority
- [ ] Add pagination for large data tables
- [ ] Implement offline support / caching
- [ ] Add data export (CSV/Excel)

### Low Priority
- [ ] Dark mode support
- [ ] Multi-language support (i18n)
- [ ] Push notifications for breeding reminders

---

## 📁 File Structure Reference
```
src/
├── components/
│   ├── livestock/
│   │   ├── LivestockAddForm.tsx
│   │   ├── LivestockDetailModal.tsx
│   │   └── BreedingTab.tsx
│   ├── offspring/
│   │   ├── OffspringAddForm.tsx
│   │   └── OffspringDetailModal.tsx
│   ├── kandang/
│   │   └── KandangAddForm.tsx
│   ├── finance/
│   │   └── FinanceForm.tsx
│   └── shared/
│       ├── StatusDropdown.tsx
│       └── BatchSellForm.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── LivestockPage.tsx
│   ├── OffspringPage.tsx
│   ├── KandangPage.tsx
│   ├── FinancePage.tsx
│   ├── InventoryPage.tsx
│   ├── SettingsBreedsPage.tsx
│   ├── SettingsFeedTypesPage.tsx
│   └── SettingsFinanceCategoriesPage.tsx
├── hooks/
│   └── useQueries.ts (React Query hooks)
├── contexts/
│   └── AuthContext.tsx
└── lib/
    └── supabase.ts
```
