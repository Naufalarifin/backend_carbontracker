// Utility functions untuk format tanggal dan waktu

/**
 * Format tanggal ke format Indonesia (DD/MM/YYYY)
 * @param {Date} date - Tanggal yang akan diformat
 * @returns {string} - Tanggal dalam format DD/MM/YYYY
 */
const formatDateToIndonesian = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format tanggal ke format ISO string
 * @param {Date} date - Tanggal yang akan diformat
 * @returns {string} - Tanggal dalam format ISO string
 */
const formatDateToISO = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Format tanggal ke format readable (DD MMMM YYYY)
 * @param {Date} date - Tanggal yang akan diformat
 * @returns {string} - Tanggal dalam format readable
 */
const formatDateToReadable = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};

/**
 * Format datetime ke format Indonesia dengan waktu
 * @param {Date} date - Tanggal dan waktu yang akan diformat
 * @returns {string} - DateTime dalam format DD/MM/YYYY HH:MM
 */
const formatDateTimeToIndonesian = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Validasi format tanggal
 * @param {string} dateString - String tanggal yang akan divalidasi
 * @returns {boolean} - True jika valid, false jika tidak
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Hitung selisih hari antara dua tanggal
 * @param {Date} startDate - Tanggal mulai
 * @param {Date} endDate - Tanggal akhir
 * @returns {number} - Selisih dalam hari
 */
const daysDifference = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Format periode bulan dan tahun
 * @param {number} month - Bulan (1-12)
 * @param {number} year - Tahun
 * @returns {string} - Format "Bulan Tahun"
 */
const formatMonthYear = (month, year) => {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  if (month < 1 || month > 12) return 'Invalid Month';
  
  return `${monthNames[month - 1]} ${year}`;
};

/**
 * Get current month and year
 * @returns {object} - Object dengan month dan year saat ini
 */
const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // getMonth() returns 0-11, so add 1
    year: now.getFullYear()
  };
};

/**
 * Get month and year from specific date
 * @param {Date|string} date - Tanggal yang akan diambil bulan dan tahunnya
 * @returns {object} - Object dengan month dan year
 */
const getMonthYearFromDate = (date) => {
  const targetDate = new Date(date);
  return {
    month: targetDate.getMonth() + 1,
    year: targetDate.getFullYear()
  };
};

module.exports = {
  formatDateToIndonesian,
  formatDateToISO,
  formatDateToReadable,
  formatDateTimeToIndonesian,
  isValidDate,
  daysDifference,
  formatMonthYear,
  getCurrentMonthYear,
  getMonthYearFromDate
};
