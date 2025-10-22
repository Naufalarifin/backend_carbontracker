const express = require('express');
const router = express.Router();
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  createCompanyForUser,
  updateCompany,
  deleteCompany,
  checkUserCompany
} = require('../controllers/companyController');
const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/companies - Get all companies (requires login)
router.get('/', authenticateUser, getAllCompanies);

// GET /api/companies/check - Check if user has company (requires login) - MUST BE BEFORE /:id
router.get('/check', authenticateUser, checkUserCompany);

// GET /api/companies/:id - Get company by ID (requires login)
router.get('/:id', authenticateUser, getCompanyById);

// POST /api/companies - Create new company (requires login)
router.post('/', authenticateUser, createCompany);

// POST /api/companies/for-user - Create company for existing user (requires login)
router.post('/for-user', authenticateUser, createCompanyForUser);

// PUT /api/companies/:id - Update company by ID (requires login)
router.put('/:id', authenticateUser, updateCompany);

// DELETE /api/companies/:id - Delete company by ID (requires login)
router.delete('/:id', authenticateUser, deleteCompany);

module.exports = router;
