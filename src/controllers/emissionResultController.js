const { PrismaClient } = require("../../generated/prisma");
const aiRecommendationService = require('../services/aiRecommendationService');

const prisma = new PrismaClient();

// Helper function to get category from emissionsource
const getEmissionCategory = (emissionSource) => {
  // Use kategori from database, fallback to default if null
  const category = emissionSource.kategori?.toLowerCase();
  
  // Validate category is one of the 4 allowed categories
  const validCategories = ['energi', 'transportasi', 'produksi', 'limbah'];
  
  if (validCategories.includes(category)) {
    return category;
  }
  
  // Default to energi if kategori is null or invalid
  return 'energi';
};

// Helper function to generate AI explanation for emission category
const generateCategoryExplanation = (category, percentage, sourceName) => {
  const explanations = {
    energi: `Konsumsi energi ${sourceName} mencapai ${percentage.toFixed(1)}% karena penggunaan listrik dan bahan bakar yang intensif dalam operasional perusahaan.`,
    transportasi: `Aktivitas transportasi ${sourceName} menyumbang ${percentage.toFixed(1)}% emisi karena pergerakan kendaraan dan logistik distribusi yang tinggi.`,
    produksi: `Proses produksi ${sourceName} menghasilkan ${percentage.toFixed(1)}% emisi karena penggunaan material dan energi dalam manufaktur.`,
    limbah: `Pengelolaan limbah ${sourceName} berkontribusi ${percentage.toFixed(1)}% emisi karena proses pembuangan dan treatment yang memerlukan energi.`
  };
  
  return explanations[category] || `Kategori ${category} dengan sumber ${sourceName} menyumbang ${percentage.toFixed(1)}% dari total emisi.`;
};

// Helper function to generate category analysis (combined analysis for entire category)
const generateCategoryAnalysis = (category, percentage, sources) => {
  const sourceNames = sources.join(', ');
  
  const analyses = {
    energi: `Kategori energi menyumbang ${percentage.toFixed(1)}% dari total emisi melalui sumber-sumber seperti ${sourceNames}. Konsumsi energi yang tinggi menunjukkan kebutuhan untuk optimasi penggunaan listrik dan bahan bakar dalam operasional perusahaan.`,
    transportasi: `Kategori transportasi berkontribusi ${percentage.toFixed(1)}% dari total emisi melalui aktivitas ${sourceNames}. Tingginya emisi transportasi menunjukkan perlunya strategi logistik yang lebih efisien dan penggunaan kendaraan yang lebih ramah lingkungan.`,
    produksi: `Kategori produksi menghasilkan ${percentage.toFixed(1)}% dari total emisi melalui proses ${sourceNames}. Emisi produksi yang signifikan menunjukkan kebutuhan untuk optimasi proses manufaktur dan penggunaan material yang lebih berkelanjutan.`,
    limbah: `Kategori limbah menyumbang ${percentage.toFixed(1)}% dari total emisi melalui pengelolaan ${sourceNames}. Emisi limbah menunjukkan pentingnya implementasi sistem pengelolaan limbah yang lebih efisien dan proses daur ulang yang optimal.`
  };
  
  return analyses[category] || `Kategori ${category} berkontribusi ${percentage.toFixed(1)}% dari total emisi melalui sumber-sumber seperti ${sourceNames}.`;
};

// Helper function to calculate emission categories with debug info
const calculateEmissionCategories = (emissionDetails, totalEmission) => {
  const categories = {
    energi: { totalEmission: 0, sources: [] },
    transportasi: { totalEmission: 0, sources: [] },
    produksi: { totalEmission: 0, sources: [] },
    limbah: { totalEmission: 0, sources: [] }
  };
  
  console.log('=== DEBUG: Calculating Emission Categories ===');
  console.log('Total Emission:', totalEmission);
  console.log('Emission Details Count:', emissionDetails.length);
  
  // Group emissions by category from database
  emissionDetails.forEach((detail, index) => {
    const category = getEmissionCategory(detail.emissionsource);
    
    console.log(`Detail ${index + 1}:`, {
      source_name: detail.emissionsource.name,
      kategori_from_db: detail.emissionsource.kategori,
      category_mapped: category,
      emission_value: detail.emission_value
    });
    
    categories[category].totalEmission += detail.emission_value;
    categories[category].sources.push(detail.emissionsource.name);
  });
  
  // Calculate final result with single item per category
  const result = {};
  Object.keys(categories).forEach(category => {
    const percentage = (categories[category].totalEmission / totalEmission) * 100;
    const sourcesCount = categories[category].sources.length;
    
    console.log(`${category}:`, {
      total_emission: categories[category].totalEmission,
      percentage: percentage.toFixed(2) + '%',
      sources_count: sourcesCount,
      sources: categories[category].sources
    });
    
    if (percentage > 0) {
      result[category] = [{
        name: category,
        percentage: percentage,
        analysis: generateCategoryAnalysis(category, percentage, categories[category].sources)
      }];
    } else {
      result[category] = [];
    }
  });
  
  const grandTotal = Object.values(result).reduce((sum, categoryArray) => {
    return sum + categoryArray.reduce((catSum, item) => catSum + item.percentage, 0);
  }, 0);
  
  console.log('Grand Total:', grandTotal.toFixed(2) + '%');
  console.log('=== END DEBUG ===');
  
  return result;
};

// GET - Get emission result with debug info for category calculation
const getEmissionResultDebug = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to view emission results'
      });
    }
    
    const emissionResult = await prisma.emissionresult.findUnique({
      where: { result_id: parseInt(id) },
      include: {
        emissioninput: {
          where: {
            company_id: user.company_id
          },
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
        message: 'Emission result not found or does not belong to your company'
      });
    }

    // Calculate categories with debug info
    const emissionCategories = calculateEmissionCategories(
      emissionResult.emissioninput.emissioninputdetail, 
      emissionResult.total_emission
    );

    // Calculate totals for verification
    const categoryTotals = {};
    Object.keys(emissionCategories).forEach(category => {
      const total = emissionCategories[category].reduce((sum, item) => sum + item.percentage, 0);
      categoryTotals[category] = total;
    });

    const grandTotal = Object.values(categoryTotals).reduce((sum, total) => sum + total, 0);

    res.json({
      success: true,
      data: {
        ...emissionResult,
        debug_info: {
          total_emission: emissionResult.total_emission,
          category_totals: categoryTotals,
          grand_total_percentage: grandTotal,
          emission_details_count: emissionResult.emissioninput.emissioninputdetail.length,
          emission_details: emissionResult.emissioninput.emissioninputdetail.map(detail => ({
            source_name: detail.emissionsource.name,
            kategori_from_db: detail.emissionsource.kategori,
            emission_value: detail.emission_value,
            percentage: ((detail.emission_value / emissionResult.total_emission) * 100).toFixed(2) + '%'
          }))
        }
      },
      message: 'Emission result with debug info retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting emission result debug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission result debug',
      error: error.message
    });
  }
};

// GET - Get latest emission result for user's company with detailed breakdown
const getLatestEmissionResult = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.company_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a company to view emission results'
      });
    }
    
    const latestEmissionResult = await prisma.emissionresult.findFirst({
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
    
    if (!latestEmissionResult) {
      return res.status(404).json({
        success: false,
        message: 'No emission results found for your company'
      });
    }

    // Calculate percentage for each emission detail
    const totalEmission = latestEmissionResult.total_emission;
    const emissionDetailsWithPercentage = latestEmissionResult.emissioninput.emissioninputdetail.map(detail => {
      const percentage = (detail.emission_value / totalEmission) * 100;
      return {
        detail_id: detail.detail_id,
        source_name: detail.emissionsource.name,
        kategori: detail.emissionsource.kategori,
        unit: detail.emissionsource.unit,
        emission_factor: detail.emissionsource.emission_factor,
        value: detail.value,
        emission_value: detail.emission_value,
        percentage: percentage,
        percentage_formatted: percentage.toFixed(2) + '%'
      };
    });

    // Sort by percentage (highest first)
    emissionDetailsWithPercentage.sort((a, b) => b.percentage - a.percentage);

    res.json({
      success: true,
      data: {
        ...latestEmissionResult,
        emission_details_breakdown: emissionDetailsWithPercentage,
        summary: {
          total_emission: totalEmission,
          total_details: emissionDetailsWithPercentage.length,
          top_contributor: emissionDetailsWithPercentage[0] || null,
          category_breakdown: {
            energi: emissionDetailsWithPercentage.filter(d => d.kategori === 'energi').length,
            transportasi: emissionDetailsWithPercentage.filter(d => d.kategori === 'transportasi').length,
            produksi: emissionDetailsWithPercentage.filter(d => d.kategori === 'produksi').length,
            limbah: emissionDetailsWithPercentage.filter(d => d.kategori === 'limbah').length
          }
        }
      },
      message: 'Latest emission result with detailed breakdown retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting latest emission result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve latest emission result',
      error: error.message
    });
  }
};

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
      include: {
        emissionsource: true
      }
    });

    const total_emission = details.reduce((sum, d) => sum + (d.emission_value || 0), 0);

    // Calculate emission categories
    const emissionCategories = calculateEmissionCategories(details, total_emission);

    // Generate AI analysis and level
    const emissionData = {
      company: emissionInput.company,
      details: details,
      total_emission: total_emission
    };

    let analysis;
    let computedLevel;
    
    try {
      // Generate AI analysis
      analysis = await aiRecommendationService.generateAnalysis(emissionData);
      // Compute sector-based level from company profile
      computedLevel = aiRecommendationService.computeSectorLevel(
        emissionInput.company,
        total_emission
      );
    } catch (aiError) {
      console.warn('AI service failed, using basic analysis:', aiError.message);
      // Fallback to basic analysis
      analysis = aiRecommendationService.generateBasicAnalysis(emissionData);
      computedLevel = aiRecommendationService.computeSectorLevel(
        emissionInput.company,
        total_emission
      );
    }

    const emissionResult = await prisma.emissionresult.create({
      data: {
        input_id: parseInt(input_id),
        total_emission: total_emission,
        analisis: analysis,
        level: computedLevel || undefined,
        energi: emissionCategories.energi,
        transportasi: emissionCategories.transportasi,
        produksi: emissionCategories.produksi,
        limbah: emissionCategories.limbah
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

    // Get priority actions for additional info
    const priorityActions = aiRecommendationService.getPriorityActions(details);
    const emissionLevel = aiRecommendationService.categorizeEmissionLevel(total_emission);

    res.status(201).json({
      success: true,
      data: {
        ...emissionResult,
        ai_analysis: {
          emission_level: emissionLevel,
          sector_level: computedLevel || null,
          priority_actions: priorityActions,
          generated_at: new Date().toISOString(),
          ai_used: true
        }
      },
      message: 'Emission result created successfully with full analysis'
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

// POST - Update emission categories for existing result
const updateEmissionCategories = async (req, res) => {
  try {
    const { id } = req.params;

    // Get emission result with details
    const emissionResult = await prisma.emissionresult.findUnique({
      where: { result_id: parseInt(id) },
      include: {
        emissioninput: {
          include: {
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

    // Calculate emission categories
    const emissionCategories = calculateEmissionCategories(
      emissionResult.emissioninput.emissioninputdetail, 
      emissionResult.total_emission
    );

    // Update emission result with categories
    const updatedResult = await prisma.emissionresult.update({
      where: { result_id: parseInt(id) },
      data: {
        energi: emissionCategories.energi,
        transportasi: emissionCategories.transportasi,
        produksi: emissionCategories.produksi,
        limbah: emissionCategories.limbah
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

    res.json({
      success: true,
      data: updatedResult,
      message: 'Emission categories updated successfully'
    });
  } catch (error) {
    console.error('Error updating emission categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emission categories',
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
};
