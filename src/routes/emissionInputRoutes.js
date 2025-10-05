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

// GET /api/emission-inputs - Get all emission inputs
router.get('/', getAllEmissionInputs);

// GET /api/emission-inputs/company/:companyId - Get emission inputs by company
router.get('/company/:companyId', getEmissionInputsByCompany);

// GET /api/emission-inputs/:id - Get emission input by ID
router.get('/:id', getEmissionInputById);

// POST /api/emission-inputs - Create new emission input
router.post('/', createEmissionInput);

// POST /api/emission-inputs/with-details - Create emission input with details (integrated)
router.post('/with-details', createEmissionInputWithDetails);

// DELETE /api/emission-inputs/:id - Delete emission input by ID
router.delete('/:id', deleteEmissionInput);

module.exports = router;
