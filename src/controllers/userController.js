const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

// GET - Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        company: true
      }
    });
    
    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

// GET - Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(id) },
      include: {
        company: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
};

// POST - Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, company_id } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if company exists (only if company_id is provided)
    if (company_id) {
      const company = await prisma.company.findUnique({
        where: { company_id: parseInt(company_id) }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        company_id: company_id ? parseInt(company_id) : null
      },
      include: {
        company: true
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// DELETE - Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { user_id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { user_id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// POST - Create user with company (nested create)
const createUserWithCompany = async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Validation
    if (!name || !email || !password || !company?.name) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and company.name are required'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create user with company in one transaction
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        company: {
          create: {
            name: company.name,
            address: company.address || null,
            industry: company.industry || null
          }
        }
      },
      include: {
        company: true
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User and company created successfully'
    });
  } catch (error) {
    console.error('Error creating user with company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user with company',
      error: error.message
    });
  }
};

// POST - Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true
      }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  createUserWithCompany,
  deleteUser,
  loginUser
};
