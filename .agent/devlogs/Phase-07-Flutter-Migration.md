# Phase-07: Flutter Migration 🚀

> **Status:** 🔴 Not Started  
> **Estimated Duration:** 7-8 Weeks  
> **Previous Phase:** Phase-06 (Offline-First - Reverted due to multi-tenancy)

---

## 🎯 Objective
Migrate RubyFarm dari React PWA ke Flutter untuk:
- ✅ **100% Offline Capability** dengan SQLite lokal
- ✅ **Native App** di Play Store / App Store
- ✅ **User Data Isolation** per device
- ✅ **Learning Experience** untuk Fashrif

---

## 📚 Learning Resources (Wajib Sebelum Mulai)

### Dart Language (1-2 hari)
- [ ] [Dart Tour](https://dart.dev/guides/language/language-tour) - Syntax dasar
- [ ] [DartPad](https://dartpad.dev) - Practice online
- [ ] Variables: `var`, `final`, `const`
- [ ] Null Safety: `?`, `!`, `??`
- [ ] Collections: List, Map, Set
- [ ] Async: `Future`, `async/await`, `Stream`

### Flutter Fundamentals (3-4 hari)
- [ ] [Flutter Codelabs](https://codelabs.developers.google.com/?cat=Flutter) - Official tutorials
- [ ] Widget Tree concept
- [ ] Stateless vs Stateful Widget
- [ ] BuildContext & State Management
- [ ] Navigation & Routing

### Supabase + Flutter (1 hari)
- [ ] [Supabase Flutter Quick Start](https://supabase.com/docs/guides/getting-started/quickstarts/flutter)
- [ ] Auth integration
- [ ] Database queries

---

## 🗓️ Detailed Migration Roadmap

### Week 1: Foundation & Auth ✅

| Day | Task | Learning Outcome |
|-----|------|------------------|
| 1-2 | Flutter project setup | Project structure, pubspec.yaml |
| 3 | Supabase SDK integration | Provider pattern, env config |
| 4 | Login/Register screens | Form widgets, validation |
| 5 | Auth state management | Riverpod/Provider basics |

**Deliverables:**
- [ ] Flutter project initialized
- [ ] Supabase connection working
- [ ] Login + Register functional
- [ ] Session persistence

**Checklist:**
```
[ ] `flutter create rubyfarm_flutter`
[ ] Add dependencies: supabase_flutter, riverpod, go_router
[ ] Create lib/core/supabase_client.dart
[ ] Create lib/features/auth/login_screen.dart
[ ] Create lib/features/auth/register_screen.dart
[ ] Test: Login → Dashboard navigation
```

---

### Week 2: Core Data Models & Kandang CRUD

| Day | Task | Learning Outcome |
|-----|------|------------------|
| 1 | Data models (Dart classes) | Freezed, json_serializable |
| 2 | Repository pattern setup | Clean Architecture basics |
| 3 | Kandang list screen | ListView, FutureBuilder |
| 4 | Kandang detail + add form | Form validation, Dialogs |
| 5 | Kandang delete + edit | CRUD complete cycle |

**Deliverables:**
- [ ] All data models defined
- [ ] Kandang CRUD fully working
- [ ] Repository layer established

**Checklist:**
```
[ ] lib/models/kandang.dart
[ ] lib/models/livestock.dart
[ ] lib/models/offspring.dart
[ ] lib/repositories/kandang_repository.dart
[ ] lib/features/kandang/kandang_list_screen.dart
[ ] lib/features/kandang/kandang_add_form.dart
```

---

### Week 3: Livestock (Indukan) Module

| Day | Task | Learning Outcome |
|-----|------|------------------|
| 1 | Livestock list with filters | FilterChip, search |
| 2 | Livestock detail modal | BottomSheet, tabs |
| 3 | Livestock add form | Dropdown, date picker |
| 4 | Breeding records | Nested data display |
| 5 | Health records | Related data CRUD |

**Deliverables:**
- [ ] Livestock full CRUD
- [ ] Breeding tab with records
- [ ] Health records integration

**Checklist:**
```
[ ] lib/features/livestock/livestock_list_screen.dart
[ ] lib/features/livestock/livestock_detail_modal.dart
[ ] lib/features/livestock/livestock_add_form.dart
[ ] lib/features/livestock/breeding_tab.dart
[ ] lib/repositories/livestock_repository.dart
```

---

### Week 4: Offspring (Anakan) Module

| Day | Task | Learning Outcome |
|-----|------|------------------|
| 1 | Offspring list screen | Grouped data display |
| 2 | Offspring detail modal | Complex UI composition |
| 3 | Single + Batch add forms | Dynamic forms |
| 4 | Growth & health records | Line charts (fl_chart) |
| 5 | Status updates (promosi) | Modal workflows |

**Deliverables:**
- [ ] Offspring full CRUD
- [ ] Batch add functional
- [ ] Growth charts

**Checklist:**
```
[ ] lib/features/offspring/offspring_list_screen.dart
[ ] lib/features/offspring/offspring_detail_modal.dart
[ ] lib/features/offspring/batch_add_form.dart
[ ] lib/features/offspring/growth_chart.dart
```

---

### Week 5: Finance & Inventory

| Day | Task | Learning Outcome |
|-----|------|------------------|
| 1 | Finance list + summary | Tab navigation |
| 2 | Transaction add/edit | Conditional forms |
| 3 | Inventory equipment list | Mixed data display |
| 4 | Feed purchases | Form with calculations |
| 5 | Dashboard with stats | Data aggregation |

**Deliverables:**
- [ ] Finance module complete
- [ ] Inventory module complete
- [ ] Dashboard with real stats

**Checklist:**
```
[ ] lib/features/finance/finance_page.dart
[ ] lib/features/inventory/inventory_page.dart
[ ] lib/features/dashboard/dashboard_screen.dart
```

---

### Week 6: Offline-First Implementation 🔥

**Ini yang membuat Flutter lebih powerful dari PWA!**

| Day | Task | Learning Outcome |
|-----|------|------------------|
| 1 | SQLite setup (Drift/sqflite) | Local database |
| 2 | Sync queue implementation | Offline queue patterns |
| 3 | Repository layer refactor | Offline-first pattern |
| 4 | Conflict resolution | Sync strategies |
| 5 | Background sync | WorkManager |

**Deliverables:**
- [ ] All data cached to SQLite
- [ ] Offline insert/update working
- [ ] Auto-sync when online

**Checklist:**
```
[ ] lib/core/database/app_database.dart
[ ] lib/core/sync/sync_queue.dart
[ ] lib/core/sync/sync_manager.dart
[ ] Modify all repositories for offline-first
[ ] Add connectivity listener
```

---

### Week 7: Polish, Testing & Settings

| Day | Task | Learning Outcome |
|-----|------|------------------|
| 1 | Settings pages (Breeds, etc) | CRUD for master data |
| 2 | UI polish & animations | Implicit animations |
| 3 | Error handling | SnackBar, dialogs |
| 4 | Unit & widget tests | Testing basics |
| 5 | Performance optimization | Profile mode |

**Deliverables:**
- [ ] Settings complete
- [ ] Error handling robust
- [ ] Core tests written

---

### Week 8: Deployment 🚀

| Day | Task | Learning Outcome |
|-----|------|------------------|
| 1 | App icon & splash screen | Branding |
| 2 | Release build Android | Build variants |
| 3 | Play Store submission | Store requirements |
| 4-5 | Bug fixes & reviews | Production feedback |

**Deliverables:**
- [ ] APK/AAB published
- [ ] Play Store listing live

---

## 🏗️ Recommended Project Structure

```
rubyfarm_flutter/
├── lib/
│   ├── main.dart
│   ├── app.dart                    # App widget, routing
│   │
│   ├── core/                       # Shared utilities
│   │   ├── supabase_client.dart
│   │   ├── database/               # SQLite (Drift)
│   │   ├── sync/                   # Offline sync engine
│   │   └── theme.dart
│   │
│   ├── models/                     # Data classes
│   │   ├── kandang.dart
│   │   ├── livestock.dart
│   │   └── offspring.dart
│   │
│   ├── repositories/               # Data layer
│   │   ├── kandang_repository.dart
│   │   └── livestock_repository.dart
│   │
│   ├── providers/                  # State management
│   │   ├── auth_provider.dart
│   │   └── kandang_provider.dart
│   │
│   └── features/                   # UI modules
│       ├── auth/
│       ├── dashboard/
│       ├── kandang/
│       ├── livestock/
│       ├── offspring/
│       ├── finance/
│       └── settings/
│
├── test/                           # Unit & widget tests
├── pubspec.yaml                    # Dependencies
└── README.md
```

---

## 📦 Key Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Supabase
  supabase_flutter: ^2.0.0
  
  # State Management
  flutter_riverpod: ^2.4.0
  
  # Navigation
  go_router: ^13.0.0
  
  # Local Database (Offline)
  drift: ^2.14.0
  sqlite3_flutter_libs: ^0.5.0
  
  # UI Helpers
  intl: ^0.18.0              # Date formatting
  fl_chart: ^0.66.0          # Charts
  cached_network_image: ^3.3.0
  
  # Utilities
  freezed_annotation: ^2.4.0  # Immutable models
  json_annotation: ^4.8.0
  connectivity_plus: ^5.0.0   # Network status
  
dev_dependencies:
  build_runner: ^2.4.0
  freezed: ^2.4.0
  json_serializable: ^6.7.0
  drift_dev: ^2.14.0
```

---

## ✅ Definition of Done (Per Week)

1. **All checklist items marked [x]**
2. **No runtime errors on emulator/device**
3. **Data persists after app restart**
4. **UI responsive on different screen sizes**
5. **Fashrif understands the concepts (/quiz passed)**

---

## 🔗 Quick Reference Links

| Resource | URL |
|----------|-----|
| Flutter Docs | https://docs.flutter.dev |
| Supabase Flutter | https://supabase.com/docs/reference/dart |
| Riverpod Docs | https://riverpod.dev |
| Drift (SQLite) | https://drift.simonbinder.eu |
| App Icons Generator | https://appicon.co |

---

## 📝 Notes

- **PWA tetap jalan**: Selama development Flutter, PWA di Vercel tetap bisa dipakai
- **Same Supabase**: Database sama, tidak perlu migrasi data
- **Learn by doing**: Setiap week ada `/quiz` untuk memastikan pemahaman

---

**Ready to start? Type `/next` to begin Week 1!**
