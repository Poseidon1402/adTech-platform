export type CampaignStatus = 'active' | 'paused' | 'ended';

export interface Campaign {
  _id: string;
  name: string;
  advertiser: string;
  startDate: string;
  endDate: string;
  budget: number;
  impressionsServed: number;
  targetCountries: string[];
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}