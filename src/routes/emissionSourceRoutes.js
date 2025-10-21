const express = require('express');
const router = express.Router();
const {
  getAllEmissionSources,
  getEmissionSourceById,
  createEmissionSource,
  updateEmissionSource,
  deleteEmissionSource
} = require('../controllers/emissionSourceController');
const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/emission-sources - Get all emission sources (requires login)
router.get('/', authenticateUser, getAllEmissionSources);

// GET /api/emission-sources/:id - Get emission source by ID (requires login)
router.get('/:id', authenticateUser, getEmissionSourceById);

// POST /api/emission-sources - Create new emission source (requires login)
router.post('/', authenticateUser, createEmissionSource);

// PUT /api/emission-sources/:id - Update emission source by ID (requires login)
router.put('/:id', authenticateUser, updateEmissionSource);

// DELETE /api/emission-sources/:id - Delete emission source by ID (requires login)
router.delete('/:id', authenticateUser, deleteEmissionSource);

module.exports = router;
