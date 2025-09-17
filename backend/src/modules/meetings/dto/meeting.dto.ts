import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsObject, IsMongoId, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeetingStatus, MeetingType } from '../schemas/meeting.schema';

export class MeetingCreateDto {
  @ApiProperty({ description: 'Candidate ID for this meeting' })
  @IsMongoId()
  candidateId: string;

  @ApiPropertyOptional({ description: 'Job ID for this meeting' })
  @IsMongoId()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Hiring process ID for this meeting' })
  @IsMongoId()
  @IsOptional()
  hiringProcessId?: string;

  @ApiProperty({ description: 'Meeting title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Meeting description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Meeting type', enum: MeetingType })
  @IsEnum(MeetingType)
  type: MeetingType;

  @ApiPropertyOptional({ description: 'Meeting status', enum: MeetingStatus })
  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus = MeetingStatus.SCHEDULED;

  @ApiProperty({ description: 'Scheduled date and time' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ description: 'Meeting duration in minutes' })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({ description: 'Meeting location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Meeting link (for virtual meetings)' })
  @IsString()
  @IsOptional()
  meetingLink?: string;

  @ApiPropertyOptional({ description: 'Interviewer IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  interviewerIds?: string[];

  @ApiPropertyOptional({ description: 'Additional attendees' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendees?: string[];

  @ApiPropertyOptional({ description: 'Meeting notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Meeting feedback' })
  @IsObject()
  @IsOptional()
  feedback?: Record<string, any>;
}

export class MeetingUpdateDto {
  @ApiPropertyOptional({ description: 'Meeting title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Meeting description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Meeting type', enum: MeetingType })
  @IsEnum(MeetingType)
  @IsOptional()
  type?: MeetingType;

  @ApiPropertyOptional({ description: 'Meeting status', enum: MeetingStatus })
  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus;

  @ApiPropertyOptional({ description: 'Scheduled date and time' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Meeting duration in minutes' })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Meeting location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Meeting link (for virtual meetings)' })
  @IsString()
  @IsOptional()
  meetingLink?: string;

  @ApiPropertyOptional({ description: 'Interviewer IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  interviewerIds?: string[];

  @ApiPropertyOptional({ description: 'Additional attendees' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendees?: string[];

  @ApiPropertyOptional({ description: 'Meeting notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Meeting outcome' })
  @IsString()
  @IsOptional()
  outcome?: string;

  @ApiPropertyOptional({ description: 'Meeting feedback' })
  @IsObject()
  @IsOptional()
  feedback?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Reminder sent status' })
  @IsBoolean()
  @IsOptional()
  reminderSent?: boolean;
}

export class MeetingResponseDto {
  @ApiProperty({ description: 'Meeting ID' })
  id: string;

  @ApiProperty({ description: 'Candidate ID' })
  candidateId: string;

  @ApiProperty({ description: 'Job ID' })
  jobId?: string;

  @ApiProperty({ description: 'Hiring process ID' })
  hiringProcessId?: string;

  @ApiProperty({ description: 'Meeting title' })
  title: string;

  @ApiProperty({ description: 'Meeting description' })
  description: string;

  @ApiProperty({ description: 'Meeting type', enum: MeetingType })
  type: MeetingType;

  @ApiProperty({ description: 'Meeting status', enum: MeetingStatus })
  status: MeetingStatus;

  @ApiProperty({ description: 'Scheduled date and time' })
  scheduledAt: Date;

  @ApiProperty({ description: 'Meeting duration in minutes' })
  duration: number;

  @ApiProperty({ description: 'Meeting location' })
  location?: string;

  @ApiProperty({ description: 'Meeting link' })
  meetingLink?: string;

  @ApiProperty({ description: 'Interviewer IDs' })
  interviewerIds: string[];

  @ApiProperty({ description: 'Additional attendees' })
  attendees: string[];

  @ApiProperty({ description: 'Meeting notes' })
  notes?: string;

  @ApiProperty({ description: 'Meeting outcome' })
  outcome?: string;

  @ApiProperty({ description: 'Meeting feedback' })
  feedback: Record<string, any>;

  @ApiProperty({ description: 'Reminder sent status' })
  reminderSent: boolean;

  @ApiProperty({ description: 'Reminder sent date' })
  reminderSentAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
