import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResumeBankDocument = ResumeBank & Document;

export enum ResumeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SHORTLISTED = 'shortlisted',
  ARCHIVED = 'archived',
}

export enum ResumeSource {
  DIRECT_UPLOAD = 'direct_upload',
  JOB_APPLICATION = 'job_application',
  IMPORT = 'import',
}

@Schema({ timestamps: true })
export class ResumeBank {
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  candidateName: string;

  @Prop({ required: true })
  candidateEmail: string;

  @Prop()
  candidatePhone?: string;

  @Prop()
  candidateLocation?: string;

  @Prop()
  yearsExperience?: number;

  @Prop()
  currentRole?: string;

  @Prop()
  desiredRole?: string;

  @Prop()
  salaryExpectation?: string;

  @Prop()
  availability?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  notes?: string;

  @Prop()
  summary?: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop()
  education?: string;

  @Prop()
  experienceLevel?: string;

  @Prop()
  overallAssessment?: string;

  @Prop({ required: true, enum: ResumeStatus, default: ResumeStatus.ACTIVE })
  status: ResumeStatus;

  @Prop()
  lastContactDate?: Date;

  @Prop({ required: true, enum: ResumeSource, default: ResumeSource.DIRECT_UPLOAD })
  source: ResumeSource;

  @Prop()
  jobId?: string;

  @Prop()
  applicationId?: string;
}

export const ResumeBankSchema = SchemaFactory.createForClass(ResumeBank);
