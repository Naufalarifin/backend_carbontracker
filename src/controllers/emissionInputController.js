const { PrismaClient } = require("../../generated/prisma");
const { getCurrentMonthYear } = require('../utils/dateFormatter');

const prisma = new PrismaClient();

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
  });

// GET - Get all emission inputs (filtered by user's company)
const getAllEmissionInputs = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to view emission inputs'
      });
    }
    
    const emissionInputs = await prisma.emissioninput.findMany({
      where: { company_id: user.company_id },
      include: {
        company: true,
        details: {
          include: {
            source: true
          }
        },
        result: true
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });
    
    res.json({
      success: true,
      data: emissionInputs,
      message: 'Emission inputs retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission inputs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission inputs',
      error: error.message
    });
  }
};

// GET - Get emission input by ID
const getEmissionInputById = async (req, res) => {
  try {
    const { id } = req.params;
    const emissionInput = await prisma.emissioninput.findUnique({
      where: { input_id: parseInt(id) },
      include: {
        company: true,
        details: {
          include: {
            source: true
          }
        },
        result: true
      }
    });

    if (!emissionInput) {
      return res.status(404).json({
        success: false,
        message: 'Emission input not found'
      });
    }

    res.json({
      success: true,
      data: emissionInput,
      message: 'Emission input retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission input',
      error: error.message
    });
  }
};

// POST - Create new emission input (auto-use company_id from token)
const createEmissionInput = async (req, res) => {
  try {
    const { emission_source_id, input_date, consumption_value, unit, notes } = req.body;
    const user = req.user;

    // Validation
    if (!emission_source_id || !input_date || !consumption_value || !unit) {
      return res.status(400).json({
        success: false,
        message: 'emission_source_id, input_date, consumption_value, and unit are required'
      });
    }

    if (!user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to create emission inputs'
      });
    }

    // Check if emission source exists and belongs to user's company
    const emissionSource = await prisma.emissionsource.findFirst({
      where: { 
        source_id: parseInt(emission_source_id),
        company_id: user.company_id
      }
    });

    if (!emissionSource) {
      return res.status(404).json({
        success: false,
        message: 'Emission source not found or does not belong to your company'
      });
    }

    const emissionInput = await prisma.emissioninput.create({
      data: {
        emission_source_id: parseInt(emission_source_id),
        company_id: user.company_id,
        input_date: new Date(input_date),
        consumption_value: parseFloat(consumption_value),
        unit: unit,
        notes: notes || null
      },
      include: {
        company: true,
        source: true,
        details: true,
        result: true
      }
    });

    res.status(201).json({
      success: true,
      data: emissionInput,
      message: 'Emission input created successfully'
    });
  } catch (error) {
    console.error('Error creating emission input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emission input',
      error: error.message
    });
  }
};

// POST - Create emission input with details (integrated input)
const createEmissionInputWithDetails = async (req, res) => {
  try {
    // Debug: Check if Prisma client is properly initialized
    console.log('Debug - Prisma client:', !!prisma);
    console.log('Debug - Prisma emissioninput:', !!prisma?.emissioninput);
    console.log('Debug - Prisma emissionsource:', !!prisma?.emissionsource);
    
    if (!prisma) {
      console.error('Prisma client is null/undefined');
      return res.status(500).json({
        success: false,
        message: 'Database client not properly initialized',
        error: 'Prisma client is null/undefined'
      });
    }
    
    if (!prisma.emissioninput) {
      console.error('Prisma emissioninput model not available');
      return res.status(500).json({
        success: false,
        message: 'Database model not available',
        error: 'Emissioninput model not found in Prisma client'
      });
    }

    const { emission_data } = req.body;
    const user = req.user;

    // Validation
    if (!emission_data || !Array.isArray(emission_data)) {
      return res.status(400).json({
        success: false,
        message: 'emission_data array is required'
      });
    }

    if (!user?.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to create emission input'
      });
    }

    // Get company from token
    const company = await prisma.company.findUnique({
      where: { company_id: user.company_id }
    });

    // Get current month and year
    const { month, year } = getCurrentMonthYear();

    // Check if input already exists for this company, month, and year
    let existingInput;
    try {
      existingInput = await prisma.emissioninput.findFirst({
        where: {
          company_id: user.company_id,
          month: month,
          year: year
        }
      });
    } catch (error) {
      console.error('Error checking existing input:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error when checking existing input',
        error: error.message
      });
    }

    if (existingInput) {
      return res.status(409).json({
        success: false,
        message: `Emission input already exists for ${company.name} in ${month}/${year}`
      });
    }

    // Validate emission data
    for (const item of emission_data) {
      if (!item.source_name || !item.value) {
        return res.status(400).json({
          success: false,
          message: 'Each emission data must have source_name and value'
        });
      }
    }

    // Get all emission sources to validate source names
    let emissionSources;
    try {
      // emissionsource is global (does not have company_id in schema)
      emissionSources = await prisma.emissionsource.findMany();
    } catch (error) {
      console.error('Error fetching emission sources:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error when fetching emission sources',
        error: error.message
      });
    }
    
    const sourceMap = {};
    emissionSources.forEach(source => {
      sourceMap[source.name.toLowerCase()] = source;
    });

    // Validate source names and prepare details
    const detailsToCreate = [];
    for (const item of emission_data) {
      const source = sourceMap[item.source_name.toLowerCase()];
      if (!source) {
        return res.status(404).json({
          success: false,
          message: `Emission source '${item.source_name}' not found`
        });
      }

      detailsToCreate.push({
        source_id: source.source_id,
        value: parseFloat(item.value),
        emission_value: parseFloat(item.value) * source.emission_factor
      });
    }

    // Create emission input with details in transaction
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // Create emission input
        const emissionInput = await tx.emissioninput.create({
          data: {
            company_id: user.company_id,
            month: month,
            year: year
          }
        });

        // Create emission input details
        const details = [];
        for (const detailData of detailsToCreate) {
          const detail = await tx.emissioninputdetail.create({
            data: {
              input_id: emissionInput.input_id,
              source_id: detailData.source_id,
              value: detailData.value,
              emission_value: detailData.emission_value
            },
          });
          details.push(detail);
        }

        return {
          emissionInput: {
            ...emissionInput,
            company: company,
            details: details,
            result: null
          }
        };
      });
    } catch (error) {
      console.error('Error creating emission input with details:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error when creating emission input with details',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: result.emissionInput,
      message: 'Emission input with details created successfully'
    });
  } catch (error) {
    console.error('Error creating emission input with details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emission input with details',
      error: error.message
    });
  }
};

// DELETE - Delete emission input by ID
const deleteEmissionInput = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if emission input exists
    const existingInput = await prisma.emissioninput.findUnique({
      where: { input_id: parseInt(id) }
    });

    if (!existingInput) {
      return res.status(404).json({
        success: false,
        message: 'Emission input not found'
      });
    }

    // Delete emission input (cascade will handle related records)
    await prisma.emissioninput.delete({
      where: { input_id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Emission input deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emission input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emission input',
      error: error.message
    });
  }
};

// GET - Get emission inputs by company
const getEmissionInputsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const emissionInputs = await prisma.emissioninput.findMany({
      where: { company_id: parseInt(companyId) },
      include: {
        company: true,
        details: {
          include: {
            source: true
          }
        },
        result: true
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: emissionInputs,
      message: 'Emission inputs retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission inputs by company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission inputs',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmissionInputs,
  getEmissionInputById,
  createEmissionInput,
  createEmissionInputWithDetails,
  deleteEmissionInput,
  getEmissionInputsByCompany
};