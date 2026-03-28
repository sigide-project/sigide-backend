import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, body, query, param, ValidationChain } from 'express-validator';

const VALID_CATEGORIES = [
  'electronics',
  'wallet',
  'keys',
  'documents',
  'bags',
  'jewellery',
  'pets',
  'clothing',
  'accessories',
  'other',
];

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[Validation] Failed:', JSON.stringify(errors.array()));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
      })),
    });
  }
  console.log('[Validation] Passed');
  next();
}

type ValidationMiddleware = (ValidationChain | RequestHandler)[];

interface ItemValidation {
  create: ValidationMiddleware;
  update: ValidationMiddleware;
  list: ValidationMiddleware;
  idParam: ValidationMiddleware;
}

export const itemValidation: ItemValidation = {
  create: [
    body('type')
      .isIn(['lost', 'found'])
      .withMessage('Type must be either "lost" or "found"'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
      .isIn(VALID_CATEGORIES)
      .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
    body('lat')
      .notEmpty()
      .withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('lng')
      .notEmpty()
      .withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('location_name')
      .trim()
      .notEmpty()
      .withMessage('Location name is required'),
    body('image_urls')
      .optional()
      .isArray({ max: 2 })
      .withMessage('Image URLs must be an array with at most 2 items'),
    body('image_urls.*')
      .optional()
      .isURL()
      .withMessage('Each image URL must be a valid URL'),
    body('reward_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Reward amount must be a non-negative number'),
    body('lost_found_at')
      .notEmpty()
      .withMessage('Lost/found date is required')
      .isISO8601()
      .withMessage('Lost/found date must be a valid ISO 8601 date')
      .custom((value) => {
        const date = new Date(value);
        if (date > new Date()) {
          throw new Error('Lost/found date cannot be in the future');
        }
        return true;
      }),
    handleValidationErrors,
  ],

  update: [
    body('type')
      .optional()
      .isIn(['lost', 'found'])
      .withMessage('Type must be either "lost" or "found"'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),
    body('description')
      .optional()
      .trim(),
    body('category')
      .optional()
      .trim()
      .isIn(VALID_CATEGORIES)
      .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
    body('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('location_name')
      .optional()
      .trim(),
    body('image_urls')
      .optional()
      .isArray({ max: 2 })
      .withMessage('Image URLs must be an array with at most 2 items'),
    body('image_urls.*')
      .optional()
      .isURL()
      .withMessage('Each image URL must be a valid URL'),
    body('reward_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Reward amount must be a non-negative number'),
    body('lost_found_at')
      .optional()
      .isISO8601()
      .withMessage('Lost/found date must be a valid ISO 8601 date')
      .custom((value) => {
        const date = new Date(value);
        if (date > new Date()) {
          throw new Error('Lost/found date cannot be in the future');
        }
        return true;
      }),
    handleValidationErrors,
  ],

  list: [
    query('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    query('lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    query('radius')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Radius must be a non-negative number'),
    query('minDistance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum distance must be a non-negative number'),
    query('maxDistance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum distance must be a non-negative number'),
    query('type')
      .optional()
      .isIn(['lost', 'found'])
      .withMessage('Type must be either "lost" or "found"'),
    query('category')
      .optional()
      .isIn(VALID_CATEGORIES)
      .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
    query('tags')
      .optional()
      .custom((value) => {
        const tagsArray = Array.isArray(value) ? value : value.split(',').map((t: string) => t.trim());
        return tagsArray.every((tag: string) => VALID_CATEGORIES.includes(tag));
      })
      .withMessage(`Tags must be valid categories: ${VALID_CATEGORIES.join(', ')}`),
    query('status')
      .optional()
      .isIn(['open', 'claimed', 'resolved', 'cancelled'])
      .withMessage('Status must be one of: open, claimed, resolved, cancelled'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Search query must be at most 200 characters'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'reward_amount', 'distance', 'title'])
      .withMessage('Sort by must be one of: createdAt, reward_amount, distance, title'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either "asc" or "desc"'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('Invalid item ID'),
    handleValidationErrors,
  ],
};

interface UserValidation {
  updateMe: ValidationMiddleware;
  changePassword: ValidationMiddleware;
  setPassword: ValidationMiddleware;
  updateUsername: ValidationMiddleware;
  usernameParam: ValidationMiddleware;
}

export const userValidation: UserValidation = {
  updateMe: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('phone')
      .optional()
      .matches(/^\d+$/)
      .withMessage('Phone must be a numeric string'),
    body('avatar_url')
      .optional()
      .isURL()
      .withMessage('Avatar URL must be a valid URL'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    handleValidationErrors,
  ],

  updateUsername: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    handleValidationErrors,
  ],

  usernameParam: [
    param('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),
    handleValidationErrors,
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    handleValidationErrors,
  ],

  setPassword: [
    body('newPassword')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    handleValidationErrors,
  ],
};

interface AddressValidation {
  create: ValidationMiddleware;
  update: ValidationMiddleware;
  idParam: ValidationMiddleware;
}

export const addressValidation: AddressValidation = {
  create: [
    body('label')
      .trim()
      .notEmpty()
      .withMessage('Label is required')
      .isLength({ max: 50 })
      .withMessage('Label must be at most 50 characters'),
    body('address_line1')
      .trim()
      .notEmpty()
      .withMessage('Address line 1 is required')
      .isLength({ max: 255 })
      .withMessage('Address line 1 must be at most 255 characters'),
    body('address_line2')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Address line 2 must be at most 255 characters'),
    body('city')
      .trim()
      .notEmpty()
      .withMessage('City is required')
      .isLength({ max: 100 })
      .withMessage('City must be at most 100 characters'),
    body('state')
      .trim()
      .notEmpty()
      .withMessage('State is required')
      .isLength({ max: 100 })
      .withMessage('State must be at most 100 characters'),
    body('postal_code')
      .trim()
      .notEmpty()
      .withMessage('Postal code is required')
      .isLength({ max: 20 })
      .withMessage('Postal code must be at most 20 characters'),
    body('country')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Country must be at most 100 characters'),
    body('is_default')
      .optional()
      .isBoolean()
      .withMessage('is_default must be a boolean'),
    body('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    handleValidationErrors,
  ],

  update: [
    body('label')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Label must be at most 50 characters'),
    body('address_line1')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Address line 1 must be at most 255 characters'),
    body('address_line2')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Address line 2 must be at most 255 characters'),
    body('city')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('City must be at most 100 characters'),
    body('state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must be at most 100 characters'),
    body('postal_code')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Postal code must be at most 20 characters'),
    body('country')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Country must be at most 100 characters'),
    body('is_default')
      .optional()
      .isBoolean()
      .withMessage('is_default must be a boolean'),
    body('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    handleValidationErrors,
  ],

  idParam: [
    param('id')
      .isUUID()
      .withMessage('Invalid address ID'),
    handleValidationErrors,
  ],
};

const VALID_ISSUE_TYPES = [
  'Bug or Technical Issue',
  'Suspicious User/Listing',
  'Inappropriate Content',
  'Scam or Fraud',
  'Account Issue',
  'Other',
];

interface ContactValidation {
  create: ValidationMiddleware;
}

export const contactValidation: ContactValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Subject must be between 2 and 255 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Message must be between 10 and 5000 characters'),
    handleValidationErrors,
  ],
};

interface ReportsValidation {
  create: ValidationMiddleware;
}

export const reportsValidation: ReportsValidation = {
  create: [
    body('issue_type')
      .trim()
      .notEmpty()
      .withMessage('Issue type is required')
      .isIn(VALID_ISSUE_TYPES)
      .withMessage(`Issue type must be one of: ${VALID_ISSUE_TYPES.join(', ')}`),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('listing_url')
      .optional({ values: 'falsy' })
      .isURL()
      .withMessage('Listing URL must be a valid URL'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Description must be between 10 and 5000 characters'),
    handleValidationErrors,
  ],
};

interface FeedbackValidation {
  create: ValidationMiddleware;
}

export const feedbackValidation: FeedbackValidation = {
  create: [
    body('rating')
      .optional({ values: 'null' })
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be an integer between 1 and 5'),
    body('name')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('email')
      .optional({ values: 'falsy' })
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('feedback')
      .trim()
      .notEmpty()
      .withMessage('Feedback is required')
      .isLength({ min: 5, max: 5000 })
      .withMessage('Feedback must be between 5 and 5000 characters'),
    handleValidationErrors,
  ],
};
