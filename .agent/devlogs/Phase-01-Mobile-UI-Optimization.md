# PHASE 01: Mobile UI Optimization (iPhone 12 Mini)
**Status:** ✅ Completed

> **🔗 Previous Context:**
> *Project RubyFarm sudah berjalan dengan fitur dasar lengkap (Livestock, Offspring, Finance, Inventory). Sekarang fokus optimasi UI untuk device mobile, khususnya iPhone 12 Mini (375px viewport).*

---

## 🎓 Apa yang Kita Bangun?

**Mobile UI Optimization** adalah proses menyesuaikan tampilan aplikasi agar responsif dan mudah digunakan pada layar kecil (375px), termasuk perbaikan layout, interaksi touch, dan visual hierarchy.

---

## 📅 Session 1: 2025-12-16 (~3 jam)

### 🚦 Status Tracker

| Status | Komponen | Penjelasan Simpel |
|--------|----------|-------------------|
| ✅ Done | **Summary Cards Redesign** | Horizontal scroll cards on mobile, grid on desktop |
| ✅ Done | **Mobile Card Layout** | Compact 2-row design dengan status inline |
| ✅ Done | **StatusDropdown Fix** | Opens upward when near bottom of screen |
| ✅ Done | **Safari iOS Touch** | Fixed touch event handling issues |
| ✅ Done | **Livestock Sale Bug** | Fixed status not updating to "terjual" |
| ✅ Done | **Transaction Sorting** | Newest first + NEW badge for 1 minute |
| ✅ Done | **Modal Scroll Lock** | Prevent background scrolling when modal is open |
| ✅ Done | **Promoted Display** | Show original offspring ID for promoted livestock |
| ✅ Done | **Batch Sell Offspring** | Fix missing "Siap Jual" items in batch sell list |

---

### 🌉 Bridge Notes (Pelajaran)

#### 1. Responsive Breakpoints
> **🎓 Teori:** CSS menggunakan "breakpoints" untuk mengubah layout berdasarkan lebar layar. Mobile-first approach mulai dari screen terkecil.
> 
> **💼 Praktek:** Kita tambah custom breakpoint `xs: 375px` di Tailwind untuk target iPhone 12 Mini secara spesifik.
>
> **🇺🇸 Keyword:** *Breakpoints, Mobile-First, Viewport*

#### 2. Touch Event Handling (iOS Safari)
> **🎓 Teori:** Browser memiliki default "touch behaviors" seperti scroll, zoom. `preventDefault()` bisa memblokir ini.
> 
> **💼 Praktek:** Safari iOS memerlukan `touch-action: manipulation` dan kita TIDAK boleh call `preventDefault()` pada container karena akan memblokir scroll.
>
> **🇺🇸 Keyword:** *Touch Events, Event Propagation, stopPropagation*

#### 3. Client-Side vs Server-Side Status
> **🎓 Teori:** Kadang logic bisnis (seperti status "Siap Jual" berdasarkan umur) dihitung di Frontend (Client-side), tapi Database (Server-side) menyimpan status statis.
> 
> **💼 Praktek:** Kita buat utility function `getOffspringStatus` untuk sinkronisasi logic perhitungan umur di Frontend dengan query Database, agar data yang tampil konsisten.
>
> **🇺🇸 Keyword:** *Business Logic, Client-Side Calculation, Data Consistency*

---

### 🔍 Bugs & Fixes

<details>
<summary><strong>Klik untuk lihat error yang kita temui</strong></summary>

**Bug 1: Livestock Sale Status Not Updating**
```
When selling livestock, status remained "infarm" instead of changing to "terjual"
```
- **Penyebab:** `BatchSellForm.tsx` menggunakan `status_farm` untuk semua ternak, tapi tabel livestock pakai kolom `status`
- **Fix:** Conditionally update kolom `status` untuk livestock dan `status_farm` untuk offspring

**Bug 2: StatusDropdown Cutoff at Bottom**
```
Dropdown menu terputus ketika item berada di bagian bawah layar
```
- **Penyebab:** Menu selalu open downward, tidak cek space yang tersedia
- **Fix:** Calculate space above/below, open upward jika space below tidak cukup

**Bug 3: Safari iOS Touch Issues**
```
Buttons on Safari iOS tidak respond ke tap dengan benar
```
- **Penyebab:** CSS `min-height: 44px` rule terlalu broad + preventDefault blocking scroll
- **Fix:** Remove broad rule, add `touch-action: manipulation`, use stopPropagation instead

**Bug 4: Background Scrolled with Modal Open**
```
User could scroll the page behind the modal
```
- **Penyebab:** Default browser behavior tidak mengunci `body` scroll.
- **Fix:** Created `useScrollLock` hook to fix `body` position and overflow.

**Bug 5: Missing Offspring in Batch Sell**
```
"Siap Jual" items missing from Batch Sell list
```
- **Penyebab:** Query DB cari string "siap_jual" padahal status itu computed by age di frontend.
- **Fix:** Fetch all infarm offspring and filter using `getOffspringStatus` utility.

</details>

---

## 📁 File yang Dimodifikasi

```
src/
├── pages/
│   ├── LivestockPage.tsx    # Summary cards + compact mobile layout
│   ├── OffspringPage.tsx    # Summary cards + compact mobile layout
│   └── FinancePage.tsx      # Transaction sorting + NEW badge
├── components/
│   ├── shared/
│   │   ├── StatusDropdown.tsx   # Upward positioning + Safari fixes
│   │   └── BatchSellForm.tsx    # Fixed livestock status & offspring query
│   ├── livestock/
│   │   ├── GrowthLogForm.tsx    # Scroll lock + compact style
│   │   ├── HealthRecordForm.tsx # Scroll lock + compact style
│   │   └── BreedingRecordForm.tsx # Scroll lock + compact style
│   └── offspring/
│       └── OffspringGrowthLogForm.tsx # Scroll lock + compact style
├── hooks/
│   └── useScrollLock.ts         # New hook for modal scroll locking
├── utils/
│   └── dateUtils.ts             # Added getOffspringStatus helper
└── index.css                    # Removed problematic min-height rule

tailwind.config.js               # Added xs: 375px breakpoint
```

---

## 🔮 Rencana Selanjutnya (Phase 02)

| Prioritas | Task | Deskripsi |
|-----------|------|-----------|
| 1 | **Testing on Real Device** | Test semua fitur di iPhone 12 Mini asli |
| 2 | **Performance Optimization** | Lazy loading, bundle size optimization |
| 3 | **PWA Features** | Offline support, push notifications |

---

## 🚀 Git Commits (Fase Ini)

| Commit | Message |
|--------|---------|
| `a6cd620` | fix: Safari iOS touch compatibility |
| `2718f78` | style: improve mobile card design |
| `8bf2198` | style: redesign summary cards with horizontal scroll |
| `4b47b4f` | fix: StatusDropdown opens upward when near bottom |
| `dc861b2` | style: compact 2-row mobile cards with inline status |
| `9a03e58` | fix: BatchSellForm now updates correct status column |
| `74a9325` | feat: sort transactions by created_at and add NEW badge |
| `78c732d` | fix: add scroll lock to modals and improve mobile form styling |
| `266b5a8` | style: show only offspring ID or breed name, not both |
| `daac403` | fix: sync batch sell offspring query with age-based status |
| `2b3d83d` | fix: prevent horizontal scroll on modals (iPhone 12 mini issue) |
| `09d3ab0` | fix: prevent horizontal scroll on offspring modals (iPhone 12 mini) |

---

## 📅 Session 2: 2025-12-18 (~30 menit)

### 🚦 Status Tracker

| Status | Komponen | Penjelasan Simpel |
|--------|----------|-------------------|
| ✅ Done | **Modal Horizontal Scroll** | Fix modal bisa digeser horizontal di iPhone 12 Mini |

---

### 🌉 Bridge Notes (Pelajaran)

#### 4. iOS Elastic Scrolling (Rubber Banding)
> **🎓 Teori:** iOS Safari memiliki fitur "elastic scrolling" dimana content bisa di-drag melebihi batas scroll. Ini bisa menyebabkan horizontal scroll pada elemen yang seharusnya tidak bisa di-scroll.
> 
> **💼 Praktek:** Kita tambahkan `overflow-hidden` pada modal overlay dan `overflow-x-hidden` pada modal content, plus `overscroll-behavior: contain` untuk mencegah elastic scrolling.
>
> **🇺🇸 Keyword:** *Overflow Hidden, Overscroll Behavior, Elastic Scrolling*

---

### 🔍 Bugs & Fixes

<details>
<summary><strong>Klik untuk lihat error yang kita temui</strong></summary>

**Bug 6: Modal Horizontal Scroll on iPhone 12 Mini**
```
Modal form bisa digeser horizontal, menyebabkan content terpotong di sisi kiri
```
- **Penyebab:** Tidak ada `overflow-hidden` pada modal container, iOS elastic scrolling behavior
- **Fix:** 
  - Add `overflow-hidden` to modal overlay
  - Add `overflow-x-hidden` to modal content
  - Add global CSS rules with `overscroll-behavior: contain`
  - Applied to 10 modal components (Indukan + Anakan forms)

</details>

---

## 🚀 Cara Jalankan

```bash
# Development server
npm run dev

# Build for production
npm run build

# Deploy (auto via Vercel on push to main)
git push origin main
```
