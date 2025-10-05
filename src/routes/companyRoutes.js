const express = require('express');
const router = express.Router();
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  createCompanyForUser,
  deleteCompany
} = require('../controllers/companyController');

// GET /api/companies - Get all companies
router.get('/', getAllCompanies);

// GET /api/companies/:id - Get company by ID
router.get('/:id', getCompanyById);

// POST /api/companies - Create new company
router.post('/', createCompany);

// POST /api/companies/for-user - Create company for existing user
router.post('/for-user', createCompanyForUser);

// DELETE /api/companies/:id - Delete company by ID
router.delete('/:id', deleteCompany);

module.exports = router;
