import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsObject, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HiringProcessStatus, HiringStage } from '../schemas/hiring-process.schema';

export class HiringProcessCreateDto {
  @ApiProperty({ description: 'Job ID for this hiring process' })
  @IsMongoId()
  jobId: string;

  @ApiProperty({ description: 'Hiring process title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Hiring process description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Hiring process status', enum: HiringProcessStatus })
  @IsEnum(HiringProcessStatus)
  @IsOptional()
  status?: HiringProcessStatus = HiringProcessStatus.DRAFT;

  @ApiPropertyOptional({ description: 'Hiring stages', type: [String], enum: HiringStage })
  @IsArray()
  @IsEnum(HiringStage, { each: true })
  @IsOptional()
  stages?: HiringStage[];

  @ApiPropertyOptional({ description: 'Current hiring stage', enum: HiringStage })
  @IsEnum(HiringStage)
  @IsOptional()
  currentStage?: HiringStage = HiringStage.SCREENING;

  @ApiPropertyOptional({ description: 'Candidate IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  candidateIds?: string[];

  @ApiPropertyOptional({ description: 'Interviewer IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  interviewerIds?: string[];

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Hiring criteria' })
  @IsObject()
  @IsOptional()
  criteria?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Process settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

export class HiringProcessUpdateDto {
  @ApiPropertyOptional({ description: 'Hiring process title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Hiring process description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Hiring process status', enum: HiringProcessStatus })
  @IsEnum(HiringProcessStatus)
  @IsOptional()
  status?: HiringProcessStatus;

  @ApiPropertyOptional({ description: 'Hiring stages', type: [String], enum: HiringStage })
  @IsArray()
  @IsEnum(HiringStage, { each: true })
  @IsOptional()
  stages?: HiringStage[];

  @ApiPropertyOptional({ description: 'Current hiring stage', enum: HiringStage })
  @IsEnum(HiringStage)
  @IsOptional()
  currentStage?: HiringStage;

  @ApiPropertyOptional({ description: 'Candidate IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  candidateIds?: string[];

  @ApiPropertyOptional({ description: 'Interviewer IDs' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  interviewerIds?: string[];

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Hiring criteria' })
  @IsObject()
  @IsOptional()
  criteria?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Process settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

export class HiringProcessResponseDto {
  @ApiProperty({ description: 'Hiring process ID' })
  id: string;

  @ApiProperty({ description: 'Job ID' })
  jobId: string;

  @ApiProperty({ description: 'Hiring process title' })
  title: string;

  @ApiProperty({ description: 'Hiring process description' })
  description: string;

  @ApiProperty({ description: 'Hiring process status', enum: HiringProcessStatus })
  status: HiringProcessStatus;

  @ApiProperty({ description: 'Hiring stages', type: [String], enum: HiringStage })
  stages: HiringStage[];

  @ApiProperty({ description: 'Current hiring stage', enum: HiringStage })
  currentStage: HiringStage;

  @ApiProperty({ description: 'Candidate IDs' })
  candidateIds: string[];

  @ApiProperty({ description: 'Interviewer IDs' })
  interviewerIds: string[];

  @ApiProperty({ description: 'Start date' })
  startDate?: Date;

  @ApiProperty({ description: 'End date' })
  endDate?: Date;

  @ApiProperty({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Hiring criteria' })
  criteria: Record<string, any>;

  @ApiProperty({ description: 'Process settings' })
  settings: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
