const { PrismaClient } = require("../../generated/prisma");
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// JWT Secret Key (harus sama dengan yang di userController)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware untuk memverifikasi JWT token
const authenticateUser = async (req, res, next) => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '❌ Gagal mengakses endpoint!',
        details: 'Token autentikasi tidak ditemukan. Gunakan format: Authorization: Bearer <token>',
        error: 'Authentication token required',
        solution: 'Login terlebih dahulu menggunakan POST /api/users/login dan gunakan token yang dikembalikan'
      });
    }

    // Extract token dari header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '❌ Token tidak valid!',
        details: 'Token autentikasi kosong atau tidak valid.',
        error: 'Invalid token format',
        solution: 'Pastikan token dikirim dengan format yang benar'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Cari user berdasarkan ID dari token
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
      include: {
        company: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '❌ User tidak ditemukan!',
        details: 'User yang terkait dengan token ini tidak ditemukan.',
        error: 'User not found',
        solution: 'Login ulang untuk mendapatkan token yang valid'
      });
    }

    // Tambahkan user info ke request object
    req.user = user;
    req.token = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '❌ Token tidak valid!',
        details: 'Token autentikasi yang Anda gunakan tidak valid atau sudah rusak.',
        error: 'Invalid token',
        solution: 'Login ulang untuk mendapatkan token yang baru'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '❌ Token sudah expired!',
        details: 'Token autentikasi Anda sudah kadaluarsa.',
        error: 'Token expired',
        solution: 'Login ulang untuk mendapatkan token yang baru'
      });
    }

    res.status(500).json({
      success: false,
      message: '❌ Terjadi kesalahan saat autentikasi!',
      details: 'Sistem tidak dapat memverifikasi identitas Anda saat ini.',
      error: error.message,
      solution: 'Silakan coba lagi atau hubungi administrator'
    });
  }
};

// Middleware untuk memverifikasi bahwa user adalah bagian dari company tertentu
const authorizeCompanyAccess = (req, res, next) => {
  try {
    const { company_id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Jika user adalah bagian dari company yang diminta
    if (user.company_id === parseInt(company_id)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization failed',
      error: error.message
    });
  }
};

// Middleware untuk validasi input umum
const validateInput = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeCompanyAccess,
  validateInput
};
