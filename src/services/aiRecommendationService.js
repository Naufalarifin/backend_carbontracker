const axios = require('axios');

class AIRecommendationService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Generate AI recommendation based on emission data
   * @param {Object} emissionData - Emission data including details and company info
   * @returns {Promise<string>} - AI generated recommendation
   */
  async generateRecommendation(emissionData) {
    try {
      if (!this.openaiApiKey) {
        console.log('OpenAI API key not configured, using basic recommendation');
        throw new Error('OpenAI API key not configured');
      }

      console.log('Generating AI recommendation...');
      const prompt = this.buildPrompt(emissionData);
      
      const response = await axios.post(this.openaiBaseUrl, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Anda adalah konsultan lingkungan yang ahli dalam analisis jejak karbon dan rekomendasi keberlanjutan. Berikan saran praktis dan dapat ditindaklanjuti untuk mengurangi emisi karbon. Gunakan bahasa Indonesia yang jelas dan mudah dipahami.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      console.log('Falling back to basic recommendation');
      throw new Error('Failed to generate AI recommendation');
    }
  }

  /**
   * Build prompt for AI analysis
   * @param {Object} emissionData - Emission data
   * @returns {string} - Formatted prompt
   */
  buildPrompt(emissionData) {
    const { company, details, total_emission } = emissionData;
    
    let prompt = `Analisis data jejak karbon untuk ${company.name} (industri ${company.industry}):\n\n`;
    prompt += `Total Emisi CO2: ${total_emission} kg CO2\n\n`;
    prompt += `Rincian Sumber Emisi:\n`;
    
    details.forEach((detail, index) => {
      prompt += `${index + 1}. ${detail.source.name}: ${detail.value} ${detail.source.unit} = ${detail.emission_value} kg CO2\n`;
    });
    
    prompt += `\nBerikan rekomendasi spesifik dan dapat ditindaklanjuti untuk mengurangi emisi karbon perusahaan ini. Fokus pada:\n`;
    prompt += `1. Aksi segera (0-3 bulan)\n`;
    prompt += `2. Perbaikan jangka menengah (3-12 bulan)\n`;
    prompt += `3. Strategi jangka panjang (1+ tahun)\n`;
    prompt += `4. Solusi hemat biaya\n`;
    prompt += `5. Praktik terbaik industri\n\n`;
    prompt += `Format respons sebagai rekomendasi terstruktur dengan item aksi yang jelas. Gunakan bahasa Indonesia yang mudah dipahami.`;

    return prompt;
  }

  /**
   * Generate simple recommendation without AI (fallback)
   * @param {Object} emissionData - Emission data
   * @returns {string} - Basic recommendation
   */
  generateBasicRecommendation(emissionData) {
    const { details, total_emission } = emissionData;
    
    let recommendation = `Berdasarkan analisis jejak karbon Anda (${total_emission} kg CO2), berikut beberapa rekomendasi:\n\n`;
    
    // Analyze highest emission sources
    const sortedDetails = details.sort((a, b) => b.emission_value - a.emission_value);
    const topSource = sortedDetails[0];
    
    if (topSource) {
      recommendation += `1. Fokus pada pengurangan penggunaan ${topSource.source.name} (${topSource.emission_value} kg CO2)\n`;
      recommendation += `   - Penggunaan saat ini: ${topSource.value} ${topSource.source.unit}\n`;
      recommendation += `   - Pertimbangkan alternatif yang lebih efisien energi\n`;
      recommendation += `   - Implementasikan monitoring penggunaan yang lebih ketat\n\n`;
    }
    
    recommendation += `2. Implementasikan sistem monitoring energi\n`;
    recommendation += `   - Pasang smart meter untuk tracking real-time\n`;
    recommendation += `   - Buat dashboard monitoring konsumsi energi\n`;
    recommendation += `   - Set up alert untuk penggunaan berlebihan\n\n`;
    
    recommendation += `3. Beralih ke sumber energi terbarukan jika memungkinkan\n`;
    recommendation += `   - Pertimbangkan instalasi panel surya\n`;
    recommendation += `   - Gunakan energi dari supplier yang menggunakan renewable\n`;
    recommendation += `   - Implementasikan sistem hybrid energi\n\n`;
    
    recommendation += `4. Lakukan audit emisi secara berkala\n`;
    recommendation += `   - Audit bulanan untuk tracking progress\n`;
    recommendation += `   - Dokumentasikan semua perubahan dan improvement\n`;
    recommendation += `   - Bandingkan dengan target pengurangan emisi\n\n`;
    
    recommendation += `5. Latih staf tentang praktik keberlanjutan\n`;
    recommendation += `   - Training awareness lingkungan\n`;
    recommendation += `   - Implementasikan best practices operasional\n`;
    recommendation += `   - Buat sistem reward untuk inisiatif hijau\n\n`;
    
    if (total_emission > 1000) {
      recommendation += `⚠️ Tingkat emisi tinggi terdeteksi. Pertimbangkan rencana aksi segera.\n`;
      recommendation += `   - Prioritas tinggi untuk pengurangan emisi\n`;
      recommendation += `   - Pertimbangkan konsultan lingkungan profesional\n`;
    } else if (total_emission > 500) {
      recommendation += `⚠️ Tingkat emisi sedang. Fokus pada optimasi.\n`;
      recommendation += `   - Lanjutkan program pengurangan emisi\n`;
      recommendation += `   - Monitor progress secara ketat\n`;
    } else {
      recommendation += `✅ Tingkat emisi baik. Lanjutkan praktik saat ini.\n`;
      recommendation += `   - Pertahankan standar yang sudah ada\n`;
      recommendation += `   - Terus tingkatkan efisiensi energi\n`;
    }
    
    return recommendation;
  }

  /**
   * Categorize emission level
   * @param {number} totalEmission - Total emission in kg CO2
   * @returns {string} - Emission level category
   */
  categorizeEmissionLevel(totalEmission) {
    if (totalEmission > 1000) return 'High';
    if (totalEmission > 500) return 'Moderate';
    if (totalEmission > 100) return 'Low';
    return 'Very Low';
  }

  /**
   * Get priority actions based on emission sources
   * @param {Array} details - Emission details
   * @returns {Array} - Priority actions
   */
  getPriorityActions(details) {
    const actions = [];
    
    details.forEach(detail => {
      const source = detail.source.name.toLowerCase();
      const value = detail.value;
      const emission = detail.emission_value;
      
      if (source.includes('listrik') || source.includes('electricity')) {
        actions.push({
          priority: 'High',
          action: 'Optimize electricity usage',
          impact: `Reduce ${emission} kg CO2`,
          suggestion: 'Switch to LED lighting, optimize HVAC systems'
        });
      }
      
      if (source.includes('bahan bakar') || source.includes('fuel')) {
        actions.push({
          priority: 'High',
          action: 'Reduce fuel consumption',
          impact: `Reduce ${emission} kg CO2`,
          suggestion: 'Use fuel-efficient vehicles, optimize routes'
        });
      }
      
      if (source.includes('gas') || source.includes('lpg')) {
        actions.push({
          priority: 'Medium',
          action: 'Optimize gas usage',
          impact: `Reduce ${emission} kg CO2`,
          suggestion: 'Improve insulation, use energy-efficient appliances'
        });
      }
    });
    
    return actions.sort((a, b) => {
      const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

module.exports = new AIRecommendationService();

