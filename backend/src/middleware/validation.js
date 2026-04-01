const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
exports.validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const errorMessages = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }));

        res.status(400).json({
            error: 'Validation failed',
            details: errorMessages
        });
    };
};

// Common validation rules
exports.authValidations = {
    register: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ max: 50 })
            .withMessage('Name must be less than 50 characters'),
        body('phone')
            .optional()
            .isMobilePhone()
            .withMessage('Please provide a valid phone number')
    ],
    
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    
    forgotPassword: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address')
    ],
    
    resetPassword: [
        body('token')
            .notEmpty()
            .withMessage('Reset token is required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
    ]
};

exports.medicationValidations = {
    create: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Medication name is required')
            .isLength({ max: 100 })
            .withMessage('Medication name must be less than 100 characters'),
        body('dosage')
            .trim()
            .notEmpty()
            .withMessage('Dosage is required')
            .isLength({ max: 50 })
            .withMessage('Dosage must be less than 50 characters'),
        body('frequency')
            .isIn(['daily', 'weekly', 'monthly', 'custom'])
            .withMessage('Invalid frequency value'),
        body('startDate')
            .isISO8601()
            .withMessage('Invalid start date format')
            .toDate(),
        body('endDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format')
            .toDate()
            .custom((value, { req }) => {
                if (value && value < req.body.startDate) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        body('schedule')
            .isArray()
            .withMessage('Schedule must be an array')
            .custom((schedule) => {
                if (!schedule.length) {
                    throw new Error('At least one schedule entry is required');
                }
                return true;
            })
    ],
    
    updateDose: [
        param('doseId')
            .isMongoId()
            .withMessage('Invalid dose ID'),
        body('status')
            .isIn(['taken', 'missed', 'snoozed', 'pending'])
            .withMessage('Invalid status value')
    ]
};

exports.healthValidations = {
    create: [
        body('date')
            .isISO8601()
            .withMessage('Invalid date format')
            .toDate(),
        body('bloodPressure.systolic')
            .optional()
            .isInt({ min: 50, max: 250 })
            .withMessage('Systolic pressure must be between 50 and 250'),
        body('bloodPressure.diastolic')
            .optional()
            .isInt({ min: 30, max: 150 })
            .withMessage('Diastolic pressure must be between 30 and 150'),
        body('bloodSugar')
            .optional()
            .isFloat({ min: 20, max: 500 })
            .withMessage('Blood sugar must be between 20 and 500 mg/dL'),
        body('weight')
            .optional()
            .isFloat({ min: 20, max: 300 })
            .withMessage('Weight must be between 20 and 300 kg'),
        body('temperature')
            .optional()
            .isFloat({ min: 35, max: 42 })
            .withMessage('Temperature must be between 35°C and 42°C'),
        body('heartRate')
            .optional()
            .isInt({ min: 30, max: 200 })
            .withMessage('Heart rate must be between 30 and 200 bpm')
    ]
};