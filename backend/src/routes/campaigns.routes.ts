import { Router } from 'express';
import { body } from 'express-validator';
import { createCampaign, getCampaigns } from '../controllers/campaignController';

const router = Router();

const campaignValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('name is required'),
  body('advertiser')
    .trim()
    .notEmpty().withMessage('advertiser is required'),
  body('startDate')
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date')
    .custom((value: string, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate as string)) {
        throw new Error('endDate must be after startDate');
      }
      return true;
    }),
  body('budget')
    .isFloat({ min: 1 }).withMessage('budget must be a positive number'),
  body('targetCountries')
    .isArray({ min: 1 }).withMessage('targetCountries must be a non-empty array'),
  body('targetCountries.*')
    .isString()
    .isLength({ min: 2, max: 2 }).withMessage('Each country must be a 2-letter ISO code')
    .customSanitizer((v: string) => v.toUpperCase()),
  body('status')
    .optional()
    .isIn(['active', 'paused', 'ended']).withMessage('status must be active, paused, or ended'),
];

router.post('/', campaignValidation, createCampaign);
router.get('/',  getCampaigns);

export default router;