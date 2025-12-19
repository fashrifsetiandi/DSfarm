# PHASE 06: Offline-First Infrastructure
**Status:** 🟢 Complete (Infrastructure)
**Date:** 2025-12-19

> **🔗 Context:**
> *User melaporkan kegagalan input data di lokasi kandang dengan koneksi terbatas. Implementasi offline-first agar data bisa disimpan lokal dan sync ke Supabase saat online.*

---

## 🧠 Bridge Notes (Learning Journal)

### 1. IndexedDB dengan Dexie.js
> **🎓 Teori:** IndexedDB adalah database NoSQL browser-based yang memungkinkan penyimpanan data lokal dalam jumlah besar. Dexie.js adalah wrapper yang menyederhanakan API IndexedDB.
> 
> **💼 Praktek:** Dexie digunakan untuk membuat `sync_queue` (antrian operasi offline) dan `cached_data` (cache data untuk offline reads).
>
> **🇺🇸 Keywords:** *IndexedDB, Dexie.js, Offline Storage, Local-First*

### 2. Background Sync Pattern
> **🎓 Teori:** Background Sync memungkinkan web app melakukan network request di background saat koneksi tersedia, bahkan jika user sudah meninggalkan halaman.
> 
> **💼 Praktek:** Operasi yang gagal karena offline di-queue ke IndexedDB. Hook `useOnlineStatus` mendeteksi saat online dan trigger `processQueue()` untuk sync.
>
> **🇺🇸 Keywords:** *Background Sync, Queue Processing, Network Detection*

---

## 📋 Task Checklist (Traffic Light)

- [x] **Core Infrastructure**
  - [x] Install Dexie.js
  - [x] Setup IndexedDB schema (`dexie.ts`)
  - [x] Implement offline sync manager (`offlineSync.ts`)
  - [x] Implement connection status hook (`useOnlineStatus.ts`)
  - [x] Create useMutation hook (`useMutations.ts`)
  - [x] Create SyncStatusIndicator component

- [x] **Integration**
  - [x] Add OfflineBanner to App.tsx
  - [x] Add Toaster (sonner) to App.tsx
  - [x] Add SyncStatusIndicator to Navbar
  - [x] Initialize sync on app load

- [ ] **Form Refactoring** (Future Phase)
  - [ ] Refactor simple forms to use useMutation
  - [ ] Handle complex chained inserts

---

## 📁 File yang Dimodifikasi/Dibuat

```
src/
├── lib/
│   ├── dexie.ts          # NEW - IndexedDB setup
│   └── offlineSync.ts    # NEW - Sync manager
├── hooks/
│   ├── useOnlineStatus.ts   # NEW - Connection detection
│   └── useMutations.ts      # NEW - Offline-aware mutations
├── components/
│   └── shared/
│       └── SyncStatusIndicator.tsx  # NEW - UI indicator
├── App.tsx               # MODIFIED - Added OfflineBanner, Toaster
└── components/layout/
    └── Navbar.tsx        # MODIFIED - Added SyncStatusIndicator
```

---

## 🛡️ Verification (Definition of Done)

1. [x] **Build Check:** `npm run build` passes
2. [x] **Type Check:** No TypeScript errors
3. [ ] **Manual Test:** Test offline input (future)
4. [ ] **Manual Test:** Test background sync (future)

---

## 🚀 Usage Guide

### Using useMutation Hook

```tsx
import { useMutation } from '@/hooks/useMutations'

function MyForm() {
    const { insert, isLoading, isOnline } = useMutation({
        onSuccess: () => refreshData(),
    })

    const handleSubmit = async (data) => {
        await insert('table_name', {
            column1: data.value1,
            column2: data.value2,
            user_id: user?.id
        })
    }

    return (
        <button disabled={isLoading}>
            {isOnline ? 'Simpan' : 'Simpan Offline'}
        </button>
    )
}
```

---

## 🚀 Git Commits (Fase Ini)

| Commit | Message |
|--------|---------|
| TBD | feat: add offline-first infrastructure with Dexie.js |
