const express = require('express');
const router = express.Router();
const {
  getAllEmissionInputs,
  getEmissionInputById,
  createEmissionInput,
  createEmissionInputWithDetails,
  deleteEmissionInput,
  getEmissionInputsByCompany
} = require('../controllers/emissionInputController');
const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/emission-inputs - Get all emission inputs (requires login)
router.get('/', authenticateUser, getAllEmissionInputs);

// GET /api/emission-inputs/company/:companyId - Get emission inputs by company (requires login)
router.get('/company/:companyId', authenticateUser, getEmissionInputsByCompany);

// GET /api/emission-inputs/:id - Get emission input by ID (requires login)
router.get('/:id', authenticateUser, getEmissionInputById);

// POST /api/emission-inputs - Create new emission input (requires login)
router.post('/', authenticateUser, createEmissionInput);

// POST /api/emission-inputs/with-details - Create emission input with details (requires login)
router.post('/with-details', authenticateUser, createEmissionInputWithDetails);

// DELETE /api/emission-inputs/:id - Delete emission input by ID (requires login)
router.delete('/:id', authenticateUser, deleteEmissionInput);

module.exports = router;
