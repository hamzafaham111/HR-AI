import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HiringProcessDocument = HiringProcess & Document;

export enum HiringProcessStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum HiringStage {
  SCREENING = 'screening',
  PHONE_INTERVIEW = 'phone_interview',
  TECHNICAL_INTERVIEW = 'technical_interview',
  ONSITE_INTERVIEW = 'onsite_interview',
  REFERENCE_CHECK = 'reference_check',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class HiringProcess {
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  jobId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: HiringProcessStatus, default: HiringProcessStatus.DRAFT })
  status: HiringProcessStatus;

  @Prop({ type: [String], default: [] })
  stages: HiringStage[];

  @Prop({ default: HiringStage.SCREENING })
  currentStage: HiringStage;

  @Prop({ type: [Types.ObjectId], default: [] })
  candidateIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  interviewerIds: Types.ObjectId[];

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  notes?: string;

  @Prop({ type: Object, default: {} })
  criteria: Record<string, any>;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

export const HiringProcessSchema = SchemaFactory.createForClass(HiringProcess);
