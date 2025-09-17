import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsObject, IsMongoId, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, ApplicationSource } from '../schemas/job-application.schema';

export class JobApplicationCreateDto {
  @ApiProperty({ description: 'Job ID for this application' })
  @IsMongoId()
  jobId: string;

  @ApiProperty({ description: 'Candidate ID for this application' })
  @IsMongoId()
  candidateId: string;

  @ApiPropertyOptional({ description: 'Resume ID for this application' })
  @IsMongoId()
  @IsOptional()
  resumeId?: string;

  @ApiPropertyOptional({ description: 'Application status', enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus = ApplicationStatus.PENDING;

  @ApiPropertyOptional({ description: 'Application source', enum: ApplicationSource })
  @IsEnum(ApplicationSource)
  @IsOptional()
  source?: ApplicationSource = ApplicationSource.DIRECT_APPLICATION;

  @ApiPropertyOptional({ description: 'Cover letter' })
  @IsString()
  @IsOptional()
  coverLetter?: string;

  @ApiPropertyOptional({ description: 'Expected salary' })
  @IsString()
  @IsOptional()
  expectedSalary?: string;

  @ApiPropertyOptional({ description: 'Availability' })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiPropertyOptional({ description: 'Application notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional application data' })
  @IsObject()
  @IsOptional()
  applicationData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Interviewer IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  interviewerIds?: string[];
}

export class JobApplicationUpdateDto {
  @ApiPropertyOptional({ description: 'Application status', enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Cover letter' })
  @IsString()
  @IsOptional()
  coverLetter?: string;

  @ApiPropertyOptional({ description: 'Expected salary' })
  @IsString()
  @IsOptional()
  expectedSalary?: string;

  @ApiPropertyOptional({ description: 'Availability' })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiPropertyOptional({ description: 'Application notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional application data' })
  @IsObject()
  @IsOptional()
  applicationData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Screening results' })
  @IsObject()
  @IsOptional()
  screeningResults?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Interview feedback' })
  @IsObject()
  @IsOptional()
  interviewFeedback?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Interviewer IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  interviewerIds?: string[];

  @ApiPropertyOptional({ description: 'Application score' })
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({ description: 'AI analysis results' })
  @IsObject()
  @IsOptional()
  aiAnalysis?: Record<string, any>;
}

export class JobApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  id: string;

  @ApiProperty({ description: 'Job ID' })
  jobId: string;

  @ApiProperty({ description: 'Candidate ID' })
  candidateId: string;

  @ApiProperty({ description: 'Resume ID' })
  resumeId?: string;

  @ApiProperty({ description: 'Application status', enum: ApplicationStatus })
  status: ApplicationStatus;

  @ApiProperty({ description: 'Application source', enum: ApplicationSource })
  source: ApplicationSource;

  @ApiProperty({ description: 'Cover letter' })
  coverLetter?: string;

  @ApiProperty({ description: 'Expected salary' })
  expectedSalary?: string;

  @ApiProperty({ description: 'Availability' })
  availability?: string;

  @ApiProperty({ description: 'Application notes' })
  notes?: string;

  @ApiProperty({ description: 'Additional application data' })
  applicationData: Record<string, any>;

  @ApiProperty({ description: 'Screening results' })
  screeningResults: Record<string, any>;

  @ApiProperty({ description: 'Interview feedback' })
  interviewFeedback: Record<string, any>;

  @ApiProperty({ description: 'Applied date' })
  appliedAt: Date;

  @ApiProperty({ description: 'Reviewed date' })
  reviewedAt?: Date;

  @ApiProperty({ description: 'Shortlisted date' })
  shortlistedAt?: Date;

  @ApiProperty({ description: 'Interviewed date' })
  interviewedAt?: Date;

  @ApiProperty({ description: 'Rejected date' })
  rejectedAt?: Date;

  @ApiProperty({ description: 'Hired date' })
  hiredAt?: Date;

  @ApiProperty({ description: 'Withdrawn date' })
  withdrawnAt?: Date;

  @ApiProperty({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Interviewer IDs' })
  interviewerIds: string[];

  @ApiProperty({ description: 'Meeting IDs' })
  meetingIds: string[];

  @ApiProperty({ description: 'Application score' })
  score?: number;

  @ApiProperty({ description: 'AI analysis results' })
  aiAnalysis: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
