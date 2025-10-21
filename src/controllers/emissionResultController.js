const { PrismaClient } = require("../../generated/prisma");
const aiRecommendationService = require('../services/aiRecommendationService');

const prisma = new PrismaClient();

// GET - Get all emission results (filtered by user's company via emissioninput)
const getAllEmissionResults = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to view emission results'
      });
    }
    
    const emissionResults = await prisma.emissionresult.findMany({
      where: {
        emissioninput: {
          company_id: user.company_id
        }
      },
      include: {
        emissioninput: {
          include: {
            company: true,
            emissioninputdetail: {
              include: {
                emissionsource: true
              }
            }
          }
        }
      },
      orderBy: {
        result_id: 'desc'
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
    const emissionResult = await prisma.emissionresult.findUnique({
      where: { result_id: parseInt(id) },
      include: {
        emissioninput: {
          include: {
            company: true,
            emissioninputdetail: {
              include: {
                emissionsource: true
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

// POST - Create new emission result (auto-use company_id from token)
const createEmissionResult = async (req, res) => {
  try {
    const { input_id } = req.body;
    const user = req.user;

    // Validation
    if (!input_id) {
      return res.status(400).json({
        success: false,
        message: 'input_id is required'
      });
    }

    if (!user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to create emission results'
      });
    }

    // Check if emission input exists and belongs to user's company
    const emissionInput = await prisma.emissioninput.findFirst({
      where: { 
        input_id: parseInt(input_id),
        company_id: user.company_id
      },
      include: {
        company: true,
        emissioninputdetail: {
          include: {
            emissionsource: true
          }
        },
        emissionresult: true
      }
    });

    if (!emissionInput) {
      return res.status(404).json({
        success: false,
        message: 'Emission input not found or does not belong to your company'
      });
    }

    // Check if result already exists for this input
    const existingResult = await prisma.emissionresult.findUnique({
      where: { input_id: parseInt(input_id) }
    });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: 'Emission result already exists for this input'
      });
    }

    // Compute total_emission from emissioninputdetail sum
    const details = await prisma.emissioninputdetail.findMany({
      where: { input_id: parseInt(input_id) },
      select: { emission_value: true }
    });

    const total_emission = details.reduce((sum, d) => sum + (d.emission_value || 0), 0);

    const emissionResult = await prisma.emissionresult.create({
      data: {
        input_id: parseInt(input_id),
        total_emission: total_emission,
        analisis: null
      },
      include: {
        emissioninput: {
          include: {
            company: true,
            emissioninputdetail: {
              include: {
                emissionsource: true
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

// PUT - Update emission result analisis
const updateEmissionResultAnalisis = async (req, res) => {
  try {
    const { id } = req.params;
    const { analisis } = req.body;

    // Validation
    if (!analisis) {
      return res.status(400).json({
        success: false,
        message: 'Analisis is required'
      });
    }

    // Check if emission result exists
    const existingResult = await prisma.emissionresult.findUnique({
      where: { result_id: parseInt(id) }
    });

    if (!existingResult) {
      return res.status(404).json({
        success: false,
        message: 'Emission result not found'
      });
    }

    const emissionResult = await prisma.emissionresult.update({
      where: { result_id: parseInt(id) },
      data: { analisis: analisis },
      include: {
        emissioninput: {
          include: {
            company: true,
            emissioninputdetail: {
              include: {
                emissionsource: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: emissionResult,
      message: 'Emission result analisis updated successfully'
    });
  } catch (error) {
    console.error('Error updating emission result analisis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emission result analisis',
      error: error.message
    });
  }
};

// PUT - Update emission result (full update)
const updateEmissionResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { total_emission, analisis } = req.body;

    // Check if emission result exists
    const existingResult = await prisma.emissionresult.findUnique({
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
    if (analisis !== undefined) updateData.analisis = analisis;

    const emissionResult = await prisma.emissionresult.update({
      where: { result_id: parseInt(id) },
      data: updateData,
      include: {
        emissioninput: {
          include: {
            company: true,
            emissioninputdetail: {
              include: {
                emissionsource: true
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
    const existingResult = await prisma.emissionresult.findUnique({
      where: { result_id: parseInt(id) }
    });

    if (!existingResult) {
      return res.status(404).json({
        success: false,
        message: 'Emission result not found'
      });
    }

    // Delete emission result
    await prisma.emissionresult.delete({
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

// POST - Generate AI analysis for emission result
const generateAIAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { useAI = true } = req.body;

    // Get emission result with full data
    const emissionResult = await prisma.emissionresult.findUnique({
      where: { result_id: parseInt(id) },
      include: {
        emissioninput: {
          include: {
            company: true,
            emissioninputdetail: {
              include: {
                emissionsource: true
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
      company: emissionResult.emissioninput.company,
      details: emissionResult.emissioninput.emissioninputdetail,
      total_emission: emissionResult.total_emission
    };


    let analysis;
    
    if (useAI) {
      try {
        // Generate AI analysis
        analysis = await aiRecommendationService.generateAnalysis(emissionData);
      } catch (aiError) {
        console.warn('AI service failed, using basic analysis:', aiError.message);
        // Fallback to basic analysis
        analysis = aiRecommendationService.generateBasicAnalysis(emissionData);
      }
    } else {
      // Use basic analysis
      analysis = aiRecommendationService.generateBasicAnalysis(emissionData);
    }

    // Compute sector-based level from company profile
    const computedLevel = aiRecommendationService.computeSectorLevel(
      emissionResult.emissioninput.company,
      emissionResult.total_emission
    );

    // Update emission result with analysis and level (if computed)
    const updatedResult = await prisma.emissionresult.update({
      where: { result_id: parseInt(id) },
      data: { 
        analisis: analysis,
        level: computedLevel || undefined
      },
      include: {
        emissioninput: {
          include: {
            company: true,
            emissioninputdetail: {
              include: {
                emissionsource: true
              }
            }
          }
        }
      }
    });

    // Get priority actions
    const priorityActions = aiRecommendationService.getPriorityActions(emissionResult.emissioninput.emissioninputdetail);
    const emissionLevel = aiRecommendationService.categorizeEmissionLevel(emissionResult.total_emission);

    res.json({
      success: true,
      data: {
        ...updatedResult,
        ai_analysis: {
          emission_level: emissionLevel,
          sector_level: computedLevel || null,
          priority_actions: priorityActions,
          generated_at: new Date().toISOString(),
          ai_used: useAI
        }
      },
      message: 'AI analysis generated successfully'
    });
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI analysis',
      error: error.message
    });
  }
};

// GET - Get emission result with AI analysis
const getEmissionResultWithAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    
    const emissionResult = await prisma.emissionresult.findUnique({
      where: { result_id: parseInt(id) },
      include: {
        emissioninput: {
          include: {
            company: true,
            emissioninputdetail: {
              include: {
                emissionsource: true
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
      company: emissionResult.emissioninput.company,
      details: emissionResult.emissioninput.emissioninputdetail,
      total_emission: emissionResult.total_emission
    };

    const priorityActions = aiRecommendationService.getPriorityActions(emissionResult.emissioninput.emissioninputdetail);
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
  updateEmissionResultAnalisis,
  updateEmissionResult,
  deleteEmissionResult,
  generateAIAnalysis,
  getEmissionResultWithAnalysis
};
