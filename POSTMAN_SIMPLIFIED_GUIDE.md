# 🚀 Panduan Postman Sederhana - Carbon Tracker API

## 🎯 Fitur Baru: Auto User & Company ID

**Sekarang Anda TIDAK perlu lagi mengirim `user_id` atau `company_id` manual!** Sistem akan otomatis menggunakan data dari token login Anda.

---

## 📋 Langkah-langkah Lengkap

### 🔐 Step 1: Register User

**Request:**
```
POST http://localhost:5000/api/users/register
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Admin PT Green",
  "email": "admin@green.co.id",
  "password": "secret123"
}
```

---

### 🔑 Step 2: Login User

**Request:**
```
POST http://localhost:5000/api/users/login
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@green.co.id",
  "password": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**⚠️ PENTING: Copy token dari `data.token` untuk step selanjutnya!**

---

### 🏢 Step 3: Create Company

**Request:**
```
POST http://localhost:5000/api/companies/for-user
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TOKEN_DARI_STEP_2>
```

**Body (TIDAK perlu user_id lagi!):**
```json
{
  "name": "PT Green Manufacturing",
  "address": "Jl. Industri Raya No. 123, Jakarta",
  "jenis_perusahaan": "Manufaktur, Produksi Barang",
  "jumlah_karyawan": 150,
  "pendapatan_perbulan": 2500000000,
  "ton_barang_perbulan": 250,
  "unit_produk_perbulan": 5000
}
```

---

### 📝 Step 4: Create Emission Input (WITH DETAILS ONLY)

Semua input dibuat sekaligus per bulan berjalan menggunakan daftar sumber dan nilainya. Tidak ada endpoint detail terpisah lagi.

**Request:**
```
POST http://localhost:5000/api/emission-inputs/with-details
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TOKEN_DARI_STEP_2>
```

**Body (tanpa company_id):**
```json
{
  "emission_data": [
    { "source_name": "Listrik PLN", "value": 15000 },
    { "source_name": "BBM Solar / Diesel", "value": 2500 },
    { "source_name": "BBM Bensin / Gasolin", "value": 800 },
    { "source_name": "Air Bersih / Konsumsi Air", "value": 5000 }
  ]
}
```

**Response berisi:**
- `input_id` yang baru dibuat
- daftar `details` (tiap source + value + emission_value)
- objek `company`

---

### 📊 Step 5: Create Emission Result

**Request:**
```
POST http://localhost:5000/api/emission-results
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TOKEN_DARI_STEP_2>
```

**Body (Hanya perlu input_id hasil dari Step 4):**
```json
{
  "input_id": 2
}
```

**Catatan:** 
- Sistem akan otomatis menghitung `total_emission` dari detail input
- `analisis` akan di-set null, bisa diupdate nanti
- Input harus milik company Anda

---

### 🏆 Step 6: Create Certificate

**Request:**
```
POST http://localhost:5000/api/certificates
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TOKEN_DARI_STEP_2>
```

**Body (Hanya perlu issue_date dan expiry_date!):**
```json
{
  "issued_date": "2024-02-01",
  "valid_until": "2025-02-01"
}
```

**Catatan:**
- `certificate_id` otomatis dibuat
- `company_id` otomatis dari token
- `certificate_number` otomatis generate
- `certificate_type` default "Carbon Footprint Certificate"
- `description` default null

**⚠️ SYARAT SERTIFIKAT:**
- Perusahaan harus memiliki **12 bulan berturut-turut** data emisi
- Semua hasil analisis harus memiliki **level "Baik"**
- Tidak boleh ada bulan yang kosong dalam 12 bulan berturut-turut
- Jika tidak memenuhi syarat, akan mendapat error 400 dengan detail requirements

---

## 🎯 Perubahan Utama

### ✅ Yang TIDAK Perlu Lagi:
- ❌ `user_id` di body request
- ❌ `company_id` di body request
- ❌ Manual input ID perusahaan

### ✅ Yang Otomatis:
- ✅ `user_id` dari token JWT
- ✅ `company_id` dari token JWT
- ✅ Validasi otomatis kepemilikan data
- ✅ Filter data berdasarkan perusahaan user

---

## 🔍 GET Requests (Optional)

### Get My Company:
```
GET http://localhost:5000/api/companies
Authorization: Bearer <TOKEN>
```

### Get My Emission Sources:
```
GET http://localhost:5000/api/emission-sources
Authorization: Bearer <TOKEN>
```

### Get My Emission Inputs:
```
GET http://localhost:5000/api/emission-inputs
Authorization: Bearer <TOKEN>
```

### Get My Emission Results:
```
GET http://localhost:5000/api/emission-results
Authorization: Bearer <TOKEN>
```

### Get My Certificates:
```
GET http://localhost:5000/api/certificates
Authorization: Bearer <TOKEN>
```

---

## 🛡️ Keamanan

### ✅ Yang Dilindungi:
- User hanya bisa akses data perusahaan mereka sendiri
- User hanya bisa create data untuk perusahaan mereka
- Validasi otomatis kepemilikan data
- Token JWT dengan expiry 24 jam

### ✅ Error Handling:
- 401: Token tidak valid/expired
- 403: Akses ditolak (bukan data perusahaan Anda)
- 400: Data tidak lengkap atau format salah
- 404: Data tidak ditemukan

---

## 🎉 Keuntungan Sistem Baru

1. **Lebih Mudah**: Tidak perlu input ID manual
2. **Lebih Aman**: Data terisolasi per perusahaan
3. **Lebih Cepat**: Validasi otomatis
4. **Lebih Konsisten**: Semua endpoint menggunakan pola yang sama
5. **Lebih User-Friendly**: Error message yang jelas

---

## 🚀 Quick Start

1. **Register** → **Login** → **Copy Token**
2. **Create Company** (otomatis link ke user)
3. **Create Emission Input with Details** (otomatis link ke company, buat input + detail sekaligus)
4. **Create Emission Result** (otomatis link ke company, hitung total dari input)
5. **Create Certificate** (otomatis link ke company, ambil result terbaru)

**Semua ID otomatis! Tidak perlu input manual lagi!** 🎯
