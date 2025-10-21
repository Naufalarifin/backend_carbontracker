const axios = require('axios');

class AIRecommendationService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Generate AI analysis (1 paragraph, not cut off) based on emission data
   * @param {Object} emissionData - Emission data including details and company info
   * @returns {Promise<string>} - AI generated analysis
   */
  async generateAnalysis(emissionData) {
    try {
      if (!this.openaiApiKey) {
        console.log('OpenAI API key not configured, using basic analysis');
        throw new Error('OpenAI API key not configured');
      }

      console.log('Generating AI analysis...');
      const prompt = this.buildPrompt(emissionData);
      
      const response = await axios.post(this.openaiBaseUrl, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Anda adalah analis lingkungan yang menyusun ringkasan analisis jejak karbon yang padat dan jelas. Fokus pada interpretasi data, sumber emisi terbesar, kemungkinan penyebab, dan area yang berlebihan. Tulis dalam Bahasa Indonesia yang alami.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Analysis Error:', error);
      console.log('Falling back to basic analysis');
      throw new Error('Failed to generate AI analysis');
    }
  }

  /**
   * Build prompt for AI analysis
   * @param {Object} emissionData - Emission data
   * @returns {string} - Formatted prompt
   */
  buildPrompt(emissionData) {
    const { company, details, total_emission } = emissionData;
    
    let prompt = `Tulis analisis singkat (maksimal 1-2 paragraf, jangan terpotong) tentang jejak karbon ${company.name}${company.industry ? ` (industri ${company.industry})` : ''}. Sertakan: total emisi, sumber emisi terbesar, indikasi area penggunaan yang berlebih, dan insight singkat lainnya. Hindari daftar bullet dan hindari kata 'rekomendasi'. Gunakan Bahasa Indonesia yang natural.\n\n`;
    prompt += `Total Emisi CO2: ${total_emission} kg CO2\n\n`;
    prompt += `Rincian Sumber Emisi:\n`;
    
    details.forEach((detail, index) => {
      const name = detail.emissionsource?.name || 'Sumber tidak diketahui';
      const unit = detail.emissionsource?.unit || 'unit';
      const category = detail.emissionsource?.kategori ? ` [Kategori: ${detail.emissionsource.kategori}]` : '';
      prompt += `${index + 1}. ${name}: ${detail.value} ${unit} = ${detail.emission_value} kg CO2${category}\n`;
    });

    prompt += `\nSusun analisis dalam bentuk paragraf ringkas tanpa bullet. Maksimal 1-2 paragraf dan pastikan kalimat utuh (tidak terpotong).`;

    return prompt;
  }

  /**
   * Generate simple recommendation without AI (fallback)
   * @param {Object} emissionData - Emission data
   * @returns {string} - Basic recommendation
   */
  generateBasicAnalysis(emissionData) {
    const { details, total_emission } = emissionData;


    if (!details || !Array.isArray(details) || details.length === 0) {
      return `Total emisi tercatat ${total_emission.toFixed(2)} kg CO2. Data detail emisi tidak tersedia untuk analisis lebih lanjut.`;
    }

    const sortedDetails = [...details].sort((a, b) => b.emission_value - a.emission_value);
    const topSource = sortedDetails[0];
    const secondSource = sortedDetails[1];

    // Safe access to emissionsource
    const topSourceName = topSource && topSource.emissionsource ? topSource.emissionsource.name : 'Sumber tidak diketahui';
    const secondSourceName = secondSource && secondSource.emissionsource ? secondSource.emissionsource.name : 'Sumber tidak diketahui';
    const topSourceUnit = topSource && topSource.emissionsource ? topSource.emissionsource.unit : 'unit';

    const topSourceText = topSource ? `${topSourceName} menyumbang tertinggi sekitar ${topSource.emission_value.toFixed(2)} kg CO2` : 'Sumber utama tidak teridentifikasi';
    const secondSourceText = secondSource ? `diikuti ${secondSourceName} sekitar ${secondSource.emission_value.toFixed(2)} kg CO2` : '';

    const overuseHint = topSource && topSource.value ? `Kemungkinan area berlebihan ada pada penggunaan ${topSourceName} (nilai input ${topSource.value} ${topSourceUnit}).` : '';

    const paragraph1 = `Total emisi tercatat ${total_emission.toFixed(2)} kg CO2. ${topSourceText}${secondSource ? `, ${secondSourceText}` : ''}. Pola ini menunjukkan konsentrasi emisi pada beberapa aktivitas inti dan perlu perhatian untuk menekan kontribusi terbesar.`;
    const paragraph2 = `${overuseHint} Periksa faktor operasional yang mendorong konsumsi, variasi beban harian, dan efisiensi peralatan untuk mengidentifikasi peluang pengurangan yang paling realistis.`;

    return `${paragraph1} ${paragraph2}`.trim();
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
   * Compute sector-based level (Baik/Sedang/Buruk) using company profile
   * Assumptions:
   * - totalEmission is in kg CO2e for the period; converted to tons for intensity
   * - For sectors except office, uses revenue-based intensity as requested
   * - Falls back to null if required company fields are missing
   * @param {Object} company - Company object from Prisma
   * @param {number} totalEmissionKg - Total emission in kg CO2e
   * @returns {('Baik'|'Sedang'|'Buruk'|null)}
   */
  computeSectorLevel(company, totalEmissionKg) {
    if (!company || typeof totalEmissionKg !== 'number') return null;

    const sector = (company.jenis_perusahaan || '').toLowerCase();
    const totalEmissionTon = totalEmissionKg / 1000;

    let intensity; // normalized metric based on sector rule
    if (sector.includes('kantor') || sector.includes('startup') || sector.includes('it') || sector.includes('finansial')) {
      const numEmployees = company.jumlah_karyawan;
      if (!numEmployees || numEmployees <= 0) return null;
      intensity = totalEmissionTon / numEmployees; // ton per employee

      if (intensity < 3) return 'Baik';
      if (intensity <= 6) return 'Sedang';
      return 'Buruk';
    }

    // Revenue-based sectors (as requested)
    const revenue = company.pendapatan_perbulan;
    if (!revenue || revenue <= 0) return null;
    intensity = totalEmissionTon / revenue; // unit: ton per (currency unit) per period

    if (sector.includes('manufaktur') || sector.includes('produksi')) {
      if (intensity < 80) return 'Baik';
      if (intensity <= 150) return 'Sedang';
      return 'Buruk';
    }

    if (sector.includes('transport') || sector.includes('logistik')) {
      if (intensity < 1000) return 'Baik';
      if (intensity <= 3000) return 'Sedang';
      return 'Buruk';
    }

    if (sector.includes('retail') || sector.includes('perdagangan')) {
      if (intensity < 150) return 'Baik';
      if (intensity <= 300) return 'Sedang';
      return 'Buruk';
    }

    if (sector.includes('energi') || sector.includes('tambang') || sector.includes('pertambangan')) {
      if (intensity < 10000) return 'Baik';
      if (intensity <= 20000) return 'Sedang';
      return 'Buruk';
    }

    if (sector.includes('pemerintahan') || sector.includes('gedung') || sector.includes('perkantoran umum')) {
      if (intensity < 100) return 'Baik';
      if (intensity <= 250) return 'Sedang';
      return 'Buruk';
    }

    return null;
  }

  /**
   * Get priority actions based on emission sources
   * @param {Array} details - Emission details
   * @returns {Array} - Priority actions
   */
  getPriorityActions(details) {
    const actions = [];
    
    details.forEach(detail => {
      const sourceId = detail.emissionsource?.source_id;
      const sourceName = (detail.emissionsource?.name || '').toLowerCase();
      const sourceCategory = (detail.emissionsource?.kategori || '').toLowerCase();
      const value = detail.value;
      const emission = detail.emission_value;

      // Explicit mappings by source_id for precise actions
      switch (sourceId) {
        // Electricity
        case 1: // Listrik PLN
        case 2: // Genset (Diesel)
          actions.push({
            priority: 'High',
            action: 'Optimalkan konsumsi listrik',
            impact: `Potensi pengurangan ${emission} kg CO2`,
            suggestion: 'Audit energi, LED, optimasi HVAC, perbaiki faktor daya'
          });
          break;

        // Fuels (Diesel, Gasoline)
        case 4: // BBM Solar / Diesel
        case 5: // BBM Bensin / Gasolin
          actions.push({
            priority: 'High',
            action: 'Kurangi konsumsi BBM',
            impact: `Potensi pengurangan ${emission} kg CO2`,
            suggestion: 'Peremajaan kendaraan, eco-driving, optimasi rute/logistik'
          });
          break;

        // Gas/LPG
        case 3: // LPG
          actions.push({
            priority: 'Medium',
            action: 'Efisiensi penggunaan gas/LPG',
            impact: `Potensi pengurangan ${emission} kg CO2`,
            suggestion: 'Pemeliharaan burner, deteksi kebocoran, optimasi setting temperatur'
          });
          break;

        // Water
        case 15: // Air Bersih / Konsumsi Air
          actions.push({
            priority: 'Medium',
            action: 'Optimalkan konsumsi air',
            impact: `Potensi pengurangan ${emission} kg CO2`,
            suggestion: 'Perbaiki kebocoran, instal aerator, reuse/recycle air proses'
          });
          break;
        default:
          break;
      }

      // Category-based fallback if no explicit mapping above matched
      if (actions.length === 0) {
        if (sourceCategory.includes('energi')) {
          actions.push({
            priority: 'High',
            action: 'Efisiensi energi operasional',
            impact: `Potensi pengurangan ${emission} kg CO2`,
            suggestion: 'Monitoring real-time, pengaturan beban puncak, VSD untuk motor'
          });
        } else if (sourceCategory.includes('transport') || sourceName.includes('transport')) {
          actions.push({
            priority: 'High',
            action: 'Efisiensi transportasi dan logistik',
            impact: `Potensi pengurangan ${emission} kg CO2`,
            suggestion: 'Konsolidasi pengiriman, optimasi rute, pelatihan eco-driving'
          });
        } else if (sourceCategory.includes('limbah')) {
          actions.push({
            priority: 'Medium',
            action: 'Pengelolaan limbah yang lebih baik',
            impact: `Potensi pengurangan ${emission} kg CO2`,
            suggestion: 'Reduce-reuse-recycle, pemilahan di sumber, optimasi kompaksi'
          });
        } else if (sourceName.includes('air')) {
          actions.push({
            priority: 'Medium',
            action: 'Efisiensi penggunaan air',
            impact: `Potensi pengurangan ${emission} kg CO2`,
            suggestion: 'Perbaikan kebocoran, reuse greywater, optimasi pompa'
          });
        }
      }
    });
    
    return actions.sort((a, b) => {
      const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

module.exports = new AIRecommendationService();

