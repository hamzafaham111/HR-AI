import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobApplicationDocument = JobApplication & Document;

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  SHORTLISTED = 'shortlisted',
  INTERVIEWED = 'interviewed',
  REJECTED = 'rejected',
  HIRED = 'hired',
  WITHDRAWN = 'withdrawn',
}

export enum ApplicationSource {
  DIRECT_APPLICATION = 'direct_application',
  RESUME_BANK = 'resume_bank',
  REFERRAL = 'referral',
  JOB_BOARD = 'job_board',
  SOCIAL_MEDIA = 'social_media',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class JobApplication {
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  jobId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  candidateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  resumeId?: Types.ObjectId;

  @Prop({ required: true, enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @Prop({ required: true, enum: ApplicationSource, default: ApplicationSource.DIRECT_APPLICATION })
  source: ApplicationSource;

  @Prop()
  coverLetter?: string;

  @Prop()
  expectedSalary?: string;

  @Prop()
  availability?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Object, default: {} })
  applicationData: Record<string, any>;

  @Prop({ type: Object, default: {} })
  screeningResults: Record<string, any>;

  @Prop({ type: Object, default: {} })
  interviewFeedback: Record<string, any>;

  @Prop()
  appliedAt: Date;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  shortlistedAt?: Date;

  @Prop()
  interviewedAt?: Date;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  hiredAt?: Date;

  @Prop()
  withdrawnAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  interviewerIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  meetingIds: Types.ObjectId[];

  @Prop()
  score?: number; // Overall application score

  @Prop({ type: Object, default: {} })
  aiAnalysis: Record<string, any>;
}

export const JobApplicationSchema = SchemaFactory.createForClass(JobApplication);
