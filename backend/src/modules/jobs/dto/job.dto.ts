import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType, ExperienceLevel, JobStatus } from '../schemas/job.schema';

export class JobRequirementDto {
  @ApiProperty({ description: 'Required skill' })
  @IsString()
  skill: string;

  @ApiProperty({ description: 'Skill level required', default: 'Intermediate' })
  @IsString()
  @IsOptional()
  level?: string = 'Intermediate';

  @ApiProperty({ description: 'Weight of this requirement', minimum: 0, maximum: 10, default: 1.0 })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  weight?: number = 1.0;
}

export class JobCreateDto {
  @ApiProperty({ description: 'Job title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  company: string;

  @ApiProperty({ description: 'Job location' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Job type', enum: JobType, default: JobType.FULL_TIME })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType = JobType.FULL_TIME;

  @ApiProperty({ description: 'Experience level required', enum: ExperienceLevel, default: ExperienceLevel.MID })
  @IsEnum(ExperienceLevel)
  @IsOptional()
  experienceLevel?: ExperienceLevel = ExperienceLevel.MID;

  @ApiProperty({ description: 'Job description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Job requirements', type: [JobRequirementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobRequirementDto)
  @IsOptional()
  requirements?: JobRequirementDto[] = [];

  @ApiProperty({ description: 'Job responsibilities', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[] = [];

  @ApiProperty({ description: 'Job benefits', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[] = [];

  @ApiPropertyOptional({ description: 'Salary range' })
  @IsString()
  @IsOptional()
  salaryRange?: string;

  @ApiProperty({ description: 'Job status', enum: JobStatus, default: JobStatus.DRAFT })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus = JobStatus.DRAFT;
}

export class JobUpdateDto {
  @ApiPropertyOptional({ description: 'Job title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ description: 'Job location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Job type', enum: JobType })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;

  @ApiPropertyOptional({ description: 'Experience level required', enum: ExperienceLevel })
  @IsEnum(ExperienceLevel)
  @IsOptional()
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Job requirements', type: [JobRequirementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobRequirementDto)
  @IsOptional()
  requirements?: JobRequirementDto[];

  @ApiPropertyOptional({ description: 'Job responsibilities', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[];

  @ApiPropertyOptional({ description: 'Job benefits', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @ApiPropertyOptional({ description: 'Salary range' })
  @IsString()
  @IsOptional()
  salaryRange?: string;

  @ApiPropertyOptional({ description: 'Job status', enum: JobStatus })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}

export class JobResponseDto {
  @ApiProperty({ description: 'Job ID' })
  id: string;

  @ApiProperty({ description: 'Job title' })
  title: string;

  @ApiProperty({ description: 'Company name' })
  company: string;

  @ApiProperty({ description: 'Job location' })
  location: string;

  @ApiProperty({ description: 'Job type', enum: JobType })
  jobType: JobType;

  @ApiProperty({ description: 'Experience level required', enum: ExperienceLevel })
  experienceLevel: ExperienceLevel;

  @ApiProperty({ description: 'Job description' })
  description: string;

  @ApiProperty({ description: 'Job requirements', type: [JobRequirementDto] })
  requirements: JobRequirementDto[];

  @ApiProperty({ description: 'Job responsibilities', type: [String] })
  responsibilities: string[];

  @ApiProperty({ description: 'Job benefits', type: [String] })
  benefits: string[];

  @ApiPropertyOptional({ description: 'Salary range' })
  salaryRange?: string;

  @ApiProperty({ description: 'Job status', enum: JobStatus })
  status: JobStatus;

  @ApiProperty({ description: 'Job creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Job last update date' })
  updatedAt: Date;
}

export class ParseTextDto {
  @ApiProperty({ description: 'Text content to parse' })
  @IsString()
  content: string;
}

export class ParseTextResponseDto {
  @ApiPropertyOptional({ description: 'Parsed job title' })
  title?: string;

  @ApiPropertyOptional({ description: 'Parsed company name' })
  company?: string;

  @ApiPropertyOptional({ description: 'Parsed location' })
  location?: string;

  @ApiPropertyOptional({ description: 'Parsed job type' })
  jobType?: string;

  @ApiPropertyOptional({ description: 'Parsed experience level' })
  experienceLevel?: string;

  @ApiPropertyOptional({ description: 'Parsed description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Parsed salary range' })
  salaryRange?: string;

  @ApiProperty({ description: 'Parsed requirements', type: [JobRequirementDto] })
  requirements: JobRequirementDto[] = [];

  @ApiProperty({ description: 'Parsed responsibilities', type: [String] })
  responsibilities: string[] = [];

  @ApiProperty({ description: 'Parsed benefits', type: [String] })
  benefits: string[] = [];
}
