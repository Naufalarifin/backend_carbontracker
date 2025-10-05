const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

// Middleware untuk memverifikasi user login
const authenticateUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Jika tidak ada email/password di body, coba dari headers
    const authEmail = email || req.headers['x-user-email'];
    const authPassword = password || req.headers['x-user-password'];

    if (!authEmail || !authPassword) {
      return res.status(401).json({
        success: false,
        message: 'Authentication credentials required'
      });
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: authEmail },
      include: {
        company: true
      }
    });

    if (!user || user.password !== authPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Tambahkan user info ke request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
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
