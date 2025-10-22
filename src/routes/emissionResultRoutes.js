const express = require('express');
const router = express.Router();
const {
  getEmissionResultDebug,
  getLatestEmissionResult,
  getAllEmissionResults,
  getEmissionResultById,
  createEmissionResult,
  updateEmissionResultAnalisis,
  updateEmissionResult,
  deleteEmissionResult,
  updateEmissionCategories,
  generateAIAnalysis,
  getEmissionResultWithAnalysis
} = require('../controllers/emissionResultController');
const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/emission-results - Get all emission results (requires login)
router.get('/', authenticateUser, getAllEmissionResults);

// GET /api/emission-results/latest - Get latest emission result (requires login)
router.get('/latest', authenticateUser, getLatestEmissionResult);

// GET /api/emission-results/:id - Get emission result by ID (requires login)
router.get('/:id', authenticateUser, getEmissionResultById);

// GET /api/emission-results/:id/analysis - Get emission result with AI analysis (requires login)
router.get('/:id/analysis', authenticateUser, getEmissionResultWithAnalysis);

// GET /api/emission-results/:id/debug - Get emission result with debug info (requires login)
router.get('/:id/debug', authenticateUser, getEmissionResultDebug);

// POST /api/emission-results - Create new emission result (requires login)
router.post('/', authenticateUser, createEmissionResult);

// POST /api/emission-results/:id/ai-analysis - Generate AI analysis (requires login)
router.post('/:id/ai-analysis', authenticateUser, generateAIAnalysis);

// POST /api/emission-results/:id/categories - Update emission categories (requires login)
router.post('/:id/categories', authenticateUser, updateEmissionCategories);

// PUT /api/emission-results/:id/analisis - Update emission result analisis only (requires login)
router.put('/:id/analisis', authenticateUser, updateEmissionResultAnalisis);

// PUT /api/emission-results/:id - Update emission result (requires login)
router.put('/:id', authenticateUser, updateEmissionResult);

// DELETE /api/emission-results/:id - Delete emission result by ID (requires login)
router.delete('/:id', authenticateUser, deleteEmissionResult);

module.exports = router;
