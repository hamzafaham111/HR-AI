import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  TEMPORARY = 'temporary',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

@Schema({ _id: false })
export class JobRequirement {
  @Prop({ required: true })
  skill: string;

  @Prop({ required: true, default: 'Intermediate' })
  level: string;

  @Prop({ required: true, default: 1.0 })
  weight: number;
}

@Schema({ timestamps: true })
export class Job {
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, enum: JobType, default: JobType.FULL_TIME })
  jobType: JobType;

  @Prop({ required: true, enum: ExperienceLevel, default: ExperienceLevel.MID })
  experienceLevel: ExperienceLevel;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [JobRequirement], default: [] })
  requirements: JobRequirement[];

  @Prop({ type: [String], default: [] })
  responsibilities: string[];

  @Prop({ type: [String], default: [] })
  benefits: string[];

  @Prop()
  salaryRange?: string;

  @Prop({ required: true, enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus;

  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;
}

export const JobRequirementSchema = SchemaFactory.createForClass(JobRequirement);
export const JobSchema = SchemaFactory.createForClass(Job);
