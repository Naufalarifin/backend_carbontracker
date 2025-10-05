const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

// GET - Get all emission input details for a specific input
const getEmissionDetailsByInput = async (req, res) => {
  try {
    const { inputId } = req.params;
    
    const details = await prisma.emissionInputDetail.findMany({
      where: { input_id: parseInt(inputId) },
      include: {
        input: {
          include: {
            company: true
          }
        },
        source: true
      },
      orderBy: {
        detail_id: 'asc'
      }
    });

    res.json({
      success: true,
      data: details,
      message: 'Emission input details retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission input details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission input details',
      error: error.message
    });
  }
};

// GET - Get emission input detail by ID
const getEmissionDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const detail = await prisma.emissionInputDetail.findUnique({
      where: { detail_id: parseInt(id) },
      include: {
        input: {
          include: {
            company: true
          }
        },
        source: true
      }
    });

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: 'Emission input detail not found'
      });
    }

    res.json({
      success: true,
      data: detail,
      message: 'Emission input detail retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission input detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission input detail',
      error: error.message
    });
  }
};

// POST - Create new emission input detail
const createEmissionDetail = async (req, res) => {
  try {
    const { input_id, source_id, value } = req.body;

    // Validation
    if (!input_id || !source_id || !value) {
      return res.status(400).json({
        success: false,
        message: 'Input ID, source ID, and value are required'
      });
    }

    // Check if emission input exists
    const emissionInput = await prisma.emissionInput.findUnique({
      where: { input_id: parseInt(input_id) }
    });

    if (!emissionInput) {
      return res.status(404).json({
        success: false,
        message: 'Emission input not found'
      });
    }

    // Check if emission source exists
    const emissionSource = await prisma.emissionSource.findUnique({
      where: { source_id: parseInt(source_id) }
    });

    if (!emissionSource) {
      return res.status(404).json({
        success: false,
        message: 'Emission source not found'
      });
    }

    // Check if detail already exists for this input and source
    const existingDetail = await prisma.emissionInputDetail.findFirst({
      where: {
        input_id: parseInt(input_id),
        source_id: parseInt(source_id)
      }
    });

    if (existingDetail) {
      return res.status(409).json({
        success: false,
        message: 'Emission input detail already exists for this input and source'
      });
    }

    // Calculate emission value
    const emission_value = parseFloat(value) * emissionSource.emission_factor;

    const detail = await prisma.emissionInputDetail.create({
      data: {
        input_id: parseInt(input_id),
        source_id: parseInt(source_id),
        value: parseFloat(value),
        emission_value: emission_value
      },
      include: {
        input: {
          include: {
            company: true
          }
        },
        source: true
      }
    });

    res.status(201).json({
      success: true,
      data: detail,
      message: 'Emission input detail created successfully'
    });
  } catch (error) {
    console.error('Error creating emission input detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emission input detail',
      error: error.message
    });
  }
};

// PUT - Update emission input detail by ID
const updateEmissionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { source_id, value } = req.body;

    // Check if detail exists
    const existingDetail = await prisma.emissionInputDetail.findUnique({
      where: { detail_id: parseInt(id) }
    });

    if (!existingDetail) {
      return res.status(404).json({
        success: false,
        message: 'Emission input detail not found'
      });
    }

    // Validation
    if (!source_id || !value) {
      return res.status(400).json({
        success: false,
        message: 'Source ID and value are required'
      });
    }

    // Check if emission source exists
    const emissionSource = await prisma.emissionSource.findUnique({
      where: { source_id: parseInt(source_id) }
    });

    if (!emissionSource) {
      return res.status(404).json({
        success: false,
        message: 'Emission source not found'
      });
    }

    // Calculate emission value
    const emission_value = parseFloat(value) * emissionSource.emission_factor;

    const detail = await prisma.emissionInputDetail.update({
      where: { detail_id: parseInt(id) },
      data: {
        source_id: parseInt(source_id),
        value: parseFloat(value),
        emission_value: emission_value
      },
      include: {
        input: {
          include: {
            company: true
          }
        },
        source: true
      }
    });

    res.json({
      success: true,
      data: detail,
      message: 'Emission input detail updated successfully'
    });
  } catch (error) {
    console.error('Error updating emission input detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emission input detail',
      error: error.message
    });
  }
};

// DELETE - Delete emission input detail by ID
const deleteEmissionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if detail exists
    const existingDetail = await prisma.emissionInputDetail.findUnique({
      where: { detail_id: parseInt(id) }
    });

    if (!existingDetail) {
      return res.status(404).json({
        success: false,
        message: 'Emission input detail not found'
      });
    }

    // Delete detail
    await prisma.emissionInputDetail.delete({
      where: { detail_id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Emission input detail deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emission input detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emission input detail',
      error: error.message
    });
  }
};

module.exports = {
  getEmissionDetailsByInput,
  getEmissionDetailById,
  createEmissionDetail,
  updateEmissionDetail,
  deleteEmissionDetail
};
