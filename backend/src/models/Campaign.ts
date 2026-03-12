import mongoose, { Document, Schema } from 'mongoose';

export type CampaignStatus = 'active' | 'paused' | 'ended';

export interface Campaign extends Document {
  name: string;
  advertiser: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  impressionsServed: number;
  targetCountries: string[];
  status: CampaignStatus;
}

const CampaignSchema = new Schema<Campaign>(
  {
    name:            { type: String, required: true, trim: true },
    advertiser:      { type: String, required: true, trim: true },
    startDate:       { type: Date,   required: true },
    endDate:         { type: Date,   required: true },
    budget:          { type: Number, required: true, min: 1 },
    impressionsServed: { type: Number, default: 0 },
    targetCountries: {
      type: [String],
      required: true,
      validate: { validator: (v: string[]) => v.length > 0, message: 'At least one country required' },
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'ended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

CampaignSchema.index({ status: 1 });
CampaignSchema.index({ advertiser: 1 });
CampaignSchema.index({ targetCountries: 1 });
CampaignSchema.index({ status: 1, targetCountries: 1, startDate: 1, endDate: 1 });

export default mongoose.model<Campaign>('Campaign', CampaignSchema);