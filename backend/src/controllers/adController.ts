import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Campaign from '../models/Campaign';

// For serving an ad based on country and campaign eligibility
export const serveAd = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { country } = req.body;
  const now = new Date();

  const campaign = await Campaign.findOneAndUpdate(
    {
      status: 'active',
      targetCountries: (country as string).toUpperCase(),
      startDate: { $lte: now },
      endDate:   { $gte: now },
      $expr: { $lt: ['$impressionsServed', '$budget'] },
    },
    { $inc: { impressionsServed: 1 } },
    { new: true }
  );

  if (!campaign) {
    res.status(404).json({
      message: 'No eligible campaign found for the given country.',
    });
    return;
  }

  res.json(campaign);
};