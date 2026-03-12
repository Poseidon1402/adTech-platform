import { Request, Response } from 'express';
import Campaign from '../models/Campaign';

// For fetching statistics about campaigns
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  const [totalCampaigns, activeCampaigns, impressionsResult, topAdvertiserResult] =
    await Promise.all([
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'active' }),
      Campaign.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: '$impressionsServed' } } },
      ]),
      Campaign.aggregate<{ _id: string; totalImpressions: number }>([
        { $group: { _id: '$advertiser', totalImpressions: { $sum: '$impressionsServed' } } },
        { $sort: { totalImpressions: -1 } },
        { $limit: 1 },
      ]),
    ]);

  res.json({
    totalCampaigns,
    activeCampaigns,
    totalImpressions:  impressionsResult[0]?.total ?? 0,
    topAdvertiser:     topAdvertiserResult[0]?._id ?? null,
  });
};