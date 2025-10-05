const express = require('express');
const router = express.Router();
const {
  getAllEmissionSources,
  getEmissionSourceById,
  createEmissionSource,
  updateEmissionSource,
  deleteEmissionSource
} = require('../controllers/emissionSourceController');

// GET /api/emission-sources - Get all emission sources
router.get('/', getAllEmissionSources);

// GET /api/emission-sources/:id - Get emission source by ID
router.get('/:id', getEmissionSourceById);

// POST /api/emission-sources - Create new emission source
router.post('/', createEmissionSource);

// PUT /api/emission-sources/:id - Update emission source by ID
router.put('/:id', updateEmissionSource);

// DELETE /api/emission-sources/:id - Delete emission source by ID
router.delete('/:id', deleteEmissionSource);

module.exports = router;
