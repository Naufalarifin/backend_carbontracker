# 🌱 Carbon Tracker Backend API

Backend API untuk sistem Carbon Tracker yang membantu perusahaan melacak dan menganalisis emisi karbon mereka.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Testing with Postman](#-testing-with-postman)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

- **User Management**: Registrasi, login, dan profil user
- **Company Management**: Manajemen data perusahaan
- **Emission Tracking**: Input dan tracking emisi karbon
- **AI Analysis**: Analisis emisi menggunakan AI
- **Certificate Generation**: Generasi sertifikat emisi
- **Reporting**: Laporan dan analisis emisi
- **JWT Authentication**: Sistem autentikasi yang aman

## 🛠 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM untuk database
- **MariaDB** - Database
- **JWT** - Authentication
- **OpenAI API** - AI analysis
- **bcryptjs** - Password hashing

## 📋 Prerequisites

Sebelum memulai, pastikan Anda telah menginstall:

- [Node.js](https://nodejs.org/) (versi 16 atau lebih baru)
- [npm](https://www.npmjs.com/) (biasanya sudah termasuk dengan Node.js)
- [MariaDB](https://mariadb.org/) atau MySQL
- [Git](https://git-scm.com/)

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/backend_carbontracker.git
cd backend_carbontracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Menggunakan MariaDB/MySQL Local

1. **Buat database baru:**
```sql
CREATE DATABASE carbontracker;
```

2. **Update file `prisma/schema.prisma`:**
   
   **Langkah-langkah:**
   1. Buka file `prisma/schema.prisma` di editor Anda
   2. Cari bagian `datasource db {`
   3. Ubah nilai `url` sesuai dengan database Anda
   
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = "mysql://username:password@localhost:3306/carbontracker"
}
```

   **Ganti:**
   - `username` dengan username database Anda (biasanya `root`)
   - `password` dengan password database Anda
   - `carbontracker` dengan nama database yang Anda buat
   
   **Contoh untuk Windows dengan XAMPP:**
   ```prisma
   datasource db {
     provider = "mysql"
     url      = "mysql://root:@localhost:3306/carbontracker"
   }
   ```
   
   **Contoh untuk Windows dengan password:**
   ```prisma
   datasource db {
     provider = "mysql"
     url      = "mysql://root:password123@localhost:3306/carbontracker"
   }
   ```
   
   **Catatan Penting:**
   - URL database harus diubah di `prisma/schema.prisma`, bukan di file `.env`
   - Pastikan format URL sesuai dengan database yang Anda gunakan
   - Jika menggunakan XAMPP, biasanya tidak ada password (kosong setelah `:`)
   - Jika menggunakan WAMP, biasanya ada password default
   - Jika menggunakan MariaDB standalone, sesuaikan dengan konfigurasi Anda


3. **Push schema ke database:**
```bash
npx prisma db push
```

4. **Seed database (opsional):**
```bash
npx prisma db seed
```

#### Option B: Menggunakan Database Online

1. **Daftar di [PlanetScale](https://planetscale.com/) atau [Railway](https://railway.app/)**
2. **Dapatkan connection string**
3. **Update file `.env` dengan connection string yang baru**

### 4. Generate Prisma Client

```bash
npx prisma generate
```

## 🗄 Database Setup

### Schema Overview

Database menggunakan Prisma ORM dengan model berikut:

- **User** - Data pengguna
- **Company** - Data perusahaan
- **EmissionSource** - Sumber emisi
- **EmissionInput** - Input emisi
- **EmissionInputDetail** - Detail input emisi
- **EmissionResult** - Hasil analisis emisi
- **Certificate** - Sertifikat emisi

### Migration Commands

```bash
# Push schema ke database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Reset database (hati-hati!)
npx prisma db push --force-reset

# View database di Prisma Studio
npx prisma studio
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Semua endpoint (kecuali register/login) memerlukan JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 🔐 Authentication
- `POST /api/users/register` - Registrasi user baru
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get profil user saat ini

#### 🏢 Company Management
- `GET /api/companies/check` - Cek status company user
- `POST /api/companies` - Buat company baru
- `GET /api/companies/:id` - Get detail company
- `PUT /api/companies/:id` - Update company

#### 📊 Emission Sources
- `GET /api/emission-sources` - Get semua emission sources
- `POST /api/emission-sources` - Buat emission source baru

#### 📝 Emission Input
- `GET /api/emission-inputs` - Get semua emission inputs
- `POST /api/emission-inputs` - Buat emission input
- `POST /api/emission-inputs/with-details` - Buat emission input dengan details

#### 📈 Emission Results
- `POST /api/emission-results` - Generate emission result
- `GET /api/emission-results/latest` - Get latest emission result
- `GET /api/emission-results/history` - Get emission history (12 bulan)

#### 🏆 Certificates
- `GET /api/certificates` - Get semua certificates
- `POST /api/certificates` - Generate certificate baru

## 🧪 Testing with Postman

### Quick Start Guide

1. **Register User:**
```http
POST http://localhost:3000/api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

2. **Login:**
```http
POST http://localhost:3000/api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

3. **Create Company:**
```http
POST http://localhost:3000/api/companies
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "company_name": "PT. Example",
  "industry": "Manufacturing",
  "address": "Jakarta, Indonesia"
}
```

4. **Input Emission Data:**
```http
POST http://localhost:3000/api/emission-inputs/with-details
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "emission_data": [
    {
      "source_name": "Listrik PLN",
      "value": 15000
    },
    {
      "source_name": "BBM Solar / Diesel",
      "value": 2500
    }
  ],
  "month": 1,
  "year": 2024
}
```

5. **Generate Emission Result:**
```http
POST http://localhost:3000/api/emission-results
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "input_id": 1
}
```

6. **Generate Certificate:**
```http
POST http://localhost:3000/api/certificates
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "issued_date": "2024-01-15",
  "valid_until": "2025-01-15"
}
```

## 📁 Project Structure

```
backend_carbontracker/
├── src/
│   ├── controllers/          # Controller functions
│   │   ├── userController.js
│   │   ├── companyController.js
│   │   ├── emissionSourceController.js
│   │   ├── emissionInputController.js
│   │   ├── emissionResultController.js
│   │   └── certificateController.js
│   ├── middleware/           # Middleware functions
│   │   └── authMiddleware.js
│   ├── routes/              # API routes
│   │   ├── userRoutes.js
│   │   ├── companyRoutes.js
│   │   ├── emissionSourceRoutes.js
│   │   ├── emissionInputRoutes.js
│   │   ├── emissionResultRoutes.js
│   │   └── certificateRoutes.js
│   ├── services/            # Business logic services
│   │   └── aiRecommendationService.js
│   ├── utils/               # Utility functions
│   │   └── dateFormatter.js
│   ├── app.js               # Express app configuration
│   └── index.js             # Entry point
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Database schema
├── generated/               # Generated Prisma client
├── package.json
├── .env                     # Environment variables
└── README.md
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start

# Database operations
npx prisma db push
npx prisma generate
npx prisma studio

# Linting (jika ada)
npm run lint

# Testing (jika ada)
npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Pastikan MariaDB/MySQL berjalan
   - Cek connection string di `prisma/schema.prisma` (bukan di `.env`)
   - Pastikan database sudah dibuat
   - Pastikan username dan password benar
   - Pastikan port 3306 tidak digunakan aplikasi lain
   
   **Cara mengubah URL database:**
   ```prisma
   // Di file prisma/schema.prisma
   datasource db {
     provider = "mysql"
     url      = "mysql://root:password@localhost:3306/carbontracker"
   }
   ```
   
   **Langkah-langkah:**
   1. Buka file `prisma/schema.prisma` di editor Anda
   2. Cari bagian `datasource db {`
   3. Ubah nilai `url` sesuai dengan database Anda
   4. Simpan file
   5. Jalankan `npx prisma db push`
   
   **Contoh URL yang benar:**
   - XAMPP: `mysql://root:@localhost:3306/carbontracker`
   - WAMP: `mysql://root:password@localhost:3306/carbontracker`
   - MariaDB: `mysql://username:password@localhost:3306/carbontracker`

2. **JWT Token Error:**
   - Pastikan token valid dan tidak expired
   - Cek format header: `Authorization: Bearer <token>`

3. **Prisma Error:**
   - Jalankan `npx prisma generate`
   - Jalankan `npx prisma db push`

4. **Port Already in Use:**
   - Ganti port di `.env` atau matikan aplikasi yang menggunakan port 3000

### Debug Mode

Untuk menjalankan dalam mode debug:

```bash
DEBUG=* npm run dev
```

## 📝 API Response Format

Semua API response mengikuti format standar:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "details": "Additional details (optional)"
}
```

Error response:

```json
{
  "success": false,
  "message": "Error message",
  "details": "Error details",
  "error": "Error type",
  "solution": "Suggested solution"
}
```

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Jika mengalami masalah atau ada pertanyaan:

1. Cek [Issues](https://github.com/yourusername/backend_carbontracker/issues)
2. Buat issue baru dengan detail error
3. Hubungi maintainer

---

**Happy Coding! 🚀**
