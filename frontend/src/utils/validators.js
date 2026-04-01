import { VALIDATION_CONSTANTS, MEDICATION_CONSTANTS } from './constants';

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return 'Email is required';
    }
    
    if (!VALIDATION_CONSTANTS.EMAIL_REGEX.test(email)) {
        return 'Please enter a valid email address';
    }
    
    return null;
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {string|null} Error message or null if valid
 */
export const validatePassword = (password, options = {}) => {
    const {
        minLength = VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH,
        requireUppercase = true,
        requireLowercase = true,
        requireNumbers = true,
        requireSpecialChars = false
    } = options;
    
    if (!password || password.trim() === '') {
        return 'Password is required';
    }
    
    if (password.length < minLength) {
        return `Password must be at least ${minLength} characters`;
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    
    if (requireLowercase && !/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }
    
    if (requireNumbers && !/\d/.test(password)) {
        return 'Password must contain at least one number';
    }
    
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'Password must contain at least one special character';
    }
    
    return null;
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {string|null} Error message or null if valid
 */
export const validateName = (name, fieldName = 'Name') => {
    if (!name || name.trim() === '') {
        return `${fieldName} is required`;
    }
    
    if (name.length < VALIDATION_CONSTANTS.NAME_MIN_LENGTH) {
        return `${fieldName} must be at least ${VALIDATION_CONSTANTS.NAME_MIN_LENGTH} characters`;
    }
    
    if (name.length > VALIDATION_CONSTANTS.NAME_MAX_LENGTH) {
        return `${fieldName} must be less than ${VALIDATION_CONSTANTS.NAME_MAX_LENGTH} characters`;
    }
    
    return null;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @param {boolean} required - Whether phone is required
 * @returns {string|null} Error message or null if valid
 */
export const validatePhone = (phone, required = false) => {
    if (!phone || phone.trim() === '') {
        return required ? 'Phone number is required' : null;
    }
    
    // Clean the phone number
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
        return 'Please enter a valid phone number (at least 10 digits)';
    }
    
    if (!VALIDATION_CONSTANTS.PHONE_REGEX.test(phone)) {
        return 'Please enter a valid phone number';
    }
    
    return null;
};

/**
 * Validate medication name
 * @param {string} name - Medication name
 * @returns {string|null} Error message or null if valid
 */
export const validateMedicationName = (name) => {
    if (!name || name.trim() === '') {
        return 'Medication name is required';
    }
    
    if (name.length > 100) {
        return 'Medication name must be less than 100 characters';
    }
    
    return null;
};

/**
 * Validate medication dosage
 * @param {string} dosage - Dosage string
 * @returns {string|null} Error message or null if valid
 */
export const validateDosage = (dosage) => {
    if (!dosage || dosage.trim() === '') {
        return 'Dosage is required';
    }
    
    if (dosage.length > VALIDATION_CONSTANTS.DOSAGE_MAX_LENGTH) {
        return `Dosage must be less than ${VALIDATION_CONSTANTS.DOSAGE_MAX_LENGTH} characters`;
    }
    
    return null;
};

/**
 * Validate medication frequency
 * @param {string} frequency - Frequency value
 * @returns {string|null} Error message or null if valid
 */
export const validateFrequency = (frequency) => {
    if (!frequency || frequency.trim() === '') {
        return 'Frequency is required';
    }
    
    if (!MEDICATION_CONSTANTS.FREQUENCIES.includes(frequency)) {
        return 'Please select a valid frequency';
    }
    
    return null;
};

/**
 * Validate medication schedule
 * @param {Array} schedule - Schedule array
 * @returns {string|null} Error message or null if valid
 */
export const validateSchedule = (schedule) => {
    if (!schedule || schedule.length === 0) {
        return 'At least one schedule time is required';
    }
    
    for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i];
        
        // Validate time
        if (!item.time || item.time.trim() === '') {
            return `Schedule ${i + 1}: Time is required`;
        }
        
        // Validate time format (HH:MM)
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(item.time)) {
            return `Schedule ${i + 1}: Please enter a valid time (HH:MM)`;
        }
        
        // Validate days
        if (!item.days || item.days.length === 0) {
            return `Schedule ${i + 1}: Select at least one day`;
        }
        
        // Validate each day
        for (const day of item.days) {
            if (!DAY_VALUES.includes(day)) {
                return `Schedule ${i + 1}: Invalid day selected`;
            }
        }
    }
    
    return null;
};

// Helper: Get day values array
const DAY_VALUES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Validate medication instructions
 * @param {string} instructions - Instructions text
 * @returns {string|null} Error message or null if valid
 */
export const validateInstructions = (instructions) => {
    if (!instructions || instructions.trim() === '') {
        return null; // Instructions are optional
    }
    
    if (instructions.length > VALIDATION_CONSTANTS.INSTRUCTIONS_MAX_LENGTH) {
        return `Instructions must be less than ${VALIDATION_CONSTANTS.INSTRUCTIONS_MAX_LENGTH} characters`;
    }
    
    return null;
};

/**
 * Validate date
 * @param {string} date - Date string
 * @param {Object} options - Validation options
 * @returns {string|null} Error message or null if valid
 */
export const validateDate = (date, options = {}) => {
    const {
        required = false,
        minDate = null,
        maxDate = new Date(),
        futureOnly = false,
        pastOnly = false
    } = options;
    
    if (!date || date.trim() === '') {
        return required ? 'Date is required' : null;
    }
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return 'Please enter a valid date';
    }
    
    if (minDate && dateObj < new Date(minDate)) {
        return `Date must be after ${new Date(minDate).toLocaleDateString()}`;
    }
    
    if (maxDate && dateObj > new Date(maxDate)) {
        return `Date must be before ${new Date(maxDate).toLocaleDateString()}`;
    }
    
    const now = new Date();
    
    if (futureOnly && dateObj <= now) {
        return 'Date must be in the future';
    }
    
    if (pastOnly && dateObj >= now) {
        return 'Date must be in the past';
    }
    
    return null;
};

/**
 * Validate time
 * @param {string} time - Time string (HH:MM)
 * @returns {string|null} Error message or null if valid
 */
export const validateTime = (time) => {
    if (!time || time.trim() === '') {
        return 'Time is required';
    }
    
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        return 'Please enter a valid time (HH:MM)';
    }
    
    return null;
};

/**
 * Validate number
 * @param {number|string} value - Number value
 * @param {Object} options - Validation options
 * @returns {string|null} Error message or null if valid
 */
export const validateNumber = (value, options = {}) => {
    const {
        required = false,
        min = null,
        max = null,
        integerOnly = false,
        positiveOnly = false
    } = options;
    
    if (value === '' || value === null || value === undefined) {
        return required ? 'This field is required' : null;
    }
    
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return 'Please enter a valid number';
    }
    
    if (integerOnly && !Number.isInteger(num)) {
        return 'Please enter a whole number';
    }
    
    if (positiveOnly && num <= 0) {
        return 'Please enter a positive number';
    }
    
    if (min !== null && num < min) {
        return `Value must be at least ${min}`;
    }
    
    if (max !== null && num > max) {
        return `Value must be at most ${max}`;
    }
    
    return null;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @param {boolean} required - Whether URL is required
 * @returns {string|null} Error message or null if valid
 */
export const validateURL = (url, required = false) => {
    if (!url || url.trim() === '') {
        return required ? 'URL is required' : null;
    }
    
    try {
        new URL(url);
        return null;
    } catch (error) {
        return 'Please enter a valid URL';
    }
};

/**
 * Validate form data object
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation results { isValid: boolean, errors: Object }
 */
export const validateForm = (data, rules) => {
    const errors = {};
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = data[field];
        const fieldErrors = [];
        
        for (const validation of rule) {
            const error = validation(value, data);
            if (error) {
                fieldErrors.push(error);
            }
        }
        
        if (fieldErrors.length > 0) {
            errors[field] = fieldErrors[0]; // Show first error only
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Create validation rule
 * @param {Function} validator - Validator function
 * @param {string} message - Error message
 * @returns {Function} Validation rule function
 */
export const createRule = (validator, message) => {
    return (value, data) => {
        const isValid = validator(value, data);
        return isValid ? null : message;
    };
};

// Common validation rules
export const commonRules = {
    required: createRule(
        (value) => value !== '' && value !== null && value !== undefined,
        'This field is required'
    ),
    
    email: createRule(
        (value) => VALIDATION_CONSTANTS.EMAIL_REGEX.test(value),
        'Please enter a valid email'
    ),
    
    phone: createRule(
        (value) => VALIDATION_CONSTANTS.PHONE_REGEX.test(value),
        'Please enter a valid phone number'
    ),
    
    minLength: (min) => createRule(
        (value) => !value || value.length >= min,
        `Must be at least ${min} characters`
    ),
    
    maxLength: (max) => createRule(
        (value) => !value || value.length <= max,
        `Must be less than ${max} characters`
    )
};

// Export all validators
export default {
    validateEmail,
    validatePassword,
    validateName,
    validatePhone,
    validateMedicationName,
    validateDosage,
    validateFrequency,
    validateSchedule,
    validateInstructions,
    validateDate,
    validateTime,
    validateNumber,
    validateURL,
    validateForm,
    createRule,
    commonRules
};