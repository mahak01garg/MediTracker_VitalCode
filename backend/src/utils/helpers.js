const crypto = require('crypto');

class Helpers {
    // Generate random string
    static generateRandomString(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Generate unique ID
    static generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Format date to readable string
    static formatDate(date, format = 'long') {
        const d = new Date(date);
        
        if (format === 'short') {
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        if (format === 'time') {
            return d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        if (format === 'datetime') {
            return d.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Default long format
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Calculate time difference in human readable format
    static timeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diff = now - past;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        return 'just now';
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone number (basic validation)
    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    // Sanitize string (prevent XSS)
    static sanitizeString(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Truncate text with ellipsis
    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Generate slug from string
    static generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Merge objects deeply
    static deepMerge(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    // Check if value is object
    static isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    // Generate pagination metadata
    static generatePagination(total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        
        return {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext,
            hasPrev,
            nextPage: hasNext ? page + 1 : null,
            prevPage: hasPrev ? page - 1 : null
        };
    }

    // Calculate age from birth date
    static calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    // Format currency
    static formatCurrency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Generate password hash (using bcrypt in actual implementation)
    static async generatePasswordHash(password) {
        // This would use bcrypt in production
        const crypto = require('crypto');
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto
            .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
            .toString('hex');
        return { salt, hash };
    }

    // Verify password (using bcrypt in actual implementation)
    static async verifyPassword(password, salt, hash) {
        const crypto = require('crypto');
        const verifyHash = crypto
            .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
            .toString('hex');
        return hash === verifyHash;
    }

    // Generate OTP
    static generateOTP(length = 6) {
        const digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < length; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
    }

    // Calculate medication adherence percentage
    static calculateAdherence(taken, total) {
        if (total === 0) return 100;
        return Math.round((taken / total) * 100);
    }

    // Get day name from date
    static getDayName(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    // Get month name from date
    static getMonthName(date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[date.getMonth()];
    }

    // Calculate time until next dose
    static timeUntilNextDose(nextDoseTime) {
        const now = new Date();
        const next = new Date(nextDoseTime);
        const diff = next - now;
        
        if (diff <= 0) return 'Now';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `in ${hours}h ${minutes}m`;
        }
        return `in ${minutes}m`;
    }

    // Group array by key
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    }

    // Sort array by key
    static sortBy(array, key, order = 'asc') {
        return array.sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            // Handle dates
            if (aVal instanceof Date) aVal = aVal.getTime();
            if (bVal instanceof Date) bVal = bVal.getTime();
            
            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    // Remove duplicates from array
    static removeDuplicates(array, key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }

    // Flatten nested array
    static flattenArray(array) {
        return array.reduce((flat, item) => {
            return flat.concat(Array.isArray(item) ? this.flattenArray(item) : item);
        }, []);
    }

    // Chunk array into smaller arrays
    static chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // Generate UUID
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Calculate percentage
    static calculatePercentage(part, whole) {
        if (whole === 0) return 0;
        return Math.round((part / whole) * 100);
    }

    // Round to decimal places
    static roundTo(value, decimals = 2) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    // Generate medication schedule times
    static generateScheduleTimes(frequency, timesPerDay) {
        const schedules = [];
        const timeSlots = [
            '08:00', '12:00', '16:00', '20:00', // Common medication times
            '06:00', '10:00', '14:00', '18:00', '22:00' // Alternative times
        ];
        
        // Select times based on frequency
        const selectedTimes = timeSlots.slice(0, timesPerDay);
        
        if (frequency === 'daily') {
            schedules.push({ day: 'everyday', times: selectedTimes });
        } else if (frequency === 'weekly') {
            const days = ['monday', 'wednesday', 'friday'];
            days.forEach(day => {
                schedules.push({ day, times: selectedTimes });
            });
        } else if (frequency === 'monthly') {
            // First day of month
            schedules.push({ day: '1', times: selectedTimes });
        }
        
        return schedules;
    }

    // Calculate medication end date
    static calculateEndDate(startDate, durationDays) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);
        return endDate;
    }

    // Check if medication is due
    static isMedicationDue(scheduledTime, toleranceMinutes = 30) {
        const now = new Date();
        const scheduled = new Date(scheduledTime);
        const diff = now - scheduled;
        const diffMinutes = Math.abs(diff / (1000 * 60));
        
        return diffMinutes <= toleranceMinutes;
    }

    // Get medication status
    static getMedicationStatus(dose) {
        const now = new Date();
        const scheduled = new Date(dose.scheduledTime);
        
        if (dose.status === 'taken') return 'taken';
        if (dose.status === 'missed') return 'missed';
        
        if (now > scheduled) {
            // Check if it's within grace period (1 hour)
            const diff = now - scheduled;
            const diffHours = diff / (1000 * 60 * 60);
            
            if (diffHours <= 1) {
                return 'due';
            } else {
                return 'overdue';
            }
        }
        
        // Check if it's within reminder window (5 minutes)
        const diff = scheduled - now;
        const diffMinutes = diff / (1000 * 60);
        
        if (diffMinutes <= 5) {
            return 'upcoming';
        }
        
        return 'scheduled';
    }
}

module.exports = Helpers;