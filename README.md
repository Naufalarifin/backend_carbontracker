# CarbonTracker - Backend

Backend API untuk CarbonTracker menggunakan **Node.js**, **Express**, dan **Prisma ORM**.

## 🚀 Fitur
- Autentikasi User (login / register perusahaan)
- Input emisi karbon per bulan
- Lihat history emisi karbon
- Rekomendasi pengurangan emisi
- Sertifikat perusahaan ramah lingkungan (simulasi)

---

## 🛠️ Tech Stack
- Node.js
- Express.js
- Prisma ORM
- MySQL (database)

---

## 📦 Instalasi

1. Clone repository
   ```bash
   git clone https://github.com/username/carbontracker-backend.git
   cd carbontracker-backend
   ```
2. Setup environment
  Buat file .env di root project:
  ```bash
  DATABASE_URL="mysql://username:password@localhost:3306/carbontracker"
  ```

3. Setup Prisma
  ```bash
  npx prisma migrate dev --name init
  npx prisma generate
  ```

4. Jalankan server
  ```bash
  npm run dev
  ```
