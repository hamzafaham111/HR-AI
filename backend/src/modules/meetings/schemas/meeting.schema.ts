import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeetingDocument = Meeting & Document;

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

export enum MeetingType {
  INTERVIEW = 'interview',
  SCREENING = 'screening',
  TECHNICAL = 'technical',
  ONSITE = 'onsite',
  FOLLOW_UP = 'follow_up',
  GENERAL = 'general',
}

@Schema({ timestamps: true })
export class Meeting {
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  candidateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  jobId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  hiringProcessId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: MeetingType })
  type: MeetingType;

  @Prop({ required: true, enum: MeetingStatus, default: MeetingStatus.SCHEDULED })
  status: MeetingStatus;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop()
  duration: number; // in minutes

  @Prop()
  location?: string;

  @Prop()
  meetingLink?: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  interviewerIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  attendees: string[];

  @Prop()
  notes?: string;

  @Prop()
  outcome?: string;

  @Prop({ type: Object, default: {} })
  feedback: Record<string, any>;

  @Prop()
  reminderSent?: boolean;

  @Prop()
  reminderSentAt?: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
