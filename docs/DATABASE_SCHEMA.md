# 📚 RubyFarm Database Schema Reference

Daftar lengkap penamaan tabel dan field untuk Indukan & Anakan.

---

## 🐰 INDUKAN (Tabel: `livestock`)

| Field Name | Tipe | Deskripsi |
|------------|------|-----------|
| `livestock.id` | UUID | ID unik indukan |
| `livestock.user_id` | UUID | ID user pemilik |
| `livestock.livestock_code` | VARCHAR | Kode indukan (NZW-M01) |
| `livestock.breed_id` | UUID | FK ke settings_breeds |
| `livestock.gender` | VARCHAR | 'jantan' / 'betina' |
| `livestock.birth_date` | DATE | Tanggal lahir |
| `livestock.weight_kg` | DECIMAL | Bobot awal (kg) |
| `livestock.kandang_id` | UUID | FK ke kandang |
| `livestock.acquisition_date` | DATE | Tanggal perolehan |
| `livestock.acquisition_source` | VARCHAR | Sumber: 'pembelian', 'farm_breeding' |
| `livestock.acquisition_price` | DECIMAL | Harga beli (Rp) |
| `livestock.mother_id` | UUID | FK ke induk betina |
| `livestock.father_id` | UUID | FK ke induk jantan |
| `livestock.generation` | INTEGER | Generasi (1=beli, 2+=breeding) |
| `livestock.status` | VARCHAR | Status reproduksi |
| `livestock.status_farm` | VARCHAR | 'infarm' / 'terjual' / 'mati' |
| `livestock.health_status` | VARCHAR | Status kesehatan |
| `livestock.notes` | TEXT | Catatan |
| `livestock.created_at` | TIMESTAMPTZ | Tanggal dibuat |
| `livestock.updated_at` | TIMESTAMPTZ | Tanggal diupdate |

### Status Indukan Jantan:
- `pejantan_aktif` - Siap kawin aktif
- `pejantan_muda` - Masih muda/belum aktif
- `pejantan_cadangan` - Cadangan
- `istirahat` - Sedang istirahat

### Status Indukan Betina:
- `siap_kawin` - Siap dikawinkan
- `bunting` - Sedang hamil
- `menyusui` - Sedang menyusui
- `betina_muda` - Masih muda
- `istirahat` - Sedang istirahat

---

## 🐇 ANAKAN (Tabel: `offspring`)

| Field Name | Tipe | Deskripsi |
|------------|------|-----------|
| `offspring.id` | UUID | ID unik anakan |
| `offspring.user_id` | UUID | ID user pemilik |
| `offspring.offspring_code` | VARCHAR | Kode sistem (OFF-001) |
| `offspring.id_anakan` | VARCHAR | Kode tampilan (NZW-M01.F02-240615-01) |
| `offspring.birth_id` | UUID | FK ke births |
| `offspring.mother_id` | UUID | FK ke induk betina |
| `offspring.father_id` | UUID | FK ke induk jantan |
| `offspring.birth_date` | DATE | Tanggal lahir |
| `offspring.gender` | VARCHAR | 'jantan' / 'betina' |
| `offspring.weight_kg` | DECIMAL | Bobot awal (kg) |
| `offspring.kandang_id` | UUID | FK ke kandang |
| `offspring.generation` | INTEGER | Generasi |
| `offspring.weaning_date` | DATE | Tanggal sapih |
| `offspring.ready_to_sell_date` | DATE | Tanggal siap jual |
| `offspring.status_farm` | VARCHAR | Status anakan |
| `offspring.health_status` | VARCHAR | Status kesehatan |
| `offspring.status_notes` | TEXT | Catatan status |
| `offspring.created_at` | TIMESTAMPTZ | Tanggal dibuat |
| `offspring.updated_at` | TIMESTAMPTZ | Tanggal diupdate |

### Status Anakan:
- `anakan` - Baru lahir (0-8 minggu)
- `pertumbuhan` - Fase tumbuh (8-12 minggu)
- `siap_jual` - Siap dijual (12+ minggu)
- `terjual` - Sudah terjual
- `promosi` - Dipromosikan ke indukan
- `mati` - Mati

---

## 📈 LOG PERTUMBUHAN INDUKAN (Tabel: `livestock_growth_logs`)

| Field Name | Tipe | Deskripsi |
|------------|------|-----------|
| `livestock_growth_logs.id` | UUID | ID unik |
| `livestock_growth_logs.user_id` | UUID | ID user |
| `livestock_growth_logs.livestock_id` | UUID | FK ke livestock |
| `livestock_growth_logs.measurement_date` | DATE | Tanggal timbang |
| `livestock_growth_logs.weight_kg` | DECIMAL | Bobot (kg) |
| `livestock_growth_logs.notes` | TEXT | Catatan |
| `livestock_growth_logs.created_at` | TIMESTAMPTZ | Tanggal dibuat |

---

## 📈 LOG PERTUMBUHAN ANAKAN (Tabel: `offspring_growth_logs`)

| Field Name | Tipe | Deskripsi |
|------------|------|-----------|
| `offspring_growth_logs.id` | UUID | ID unik |
| `offspring_growth_logs.user_id` | UUID | ID user |
| `offspring_growth_logs.offspring_id` | UUID | FK ke offspring |
| `offspring_growth_logs.measurement_date` | DATE | Tanggal timbang |
| `offspring_growth_logs.weight_kg` | DECIMAL | Bobot (kg) |
| `offspring_growth_logs.notes` | TEXT | Catatan |
| `offspring_growth_logs.created_at` | TIMESTAMPTZ | Tanggal dibuat |

---

## 🏥 CATATAN KESEHATAN INDUKAN (Tabel: `livestock_health_records`)

| Field Name | Tipe | Deskripsi |
|------------|------|-----------|
| `livestock_health_records.id` | UUID | ID unik |
| `livestock_health_records.user_id` | UUID | ID user |
| `livestock_health_records.livestock_id` | UUID | FK ke livestock |
| `livestock_health_records.record_date` | DATE | Tanggal record |
| `livestock_health_records.record_type` | VARCHAR | 'checkup'/'vaksin'/'sakit'/'pengobatan' |
| `livestock_health_records.description` | TEXT | Deskripsi |
| `livestock_health_records.treatment` | TEXT | Pengobatan |
| `livestock_health_records.cost` | DECIMAL | Biaya (Rp) |
| `livestock_health_records.created_at` | TIMESTAMPTZ | Tanggal dibuat |

---

## 🏥 CATATAN KESEHATAN ANAKAN (Tabel: `offspring_health_records`)

| Field Name | Tipe | Deskripsi |
|------------|------|-----------|
| `offspring_health_records.id` | UUID | ID unik |
| `offspring_health_records.user_id` | UUID | ID user |
| `offspring_health_records.offspring_id` | UUID | FK ke offspring |
| `offspring_health_records.record_date` | DATE | Tanggal record |
| `offspring_health_records.record_type` | VARCHAR | 'checkup'/'vaksin'/'sakit'/'pengobatan' |
| `offspring_health_records.description` | TEXT | Deskripsi |
| `offspring_health_records.treatment` | TEXT | Pengobatan |
| `offspring_health_records.cost` | DECIMAL | Biaya (Rp) |
| `offspring_health_records.created_at` | TIMESTAMPTZ | Tanggal dibuat |

---

## 🍼 RECORD KELAHIRAN (Tabel: `births`)

| Field Name | Tipe | Deskripsi |
|------------|------|-----------|
| `births.id` | UUID | ID unik |
| `births.user_id` | UUID | ID user |
| `births.birth_code` | VARCHAR | Kode kelahiran |
| `births.mother_id` | UUID | FK ke induk betina |
| `births.father_id` | UUID | FK ke pejantan |
| `births.mating_date` | DATE | Tanggal kawin |
| `births.palpation_date` | DATE | Tanggal palpasi |
| `births.palpation_result` | BOOLEAN | Hasil palpasi (true=bunting) |
| `births.birth_date` | DATE | Tanggal lahir |
| `births.total_born` | INTEGER | Jumlah lahir |
| `births.total_alive` | INTEGER | Jumlah hidup |
| `births.total_dead` | INTEGER | Jumlah mati |
| `births.male_count` | INTEGER | Jumlah jantan |
| `births.female_count` | INTEGER | Jumlah betina |
| `births.weaned_count` | INTEGER | Jumlah disapih |
| `births.male_weaned` | INTEGER | Jantan disapih |
| `births.female_weaned` | INTEGER | Betina disapih |
| `births.weaning_success_rate` | DECIMAL | Tingkat sukses sapih (%) |
| `births.notes` | TEXT | Catatan |
| `births.created_at` | TIMESTAMPTZ | Tanggal dibuat |

---

## 📋 QUICK REFERENCE

### Untuk Bobot:
- `livestock.weight_kg` → Bobot awal indukan
- `livestock_growth_logs.weight_kg` → Bobot berkala indukan
- `offspring.weight_kg` → Bobot awal anakan
- `offspring_growth_logs.weight_kg` → Bobot berkala anakan

### Untuk Status:
- `livestock.status` → Status reproduksi indukan
- `livestock.status_farm` → Status keberadaan indukan
- `offspring.status_farm` → Status anakan

### Untuk Tanggal:
- `livestock.birth_date` → Tanggal lahir indukan
- `livestock.acquisition_date` → Tanggal perolehan
- `offspring.birth_date` → Tanggal lahir anakan
- `offspring.weaning_date` → Tanggal sapih
- `births.mating_date` → Tanggal kawin
- `births.birth_date` → Tanggal kelahiran batch
