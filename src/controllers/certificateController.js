const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

// GET - Get all certificates
const getAllCertificates = async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        company: true
      },
      orderBy: {
        issue_date: 'desc'
      }
    });
    
    res.json({
      success: true,
      data: certificates,
      message: 'Certificates retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates',
      error: error.message
    });
  }
};

// GET - Get certificate by ID
const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const certificate = await prisma.certificate.findUnique({
      where: { certificate_id: parseInt(id) },
      include: {
        company: true
      }
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      data: certificate,
      message: 'Certificate retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificate',
      error: error.message
    });
  }
};

// POST - Create new certificate
const createCertificate = async (req, res) => {
  try {
    const { company_id, issue_date, expiry_date, level } = req.body;

    // Validation
    if (!company_id || !issue_date) {
      return res.status(400).json({
        success: false,
        message: 'Company ID and issue date are required'
      });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { company_id: parseInt(company_id) }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Validate dates
    const issueDate = new Date(issue_date);
    const expiryDate = expiry_date ? new Date(expiry_date) : null;

    if (isNaN(issueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue date format'
      });
    }

    if (expiryDate && isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expiry date format'
      });
    }

    if (expiryDate && expiryDate <= issueDate) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after issue date'
      });
    }

    const certificate = await prisma.certificate.create({
      data: {
        company_id: parseInt(company_id),
        issue_date: issueDate,
        expiry_date: expiryDate,
        level: level || null
      },
      include: {
        company: true
      }
    });

    res.status(201).json({
      success: true,
      data: certificate,
      message: 'Certificate created successfully'
    });
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create certificate',
      error: error.message
    });
  }
};

// PUT - Update certificate by ID
const updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { issue_date, expiry_date, level } = req.body;

    // Check if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { certificate_id: parseInt(id) }
    });

    if (!existingCertificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Validate dates if provided
    let issueDate = existingCertificate.issue_date;
    let expiryDate = existingCertificate.expiry_date;

    if (issue_date) {
      issueDate = new Date(issue_date);
      if (isNaN(issueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid issue date format'
        });
      }
    }

    if (expiry_date !== undefined) {
      expiryDate = expiry_date ? new Date(expiry_date) : null;
      if (expiryDate && isNaN(expiryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expiry date format'
        });
      }
    }

    if (expiryDate && issueDate && expiryDate <= issueDate) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after issue date'
      });
    }

    const certificate = await prisma.certificate.update({
      where: { certificate_id: parseInt(id) },
      data: {
        issue_date: issueDate,
        expiry_date: expiryDate,
        level: level !== undefined ? level : existingCertificate.level
      },
      include: {
        company: true
      }
    });

    res.json({
      success: true,
      data: certificate,
      message: 'Certificate updated successfully'
    });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update certificate',
      error: error.message
    });
  }
};

// DELETE - Delete certificate by ID
const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { certificate_id: parseInt(id) }
    });

    if (!existingCertificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Delete certificate
    await prisma.certificate.delete({
      where: { certificate_id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete certificate',
      error: error.message
    });
  }
};

// GET - Get certificates by company
const getCertificatesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const certificates = await prisma.certificate.findMany({
      where: { company_id: parseInt(companyId) },
      include: {
        company: true
      },
      orderBy: {
        issue_date: 'desc'
      }
    });

    res.json({
      success: true,
      data: certificates,
      message: 'Certificates retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting certificates by company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates',
      error: error.message
    });
  }
};

// GET - Get active certificates (not expired)
const getActiveCertificates = async (req, res) => {
  try {
    const now = new Date();
    
    const certificates = await prisma.certificate.findMany({
      where: {
        OR: [
          { expiry_date: null },
          { expiry_date: { gt: now } }
        ]
      },
      include: {
        company: true
      },
      orderBy: {
        issue_date: 'desc'
      }
    });

    res.json({
      success: true,
      data: certificates,
      message: 'Active certificates retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting active certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active certificates',
      error: error.message
    });
  }
};

module.exports = {
  getAllCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getCertificatesByCompany,
  getActiveCertificates
};
