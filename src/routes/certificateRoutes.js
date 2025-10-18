const express = require('express');
const router = express.Router();
const {
  getAllCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getCertificatesByCompany,
  getActiveCertificates
} = require('../controllers/certificateController');

// GET /api/certificates - Get all certificates
router.get('/', getAllCertificates);

// GET /api/certificates/active - Get active certificates (not expired)
router.get('/active', getActiveCertificates);

// GET /api/certificates/company/:companyId - Get certificates by company
router.get('/company/:companyId', getCertificatesByCompany);

// GET /api/certificates/:id - Get certificate by ID
router.get('/:id', getCertificateById);

// POST /api/certificates - Create new certificate
router.post('/', createCertificate);

// PUT /api/certificates/:id - Update certificate by ID
router.put('/:id', updateCertificate);

// DELETE /api/certificates/:id - Delete certificate by ID
router.delete('/:id', deleteCertificate);

module.exports = router;
