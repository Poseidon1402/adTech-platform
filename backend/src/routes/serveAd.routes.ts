import { Router } from 'express';
import { body } from 'express-validator';
import { serveAd } from '../controllers/adController';

const router = Router();

router.post(
  '/',
  [
    body('country')
      .trim()
      .notEmpty().withMessage('country is required')
      .isLength({ min: 2, max: 2 }).withMessage('country must be a 2-letter ISO code'),
  ],
  serveAd
);

export default router;