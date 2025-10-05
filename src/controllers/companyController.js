const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

// GET - Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        users: true,
        inputs: true,
        certificates: true
      }
    });
    
    res.json({
      success: true,
      data: companies,
      message: 'Companies retrieved successfully'
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

// GET - Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { company_id: parseInt(id) },
      include: {
        users: true,
        inputs: true,
        certificates: true
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
    const { name, address, industry } = req.body;

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
        industry: industry || null
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

// POST - Create company for existing user
const createCompanyForUser = async (req, res) => {
  try {
    const { name, address, industry, user_id } = req.body;

    // Validation
    if (!name || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Company name and user_id are required'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(user_id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has a company
    if (user.company_id) {
      return res.status(409).json({
        success: false,
        message: 'User already belongs to a company'
      });
    }

    // Create company and update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name,
          address: address || null,
          industry: industry || null
        }
      });

      // Update user to link with the new company
      const updatedUser = await tx.user.update({
        where: { user_id: parseInt(user_id) },
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

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  createCompanyForUser,
  deleteCompany
};
