const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

// GET - Get all emission sources
const getAllEmissionSources = async (req, res) => {
  try {
    const emissionSources = await prisma.emissionsource.findMany({
      include: {
        details: true
      }
    });
    
    res.json({
      success: true,
      data: emissionSources,
      message: 'Emission sources retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission sources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission sources',
      error: error.message
    });
  }
};

// GET - Get emission source by ID
const getEmissionSourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const emissionSource = await prisma.emissionsource.findUnique({
      where: { source_id: parseInt(id) },
      include: {
        details: true
      }
    });

    if (!emissionSource) {
      return res.status(404).json({
        success: false,
        message: 'Emission source not found'
      });
    }

    res.json({
      success: true,
      data: emissionSource,
      message: 'Emission source retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission source',
      error: error.message
    });
  }
};

// POST - Create new emission source
const createEmissionSource = async (req, res) => {
  try {
    const { name, unit, emission_factor, kategori } = req.body;

    // Validation
    if (!name || !unit || !emission_factor) {
      return res.status(400).json({
        success: false,
        message: 'Name, unit, and emission_factor are required'
      });
    }

    const emissionSource = await prisma.emissionsource.create({
      data: {
        name,
        unit,
        emission_factor: parseFloat(emission_factor),
        kategori: kategori || null
      },
      include: {
        details: true
      }
    });

    res.status(201).json({
      success: true,
      data: emissionSource,
      message: 'Emission source created successfully'
    });
  } catch (error) {
    console.error('Error creating emission source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emission source',
      error: error.message
    });
  }
};

// PUT - Update emission source by ID
const updateEmissionSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, emission_factor, kategori } = req.body;

    // Check if emission source exists
    const existingSource = await prisma.emissionsource.findUnique({
      where: { source_id: parseInt(id) }
    });

    if (!existingSource) {
      return res.status(404).json({
        success: false,
        message: 'Emission source not found'
      });
    }

    // Validation
    if (!name || !unit || !emission_factor) {
      return res.status(400).json({
        success: false,
        message: 'Name, unit, and emission_factor are required'
      });
    }

    const emissionSource = await prisma.emissionsource.update({
      where: { source_id: parseInt(id) },
      data: {
        name,
        unit,
        emission_factor: parseFloat(emission_factor),
        kategori: kategori || null
      },
      include: {
        details: true
      }
    });

    res.json({
      success: true,
      data: emissionSource,
      message: 'Emission source updated successfully'
    });
  } catch (error) {
    console.error('Error updating emission source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emission source',
      error: error.message
    });
  }
};

// DELETE - Delete emission source by ID
const deleteEmissionSource = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if emission source exists
    const existingSource = await prisma.emissionsource.findUnique({
      where: { source_id: parseInt(id) }
    });

    if (!existingSource) {
      return res.status(404).json({
        success: false,
        message: 'Emission source not found'
      });
    }

    // Delete emission source
    await prisma.emissionsource.delete({
      where: { source_id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Emission source deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emission source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emission source',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmissionSources,
  getEmissionSourceById,
  createEmissionSource,
  updateEmissionSource,
  deleteEmissionSource
};
