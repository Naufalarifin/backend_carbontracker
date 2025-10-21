const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

// GET - Get all certificates (filtered by user's company)
const getAllCertificates = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to view certificates'
      });
    }
    
    const certificates = await prisma.certificate.findMany({
      where: { company_id: user.company_id },
      include: {
        company: true
      },
      orderBy: {
        issued_date: 'desc'
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

// Helper function to validate 12 consecutive months of "Baik" level results
const validateTwelveConsecutiveMonths = async (company_id) => {
  try {
    // Get all emission inputs for the company, ordered by year and month
    const emissionInputs = await prisma.emissioninput.findMany({
      where: { company_id: parseInt(company_id) },
      include: {
        emissionresult: true
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    });

    if (emissionInputs.length < 12) {
      return {
        valid: false,
        message: `❌ Sertifikat tidak dapat dibuat!`,
        details: `Perusahaan membutuhkan minimal 12 bulan data emisi berturut-turut. Saat ini hanya memiliki ${emissionInputs.length} bulan data.`,
        requirements: {
          needed: 12,
          current: emissionInputs.length,
          missing: 12 - emissionInputs.length
        }
      };
    }

    // Group inputs by year-month for easier processing
    const inputsByPeriod = {};
    emissionInputs.forEach(input => {
      const key = `${input.year}-${input.month.toString().padStart(2, '0')}`;
      inputsByPeriod[key] = input;
    });

    // Find all possible 12-month consecutive sequences
    const periods = Object.keys(inputsByPeriod).sort();
    
    for (let i = 0; i <= periods.length - 12; i++) {
      const sequence = periods.slice(i, i + 12);
      let isValidSequence = true;
      let missingMonths = [];
      let nonBaikResults = [];

      // Check if this 12-month sequence is consecutive
      for (let j = 0; j < 12; j++) {
        const currentPeriod = sequence[j];
        const [year, month] = currentPeriod.split('-').map(Number);
        
        // Calculate expected next month/year
        let expectedMonth = month + 1;
        let expectedYear = year;
        if (expectedMonth > 12) {
          expectedMonth = 1;
          expectedYear = year + 1;
        }

        // Check if next period exists (except for the last one)
        if (j < 11) {
          const nextPeriod = `${expectedYear}-${expectedMonth.toString().padStart(2, '0')}`;
          if (!inputsByPeriod[nextPeriod]) {
            isValidSequence = false;
            missingMonths.push(`${expectedMonth}/${expectedYear}`);
            break;
          }
        }

        // Check if result exists and level is "Baik"
        const input = inputsByPeriod[currentPeriod];
        if (!input.emissionresult) {
          isValidSequence = false;
          missingMonths.push(`${month}/${year} (no result)`);
          break;
        }

        if (input.emissionresult.level !== 'Baik') {
          isValidSequence = false;
          nonBaikResults.push({
            period: `${month}/${year}`,
            level: input.emissionresult.level
          });
          break;
        }
      }

      if (isValidSequence) {
        return {
          valid: true,
          message: '✅ Perusahaan memenuhi syarat untuk sertifikat!',
          details: 'Perusahaan memiliki 12 bulan berturut-turut dengan semua hasil level "Baik".',
          sequence: sequence.map(period => {
            const [year, month] = period.split('-').map(Number);
            return `${month}/${year}`;
          }),
          requirements: {
            status: 'LENGKAP',
            months: 12,
            level: 'Semua "Baik"',
            consecutive: true
          }
        };
      }
    }

    return {
      valid: false,
      message: '❌ Sertifikat tidak dapat dibuat!',
      details: 'Tidak ditemukan 12 bulan berturut-turut dengan semua hasil level "Baik".',
      requirements: {
        needed: '12 bulan berturut-turut dengan level "Baik"',
        current: `${emissionInputs.length} bulan data tersedia`,
        periods: periods.map(period => {
          const [year, month] = period.split('-').map(Number);
          return `${month}/${year}`;
        })
      },
      suggestions: [
        'Pastikan ada data emisi untuk 12 bulan berturut-turut',
        'Semua hasil analisis harus memiliki level "Baik"',
        'Tidak boleh ada bulan yang kosong dalam 12 bulan berturut-turut'
      ]
    };
  } catch (error) {
    console.error('Error validating 12 consecutive months:', error);
    return {
      valid: false,
      message: '❌ Terjadi kesalahan saat memvalidasi data emisi',
      details: 'Sistem tidak dapat memproses data emisi perusahaan saat ini.',
      error: error.message,
      suggestions: [
        'Pastikan database terhubung dengan baik',
        'Periksa format data emisi perusahaan',
        'Hubungi administrator sistem jika masalah berlanjut'
      ]
    };
  }
};

// POST - Create new certificate (auto-use company_id from token)
const createCertificate = async (req, res) => {
  try {
    const { issued_date, valid_until } = req.body;
    const user = req.user;

    // Validation
    if (!issued_date) {
      return res.status(400).json({
        success: false,
        message: 'issued_date is required'
      });
    }

    if (!user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to create certificates'
      });
    }

    // Validate 12 consecutive months of "Baik" level results
    const validation = await validateTwelveConsecutiveMonths(user.company_id);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        details: validation.details,
        requirements: validation.requirements,
        suggestions: validation.suggestions || null,
        validation_details: validation
      });
    }

    // Validate dates
    const issueDate = new Date(issued_date);
    const expiryDate = valid_until ? new Date(valid_until) : null;

    if (isNaN(issueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issued_date format'
      });
    }

    if (expiryDate && isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid valid_until format'
      });
    }

    if (expiryDate && expiryDate <= issueDate) {
      return res.status(400).json({
        success: false,
        message: 'Valid until date must be after issued date'
      });
    }

    // Generate certificate number
    const certificateCount = await prisma.certificate.count({
      where: { company_id: user.company_id }
    });
    const certificateNumber = `CERT-${user.company_id}-${String(certificateCount + 1).padStart(3, '0')}`;

    const certificate = await prisma.certificate.create({
      data: {
        company_id: user.company_id,
        issue_date: issueDate,
        expiry_date: expiryDate
      },
      include: {
        company: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...certificate,
        certificate_number: certificateNumber,
        certificate_type: 'Carbon Footprint Certificate',
        description: null
      },
      message: '🎉 Certificate created successfully!',
      details: 'Certificate has been issued for your company.',
      validation: {
        message: validation.message,
        details: validation.details,
        sequence: validation.sequence,
        requirements: validation.requirements
      }
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

// GET - Check certificate eligibility for company
const checkCertificateEligibility = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { company_id: parseInt(companyId) }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Validate 12 consecutive months of "Baik" level results
    const validation = await validateTwelveConsecutiveMonths(companyId);

    res.json({
      success: true,
      data: {
        company_id: parseInt(companyId),
        company_name: company.name,
        eligible: validation.valid,
        validation: validation
      },
      message: validation.valid ? 'Company is eligible for certificate' : 'Company is not eligible for certificate'
    });
  } catch (error) {
    console.error('Error checking certificate eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check certificate eligibility',
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
  getActiveCertificates,
  checkCertificateEligibility
};
