const express = require('express');
const router = express.Router();
const {
  getEmissionDetailsByInput,
  getEmissionDetailById,
  createEmissionDetail,
  updateEmissionDetail,
  deleteEmissionDetail
} = require('../controllers/emissionDetailController');
const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/emission-inputs/:inputId/details - Get all emission input details for a specific input (requires login)
router.get('/:inputId/details', authenticateUser, getEmissionDetailsByInput);

// GET /api/emission-details/:id - Get emission input detail by ID (requires login)
router.get('/:id', authenticateUser, getEmissionDetailById);

// POST /api/emission-details - Create new emission input detail (requires login)
router.post('/', authenticateUser, createEmissionDetail);

// PUT /api/emission-details/:id - Update emission input detail by ID (requires login)
router.put('/:id', authenticateUser, updateEmissionDetail);

// DELETE /api/emission-details/:id - Delete emission input detail by ID (requires login)
router.delete('/:id', authenticateUser, deleteEmissionDetail);

module.exports = router;
