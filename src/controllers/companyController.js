const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

// GET - Get all companies (filtered by user's company)
const getAllCompanies = async (req, res) => {
  try {
    const user = req.user;
    
    console.log('getAllCompanies - User:', { 
      user_id: user.user_id, 
      company_id: user.company_id,
      email: user.email 
    });
    
    // If user has a company, only show their company
    if (user.company_id) {
      const company = await prisma.company.findUnique({
        where: { company_id: user.company_id },
        include: {
          user: true,
          emissioninput: true,
          certificate: true
        }
      });
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      
      return res.json({
        success: true,
        data: [company],
        message: 'Company retrieved successfully'
      });
    }
    
    // If user doesn't have a company, return empty array
    res.json({
      success: true,
      data: [],
      message: 'No company found for this user'
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve companies',
      error: error.message
    });
  }
};

// GET - Get company by ID (only if user belongs to that company)
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Check if user belongs to the requested company
    if (user.company_id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own company.'
      });
    }
    
    const company = await prisma.company.findUnique({
      where: { company_id: parseInt(id) },
      include: {
        user: true,
        emissioninput: true,
        certificate: true
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company,
      message: 'Company retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve company',
      error: error.message
    });
  }
};

// POST - Create new company
const createCompany = async (req, res) => {
  try {
    const { 
      name, 
      address, 
      jenis_perusahaan, 
      jumlah_karyawan, 
      unit_produk_perbulan, 
      pendapatan_perbulan, 
      ton_barang_perbulan 
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const company = await prisma.company.create({
      data: {
        name,
        address: address || null,
        jenis_perusahaan: jenis_perusahaan || null,
        jumlah_karyawan: jumlah_karyawan ? parseInt(jumlah_karyawan) : null,
        unit_produk_perbulan: unit_produk_perbulan ? parseInt(unit_produk_perbulan) : null,
        pendapatan_perbulan: pendapatan_perbulan ? parseFloat(pendapatan_perbulan) : null,
        ton_barang_perbulan: ton_barang_perbulan ? parseFloat(ton_barang_perbulan) : null
      },
      include: {
        users: true,
        inputs: true,
        certificates: true
      }
    });

    res.status(201).json({
      success: true,
      data: company,
      message: 'Company created successfully'
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error.message
    });
  }
};

// POST - Create company for current user (auto-use user_id from token)
const createCompanyForUser = async (req, res) => {
  try {
    const { 
      name, 
      address, 
      jenis_perusahaan, 
      jumlah_karyawan, 
      unit_produk_perbulan, 
      pendapatan_perbulan, 
      ton_barang_perbulan
    } = req.body;
    
    const user = req.user; // Get user from token

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    // Check if user already has a company
    if (user.company_id) {
      return res.status(409).json({
        success: false,
        message: 'User already belongs to a company. Use PUT /api/companies/:id to update existing company.'
      });
    }

    // Create company and update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name,
          address: address || null,
          jenis_perusahaan: jenis_perusahaan || null,
          jumlah_karyawan: jumlah_karyawan ? parseInt(jumlah_karyawan) : null,
          unit_produk_perbulan: unit_produk_perbulan ? parseInt(unit_produk_perbulan) : null,
          pendapatan_perbulan: pendapatan_perbulan ? parseFloat(pendapatan_perbulan) : null,
          ton_barang_perbulan: ton_barang_perbulan ? parseFloat(ton_barang_perbulan) : null
        }
      });

      // Update user to link with the new company
      const updatedUser = await tx.user.update({
        where: { user_id: user.user_id },
        data: { company_id: company.company_id },
        include: {
          company: true
        }
      });

      return { company, user: updatedUser };
    });

    res.status(201).json({
      success: true,
      data: {
        company: result.company,
        user: result.user
      },
      message: 'Company created and user linked successfully'
    });
  } catch (error) {
    console.error('Error creating company for user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company for user',
      error: error.message
    });
  }
};

// PUT - Update company by ID (only if user belongs to that company)
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      address, 
      jenis_perusahaan, 
      jumlah_karyawan, 
      unit_produk_perbulan, 
      pendapatan_perbulan, 
      ton_barang_perbulan 
    } = req.body;
    
    const user = req.user; // Get user from token

    // Check if user belongs to the requested company
    if (user.company_id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own company.'
      });
    }

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const company = await prisma.company.update({
      where: { company_id: parseInt(id) },
      data: {
        name,
        address: address || null,
        jenis_perusahaan: jenis_perusahaan || null,
        jumlah_karyawan: jumlah_karyawan ? parseInt(jumlah_karyawan) : null,
        unit_produk_perbulan: unit_produk_perbulan ? parseInt(unit_produk_perbulan) : null,
        pendapatan_perbulan: pendapatan_perbulan ? parseFloat(pendapatan_perbulan) : null,
        ton_barang_perbulan: ton_barang_perbulan ? parseFloat(ton_barang_perbulan) : null
      },
      include: {
        user: true,
        emissioninput: true,
        certificate: true
      }
    });

    res.json({
      success: true,
      data: company,
      message: 'Company updated successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company',
      error: error.message
    });
  }
};

// DELETE - Delete company by ID
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { company_id: parseInt(id) }
    });

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Delete company (cascade will handle related records)
    await prisma.company.delete({
      where: { company_id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: error.message
    });
  }
};

// GET - Check if user has company (for frontend to determine UI flow) - NO RESTRICTIONS
const checkUserCompany = async (req, res) => {
  try {
    const user = req.user;
    
    console.log('checkUserCompany - User:', { 
      user_id: user.user_id, 
      company_id: user.company_id,
      email: user.email 
    });
    
    if (user.company_id) {
      // User has a company, get basic company info
      const company = await prisma.company.findUnique({
        where: { company_id: user.company_id },
        select: {
          company_id: true,
          name: true,
          address: true,
          jenis_perusahaan: true,
          jumlah_karyawan: true,
          pendapatan_perbulan: true,
          ton_barang_perbulan: true,
          unit_produk_perbulan: true
        }
      });
      
      if (company) {
        return res.json({
          success: true,
          hasCompany: true,
          data: company,
          message: 'User has a company'
        });
      }
    }
    
    // User doesn't have a company
    res.json({
      success: true,
      hasCompany: false,
      data: null,
      message: 'User does not have a company'
    });
  } catch (error) {
    console.error('Error checking user company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user company',
      error: error.message
    });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  createCompanyForUser,
  updateCompany,
  deleteCompany,
  checkUserCompany
};
