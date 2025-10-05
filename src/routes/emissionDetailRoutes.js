const express = require('express');
const router = express.Router();
const {
  getEmissionDetailsByInput,
  getEmissionDetailById,
  createEmissionDetail,
  updateEmissionDetail,
  deleteEmissionDetail
} = require('../controllers/emissionDetailController');

// GET /api/emission-inputs/:inputId/details - Get all emission input details for a specific input
router.get('/:inputId/details', getEmissionDetailsByInput);

// GET /api/emission-details/:id - Get emission input detail by ID
router.get('/:id', getEmissionDetailById);

// POST /api/emission-details - Create new emission input detail
router.post('/', createEmissionDetail);

// PUT /api/emission-details/:id - Update emission input detail by ID
router.put('/:id', updateEmissionDetail);

// DELETE /api/emission-details/:id - Delete emission input detail by ID
router.delete('/:id', deleteEmissionDetail);

module.exports = router;
