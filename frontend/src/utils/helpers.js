import { DAYS_OF_WEEK, MEDICATION_CONSTANTS, TIME_CONSTANTS } from './constants';

/**
 * Format a date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'time', 'datetime')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    const options = {
        short: { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        },
        long: { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        },
        time: { 
            hour: '2-digit', 
            minute: '2-digit' 
        },
        datetime: { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        }
    };
    
    return dateObj.toLocaleDateString('en-US', options[format] || options.short);
};

/**
 * Format time difference (e.g., "2 hours ago", "in 15 minutes")
 * @param {string|Date} date - Date to compare
 * @returns {string} Formatted time difference
 */
export const formatTimeDifference = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = targetDate - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMs < 0) {
        const absMins = Math.abs(diffMins);
        const absHours = Math.abs(diffHours);
        const absDays = Math.abs(diffDays);
        
        if (absDays > 0) return `${absDays} day${absDays !== 1 ? 's' : ''} ago`;
        if (absHours > 0) return `${absHours} hour${absHours !== 1 ? 's' : ''} ago`;
        return `${absMins} minute${absMins !== 1 ? 's' : ''} ago`;
    } else {
        if (diffDays > 0) return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        if (diffHours > 0) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    }
};

/**
 * Format medication schedule for display
 * @param {Array} schedule - Medication schedule array
 * @returns {string} Formatted schedule string
 */
export const formatSchedule = (schedule) => {
    if (!schedule || schedule.length === 0) return 'No schedule';
    
    const dayMap = DAYS_OF_WEEK.reduce((acc, day) => {
        acc[day.value] = day.short;
        return acc;
    }, {});
    
    return schedule.map(s => {
        const time = s.time || '00:00';
        const days = s.days?.map(day => dayMap[day] || day).join(', ') || 'Everyday';
        return `${time} (${days})`;
    }).join(', ');
};

/**
 * Calculate next dose time for a medication
 * @param {Object} medication - Medication object
 * @returns {Date|null} Next dose time or null
 */
export const calculateNextDose = (medication) => {
    if (!medication?.schedule || medication.schedule.length === 0) return null;
    
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check for doses today
    const todayDoses = medication.schedule
        .filter(s => s.days?.includes(today))
        .map(s => {
            const [hours, minutes] = (s.time || '00:00').split(':');
            const doseTime = new Date(now);
            doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return doseTime;
        })
        .filter(time => time > now)
        .sort((a, b) => a - b);
    
    if (todayDoses.length > 0) return todayDoses[0];
    
    // Check for doses in next 7 days
    for (let i = 1; i <= 7; i++) {
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + i);
        const futureDay = futureDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const futureDoses = medication.schedule
            .filter(s => s.days?.includes(futureDay))
            .map(s => {
                const [hours, minutes] = (s.time || '00:00').split(':');
                const doseTime = new Date(futureDate);
                doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                return doseTime;
            })
            .sort((a, b) => a - b);
        
        if (futureDoses.length > 0) return futureDoses[0];
    }
    
    return null;
};

/**
 * Calculate medication adherence percentage
 * @param {number} taken - Number of doses taken
 * @param {number} scheduled - Number of doses scheduled
 * @returns {number} Adherence percentage (0-100)
 */
export const calculateAdherence = (taken, scheduled) => {
    if (!scheduled || scheduled === 0) return 100;
    return Math.round((taken / scheduled) * 100);
};

/**
 * Generate a random ID
 * @param {number} length - Length of ID
 * @returns {string} Random ID
 */
export const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Format file size to readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get time-based greeting
 * @returns {string} Greeting based on time of day
 */
export const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
};

/**
 * Parse medication dosage string
 * @param {string} dosage - Dosage string (e.g., "500mg", "1 tablet")
 * @returns {Object} Parsed dosage object
 */
export const parseDosage = (dosage) => {
    if (!dosage) return { value: '', unit: '' };
    
    // Try to extract numeric value and unit
    const match = dosage.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
    
    if (match) {
        return {
            value: parseFloat(match[1]),
            unit: match[2] || ''
        };
    }
    
    return { value: dosage, unit: '' };
};

/**
 * Check if medication is due soon
 * @param {Object} medication - Medication object
 * @param {number} minutesThreshold - Threshold in minutes (default: 30)
 * @returns {boolean} True if due soon
 */
export const isDueSoon = (medication, minutesThreshold = 30) => {
    const nextDose = calculateNextDose(medication);
    if (!nextDose) return false;
    
    const now = new Date();
    const diffMinutes = (nextDose - now) / 60000;
    
    return diffMinutes >= 0 && diffMinutes <= minutesThreshold;
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    } else if (cleaned.length === 11) {
        return `+${cleaned.substring(0, 1)} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    }
    
    return phone;
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 letters)
 */
export const getInitials = (name) => {
    if (!name) return 'U';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Create a data URL from file
 * @param {File} file - File to convert
 * @returns {Promise<string>} Data URL
 */
export const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Export all helpers
export default {
    formatDate,
    formatTimeDifference,
    formatSchedule,
    calculateNextDose,
    calculateAdherence,
    generateId,
    debounce,
    truncateText,
    capitalizeWords,
    formatFileSize,
    getTimeBasedGreeting,
    parseDosage,
    isDueSoon,
    deepClone,
    isValidEmail,
    formatPhoneNumber,
    getInitials,
    fileToDataURL
};