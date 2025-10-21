const express = require('express');
const router = express.Router();
const {
  getAllEmissionResults,
  getEmissionResultById,
  createEmissionResult,
  updateEmissionResultAnalisis,
  updateEmissionResult,
  deleteEmissionResult,
  generateAIAnalysis,
  getEmissionResultWithAnalysis
} = require('../controllers/emissionResultController');

// GET /api/emission-results - Get all emission results
router.get('/', getAllEmissionResults);

// GET /api/emission-results/:id - Get emission result by ID
router.get('/:id', getEmissionResultById);

// GET /api/emission-results/:id/analysis - Get emission result with AI analysis
router.get('/:id/analysis', getEmissionResultWithAnalysis);

// POST /api/emission-results - Create new emission result
router.post('/', createEmissionResult);

// POST /api/emission-results/:id/ai-analysis - Generate AI analysis
router.post('/:id/ai-analysis', generateAIAnalysis);

// PUT /api/emission-results/:id/analisis - Update emission result analisis only
router.put('/:id/analisis', updateEmissionResultAnalisis);

// PUT /api/emission-results/:id - Update emission result (full update)
router.put('/:id', updateEmissionResult);

// DELETE /api/emission-results/:id - Delete emission result by ID
router.delete('/:id', deleteEmissionResult);

module.exports = router;
