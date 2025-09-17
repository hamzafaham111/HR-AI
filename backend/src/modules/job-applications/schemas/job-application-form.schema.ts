import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobApplicationFormDocument = JobApplicationForm & Document;

export interface FormField {
  id: number;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

@Schema({ timestamps: true })
export class JobApplicationForm {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Job' })
  jobId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: [Object], required: true })
  fields: FormField[];

  @Prop({ default: true })
  requiresResume: boolean;

  @Prop({ default: false })
  allowMultipleFiles: boolean;

  @Prop({ default: 10 })
  maxFileSizeMb: number;

  @Prop({ type: [String], default: ['pdf', 'doc', 'docx'] })
  allowedFileTypes: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: Date, default: null })
  expiresAt?: Date;

  @Prop({ default: 0 })
  submissionCount: number;

  @Prop({ type: Object, default: {} })
  settings: {
    allowAnonymousSubmissions?: boolean;
    requireEmailVerification?: boolean;
    autoRespond?: boolean;
    responseMessage?: string;
    redirectUrl?: string;
  };

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const JobApplicationFormSchema = SchemaFactory.createForClass(JobApplicationForm);

// Indexes for better performance
JobApplicationFormSchema.index({ userId: 1, jobId: 1 });
JobApplicationFormSchema.index({ jobId: 1, isActive: 1 });
JobApplicationFormSchema.index({ isPublic: 1, isActive: 1 });
JobApplicationFormSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

