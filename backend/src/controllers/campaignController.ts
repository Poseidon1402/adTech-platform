import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Campaign from '../models/Campaign';
import { CampaignStatus } from '../models/Campaign';

// For campaign creation
export const createCampaign = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, advertiser, startDate, endDate, budget, targetCountries, status } = req.body;

  const campaign = await Campaign.create({
    name,
    advertiser,
    startDate,
    endDate,
    budget,
    targetCountries: (targetCountries as string[]).map((c) => c.toUpperCase()),
    ...(status && { status }),
  });

  res.status(201).json(campaign);
};

// For fetching campaigns with filters
export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
  const { status, advertiser, country } = req.query;

  const filter: Record<string, unknown> = {};

  if (status)     filter.status = status as CampaignStatus;
  if (advertiser) filter.advertiser = { $regex: advertiser as string, $options: 'i' };
  if (country)    filter.targetCountries = { $in: [(country as string).toUpperCase()] };

  const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
  res.json(campaigns);
};