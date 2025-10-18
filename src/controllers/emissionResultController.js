const { PrismaClient } = require("../../generated/prisma");
const aiRecommendationService = require('../services/aiRecommendationService');

const prisma = new PrismaClient();

// GET - Get all emission results
const getAllEmissionResults = async (req, res) => {
  try {
    const emissionResults = await prisma.emissionResult.findMany({
      include: {
        input: {
          include: {
            company: true,
            details: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: emissionResults,
      message: 'Emission results retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission results',
      error: error.message
    });
  }
};

// GET - Get emission result by ID
const getEmissionResultById = async (req, res) => {
  try {
    const { id } = req.params;
    const emissionResult = await prisma.emissionResult.findUnique({
      where: { result_id: parseInt(id) },
      include: {
        input: {
          include: {
            company: true,
            details: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    if (!emissionResult) {
      return res.status(404).json({
        success: false,
        message: 'Emission result not found'
      });
    }

    res.json({
      success: true,
      data: emissionResult,
      message: 'Emission result retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission result',
      error: error.message
    });
  }
};

// POST - Create new emission result
const createEmissionResult = async (req, res) => {
  try {
    const { input_id, total_emission, rekomendasi } = req.body;

    // Validation
    if (!input_id || !total_emission) {
      return res.status(400).json({
        success: false,
        message: 'Input ID and total emission are required'
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

    // Check if result already exists for this input
    const existingResult = await prisma.emissionResult.findUnique({
      where: { input_id: parseInt(input_id) }
    });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: 'Emission result already exists for this input'
      });
    }

    const emissionResult = await prisma.emissionResult.create({
      data: {
        input_id: parseInt(input_id),
        total_emission: parseFloat(total_emission),
        rekomendasi: rekomendasi || 'calculated'
      },
      include: {
        input: {
          include: {
            company: true,
            details: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: emissionResult,
      message: 'Emission result created successfully'
    });
  } catch (error) {
    console.error('Error creating emission result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emission result',
      error: error.message
    });
  }
};

// PUT - Update emission result rekomendasi
const updateEmissionResultRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { rekomendasi } = req.body;

    // Validation
    if (!rekomendasi) {
      return res.status(400).json({
        success: false,
        message: 'Rekomendasi is required'
      });
    }

    // Check if emission result exists
    const existingResult = await prisma.emissionResult.findUnique({
      where: { result_id: parseInt(id) }
    });

    if (!existingResult) {
      return res.status(404).json({
        success: false,
        message: 'Emission result not found'
      });
    }

    // Valid rekomendasi values
    const validRekomendasi = [
      'calculated',
      'pending',
      'under_review',
      'approved',
      'rejected',
      'certified',
      'draft',
      'final'
    ];

    if (!validRekomendasi.includes(rekomendasi)) {
      return res.status(400).json({
        success: false,
        message: `Invalid rekomendasi. Valid rekomendasi: ${validRekomendasi.join(', ')}`
      });
    }

    const emissionResult = await prisma.emissionResult.update({
      where: { result_id: parseInt(id) },
      data: { rekomendasi: rekomendasi },
      include: {
        input: {
          include: {
            company: true,
            details: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: emissionResult,
      message: 'Emission result rekomendasi updated successfully'
    });
  } catch (error) {
    console.error('Error updating emission result rekomendasi:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emission result rekomendasi',
      error: error.message
    });
  }
};

// PUT - Update emission result (full update)
const updateEmissionResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { total_emission, rekomendasi } = req.body;

    // Check if emission result exists
    const existingResult = await prisma.emissionResult.findUnique({
      where: { result_id: parseInt(id) }
    });

    if (!existingResult) {
      return res.status(404).json({
        success: false,
        message: 'Emission result not found'
      });
    }

    const updateData = {};
    if (total_emission !== undefined) updateData.total_emission = parseFloat(total_emission);
    if (rekomendasi !== undefined) updateData.rekomendasi = rekomendasi;

    const emissionResult = await prisma.emissionResult.update({
      where: { result_id: parseInt(id) },
      data: updateData,
      include: {
        input: {
          include: {
            company: true,
            details: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: emissionResult,
      message: 'Emission result updated successfully'
    });
  } catch (error) {
    console.error('Error updating emission result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emission result',
      error: error.message
    });
  }
};

// DELETE - Delete emission result by ID
const deleteEmissionResult = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if emission result exists
    const existingResult = await prisma.emissionResult.findUnique({
      where: { result_id: parseInt(id) }
    });

    if (!existingResult) {
      return res.status(404).json({
        success: false,
        message: 'Emission result not found'
      });
    }

    // Delete emission result
    await prisma.emissionResult.delete({
      where: { result_id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Emission result deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emission result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emission result',
      error: error.message
    });
  }
};

// POST - Generate AI recommendation for emission result
const generateAIRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { useAI = true } = req.body;

    // Get emission result with full data
    const emissionResult = await prisma.emissionResult.findUnique({
      where: { result_id: parseInt(id) },
      include: {
        input: {
          include: {
            company: true,
            details: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    if (!emissionResult) {
      return res.status(404).json({
        success: false,
        message: 'Emission result not found'
      });
    }

    // Prepare emission data for AI analysis
    const emissionData = {
      company: emissionResult.input.company,
      details: emissionResult.input.details,
      total_emission: emissionResult.total_emission
    };

    let recommendation;
    
    if (useAI) {
      try {
        // Generate AI recommendation
        recommendation = await aiRecommendationService.generateRecommendation(emissionData);
      } catch (aiError) {
        console.warn('AI service failed, using basic recommendation:', aiError.message);
        // Fallback to basic recommendation
        recommendation = aiRecommendationService.generateBasicRecommendation(emissionData);
      }
    } else {
      // Use basic recommendation
      recommendation = aiRecommendationService.generateBasicRecommendation(emissionData);
    }

    // Update emission result with recommendation
    const updatedResult = await prisma.emissionResult.update({
      where: { result_id: parseInt(id) },
      data: { rekomendasi: recommendation },
      include: {
        input: {
          include: {
            company: true,
            details: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    // Get priority actions
    const priorityActions = aiRecommendationService.getPriorityActions(emissionResult.input.details);
    const emissionLevel = aiRecommendationService.categorizeEmissionLevel(emissionResult.total_emission);

    res.json({
      success: true,
      data: {
        ...updatedResult,
        ai_analysis: {
          emission_level: emissionLevel,
          priority_actions: priorityActions,
          generated_at: new Date().toISOString(),
          ai_used: useAI
        }
      },
      message: 'AI recommendation generated successfully'
    });
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendation',
      error: error.message
    });
  }
};

// GET - Get emission result with AI analysis
const getEmissionResultWithAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    
    const emissionResult = await prisma.emissionResult.findUnique({
      where: { result_id: parseInt(id) },
      include: {
        input: {
          include: {
            company: true,
            details: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    if (!emissionResult) {
      return res.status(404).json({
        success: false,
        message: 'Emission result not found'
      });
    }

    // Generate analysis data
    const emissionData = {
      company: emissionResult.input.company,
      details: emissionResult.input.details,
      total_emission: emissionResult.total_emission
    };

    const priorityActions = aiRecommendationService.getPriorityActions(emissionResult.input.details);
    const emissionLevel = aiRecommendationService.categorizeEmissionLevel(emissionResult.total_emission);

    res.json({
      success: true,
      data: {
        ...emissionResult,
        ai_analysis: {
          emission_level: emissionLevel,
          priority_actions: priorityActions,
          generated_at: new Date().toISOString()
        }
      },
      message: 'Emission result with analysis retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission result with analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emission result with analysis',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmissionResults,
  getEmissionResultById,
  createEmissionResult,
  updateEmissionResultRekomendasi,
  updateEmissionResult,
  deleteEmissionResult,
  generateAIRecommendation,
  getEmissionResultWithAnalysis
};
