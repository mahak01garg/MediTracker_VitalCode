// Application Constants
export const APP_CONSTANTS = {
    APP_NAME: 'MediTracker',
    VERSION: '1.0.0',
    SUPPORT_EMAIL: 'mahakgarg197@gmail.com',
    SUPPORT_CONTACTS: [
        { name: 'Mahak Garg', email: 'mahakgarg197@gmail.com' },
        { name: 'Palak Sharma', email: 'palakcbse2023@gmail.com' }
    ],
    SUPPORT_PHONE: '+1-800-MED-TRACK',
    COMPANY_NAME: 'MediTracker Health Inc.',
    COMPANY_ADDRESS: '123 Health Street, Suite 100, San Francisco, CA 94107'
};

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        PROFILE: '/auth/profile',
        LOGOUT: '/auth/logout',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        VERIFY_EMAIL: '/auth/verify-email'
    },
    MEDICATIONS: {
        BASE: '/medications',
        TODAY_DOSES: '/medications/today-doses',
        UPCOMING_DOSES: '/medications/upcoming-doses',
        MISSED_DOSES: '/medications/missed-doses',
        ADHERENCE: '/medications/adherence',
        REMINDERS: '/medications/reminders'
    },
    AI: {
        CHAT: '/ai/chat',
        HEALTH_CHECK: '/ai/health',
        INSIGHTS: '/ai/insights',
        RECOMMENDATIONS: '/ai/recommendations'
    },
    DASHBOARD: {
        STATS: '/dashboard/stats',
        OVERVIEW: '/dashboard/overview',
        ANALYTICS: '/dashboard/analytics',
        NOTIFICATIONS: '/dashboard/notifications'
    }
};

// Medication Constants
export const MEDICATION_CONSTANTS = {
    FREQUENCIES: [
        'once daily',
        'twice daily',
        'three times daily',
        'four times daily',
        'every 6 hours',
        'every 8 hours',
        'every 12 hours',
        'weekly',
        'as needed',
        'other'
    ],
    
    DOSAGE_UNITS: [
        'mg',
        'g',
        'ml',
        'tablet',
        'capsule',
        'drop',
        'spray',
        'patch',
        'injection',
        'puff',
        'unit'
    ],
    
    TIME_UNITS: [
        'minutes',
        'hours',
        'days',
        'weeks',
        'months'
    ],
    
    ROUTES: [
        'oral',
        'topical',
        'inhaled',
        'injected',
        'rectal',
        'vaginal',
        'sublingual',
        'transdermal'
    ],
    
    STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        COMPLETED: 'completed',
        DISCONTINUED: 'discontinued'
    },
    
    DOSE_STATUS: {
        PENDING: 'pending',
        TAKEN: 'taken',
        MISSED: 'missed',
        SKIPPED: 'skipped',
        SNOOZED: 'snoozed'
    }
};

// Days of Week
export const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday', short: 'Mon' },
    { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { value: 'thursday', label: 'Thursday', short: 'Thu' },
    { value: 'friday', label: 'Friday', short: 'Fri' },
    { value: 'saturday', label: 'Saturday', short: 'Sat' },
    { value: 'sunday', label: 'Sunday', short: 'Sun' }
];

// Time Constants
export const TIME_CONSTANTS = {
    REMINDER_TIMES: [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ],
    
    SNOOZE_OPTIONS: [
        { minutes: 5, label: '5 minutes' },
        { minutes: 10, label: '10 minutes' },
        { minutes: 15, label: '15 minutes' },
        { minutes: 30, label: '30 minutes' },
        { minutes: 60, label: '1 hour' }
    ],
    
    TIME_FORMATS: {
        '12h': '12-hour',
        '24h': '24-hour'
    }
};

// User Roles
export const USER_ROLES = {
    PATIENT: 'patient',
    CAREGIVER: 'caregiver',
    DOCTOR: 'doctor',
    ADMIN: 'admin'
};

// Notification Types
export const NOTIFICATION_TYPES = {
    REMINDER: 'reminder',
    MISSED_DOSE: 'missed_dose',
    EMERGENCY: 'emergency',
    SYSTEM: 'system',
    ACHIEVEMENT: 'achievement',
    UPDATE: 'update'
};

// Theme Constants
export const THEME_CONSTANTS = {
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system'
    },
    
    COLORS: {
        PRIMARY: '#3b82f6',
        SECONDARY: '#10b981',
        DANGER: '#ef4444',
        WARNING: '#f59e0b',
        INFO: '#06b6d4',
        SUCCESS: '#10b981'
    }
};

// Local Storage Keys
export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    PREFERENCES: 'meditracker_preferences',
    THEME: 'meditracker_theme',
    LANGUAGE: 'meditracker_language',
    RECENT_SEARCHES: 'meditracker_recent_searches'
};

// Validation Constants
export const VALIDATION_CONSTANTS = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    DOSAGE_MAX_LENGTH: 20,
    INSTRUCTIONS_MAX_LENGTH: 500
};

// AI Constants
export const AI_CONSTANTS = {
    MODELS: {
        GEMINI_FLASH: 'gemini-1.5-flash',
        GEMINI_PRO: 'gemini-1.5-pro',
        GPT_35_TURBO: 'gpt-3.5-turbo',
        GPT_4: 'gpt-4'
    },
    
    MAX_TOKENS: 500,
    TEMPERATURE: 0.7,
    
    PROMPT_TEMPLATES: {
        MEDICATION_INFO: `You are MediTracker AI, a helpful medication assistant. 
        Provide accurate, concise information about medications.
        Always emphasize consulting healthcare professionals.
        Format responses clearly with bullet points when appropriate.`,
        
        SIDE_EFFECTS: `List common side effects, serious side effects that require immediate medical attention, 
        and tips for managing minor side effects.`,
        
        INTERACTIONS: `Explain potential interactions with other medications, foods, or substances.
        Highlight dangerous combinations.`,
        
        ADHERENCE_TIPS: `Provide practical tips for remembering to take medications,
        dealing with missed doses, and maintaining consistency.`
    }
};

// Export all constants
export default {
    APP_CONSTANTS,
    API_ENDPOINTS,
    MEDICATION_CONSTANTS,
    DAYS_OF_WEEK,
    TIME_CONSTANTS,
    USER_ROLES,
    NOTIFICATION_TYPES,
    THEME_CONSTANTS,
    STORAGE_KEYS,
    VALIDATION_CONSTANTS,
    AI_CONSTANTS
};
