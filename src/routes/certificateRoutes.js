const express = require('express');
const router = express.Router();
const {
  getAllCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getCertificatesByCompany,
  getActiveCertificates,
  checkCertificateEligibility
} = require('../controllers/certificateController');
const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/certificates - Get all certificates (requires login)
router.get('/', authenticateUser, getAllCertificates);

// GET /api/certificates/active - Get active certificates (requires login)
router.get('/active', authenticateUser, getActiveCertificates);

// GET /api/certificates/company/:companyId - Get certificates by company (requires login)
router.get('/company/:companyId', authenticateUser, getCertificatesByCompany);

// GET /api/certificates/eligibility/:companyId - Check certificate eligibility (requires login)
router.get('/eligibility/:companyId', authenticateUser, checkCertificateEligibility);

// GET /api/certificates/:id - Get certificate by ID (requires login)
router.get('/:id', authenticateUser, getCertificateById);

// POST /api/certificates - Create new certificate (requires login)
router.post('/', authenticateUser, createCertificate);

// PUT /api/certificates/:id - Update certificate by ID (requires login)
router.put('/:id', authenticateUser, updateCertificate);

// DELETE /api/certificates/:id - Delete certificate by ID (requires login)
router.delete('/:id', authenticateUser, deleteCertificate);

module.exports = router;
