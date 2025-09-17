import { IsString, IsEmail, IsOptional, IsArray, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResumeStatus, ResumeSource } from '../schemas/resume-bank.schema';

export class ResumeBankCreateDto {
  @ApiProperty({ description: 'Resume filename' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Candidate full name' })
  @IsString()
  candidateName: string;

  @ApiProperty({ description: 'Candidate email address' })
  @IsEmail()
  candidateEmail: string;

  @ApiPropertyOptional({ description: 'Candidate phone number' })
  @IsString()
  @IsOptional()
  candidatePhone?: string;

  @ApiPropertyOptional({ description: 'Candidate location' })
  @IsString()
  @IsOptional()
  candidateLocation?: string;

  @ApiPropertyOptional({ description: 'Years of experience' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsExperience?: number;

  @ApiPropertyOptional({ description: 'Current role' })
  @IsString()
  @IsOptional()
  currentRole?: string;

  @ApiPropertyOptional({ description: 'Desired role' })
  @IsString()
  @IsOptional()
  desiredRole?: string;

  @ApiPropertyOptional({ description: 'Salary expectation' })
  @IsString()
  @IsOptional()
  salaryExpectation?: string;

  @ApiPropertyOptional({ description: 'Availability' })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Resume source', enum: ResumeSource, default: ResumeSource.DIRECT_UPLOAD })
  @IsEnum(ResumeSource)
  @IsOptional()
  source?: ResumeSource = ResumeSource.DIRECT_UPLOAD;

  @ApiPropertyOptional({ description: 'Associated job ID' })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Associated application ID' })
  @IsString()
  @IsOptional()
  applicationId?: string;
}

export class ResumeBankUpdateDto {
  @ApiPropertyOptional({ description: 'Candidate full name' })
  @IsString()
  @IsOptional()
  candidateName?: string;

  @ApiPropertyOptional({ description: 'Candidate email address' })
  @IsEmail()
  @IsOptional()
  candidateEmail?: string;

  @ApiPropertyOptional({ description: 'Candidate phone number' })
  @IsString()
  @IsOptional()
  candidatePhone?: string;

  @ApiPropertyOptional({ description: 'Candidate location' })
  @IsString()
  @IsOptional()
  candidateLocation?: string;

  @ApiPropertyOptional({ description: 'Years of experience' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsExperience?: number;

  @ApiPropertyOptional({ description: 'Current role' })
  @IsString()
  @IsOptional()
  currentRole?: string;

  @ApiPropertyOptional({ description: 'Desired role' })
  @IsString()
  @IsOptional()
  desiredRole?: string;

  @ApiPropertyOptional({ description: 'Salary expectation' })
  @IsString()
  @IsOptional()
  salaryExpectation?: string;

  @ApiPropertyOptional({ description: 'Availability' })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Resume status', enum: ResumeStatus })
  @IsEnum(ResumeStatus)
  @IsOptional()
  status?: ResumeStatus;
}

export class ResumeBankResponseDto {
  @ApiProperty({ description: 'Resume ID' })
  id: string;

  @ApiProperty({ description: 'Resume filename' })
  filename: string;

  @ApiProperty({ description: 'Candidate full name' })
  candidateName: string;

  @ApiProperty({ description: 'Candidate email address' })
  candidateEmail: string;

  @ApiPropertyOptional({ description: 'Candidate phone number' })
  candidatePhone?: string;

  @ApiPropertyOptional({ description: 'Candidate location' })
  candidateLocation?: string;

  @ApiPropertyOptional({ description: 'Years of experience' })
  yearsExperience?: number;

  @ApiPropertyOptional({ description: 'Current role' })
  currentRole?: string;

  @ApiPropertyOptional({ description: 'Desired role' })
  desiredRole?: string;

  @ApiPropertyOptional({ description: 'Salary expectation' })
  salaryExpectation?: string;

  @ApiPropertyOptional({ description: 'Availability' })
  availability?: string;

  @ApiProperty({ description: 'Tags', type: [String] })
  tags: string[];

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Resume summary' })
  summary?: string;

  @ApiProperty({ description: 'Skills', type: [String] })
  skills: string[];

  @ApiPropertyOptional({ description: 'Education' })
  education?: string;

  @ApiPropertyOptional({ description: 'Experience level' })
  experienceLevel?: string;

  @ApiPropertyOptional({ description: 'Overall assessment' })
  overallAssessment?: string;

  @ApiProperty({ description: 'Resume status', enum: ResumeStatus })
  status: ResumeStatus;

  @ApiPropertyOptional({ description: 'Last contact date' })
  lastContactDate?: Date;

  @ApiProperty({ description: 'Resume source', enum: ResumeSource })
  source: ResumeSource;

  @ApiPropertyOptional({ description: 'Associated job ID' })
  jobId?: string;

  @ApiPropertyOptional({ description: 'Associated application ID' })
  applicationId?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class ResumeBankStatsDto {
  @ApiProperty({ description: 'Total resumes' })
  totalResumes: number;

  @ApiProperty({ description: 'Active resumes' })
  activeResumes: number;

  @ApiProperty({ description: 'Shortlisted resumes' })
  shortlistedResumes: number;

  @ApiProperty({ description: 'Recent uploads' })
  recentUploads: number;

  @ApiProperty({ description: 'Top skills', type: [String] })
  topSkills: string[];

  @ApiProperty({ description: 'Experience distribution' })
  experienceDistribution: Record<string, number>;

  @ApiProperty({ description: 'Location distribution' })
  locationDistribution: Record<string, number>;
}

export class ResumeSearchFiltersDto {
  @ApiPropertyOptional({ description: 'Required skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ description: 'Experience level' })
  @IsString()
  @IsOptional()
  experienceLevel?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Minimum years of experience' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsExperienceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum years of experience' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsExperienceMax?: number;

  @ApiPropertyOptional({ description: 'Resume status', enum: ResumeStatus })
  @IsEnum(ResumeStatus)
  @IsOptional()
  status?: ResumeStatus;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class CompatibilityScoreDto {
  @ApiProperty({ description: 'Overall compatibility score' })
  overallScore: number;

  @ApiProperty({ description: 'Skills match score' })
  skillsMatch: number;

  @ApiProperty({ description: 'Experience match score' })
  experienceMatch: number;

  @ApiProperty({ description: 'Role match score' })
  roleMatch: number;

  @ApiProperty({ description: 'Location match score' })
  locationMatch: number;

  @ApiProperty({ description: 'Match confidence' })
  matchConfidence: number;
}

export class CandidateMatchDto {
  @ApiProperty({ description: 'Resume ID' })
  resumeId: string;

  @ApiProperty({ description: 'Candidate name' })
  candidateName: string;

  @ApiProperty({ description: 'Candidate email' })
  candidateEmail: string;

  @ApiProperty({ description: 'Compatibility score' })
  compatibilityScore: CompatibilityScoreDto;

  @ApiPropertyOptional({ description: 'Current role' })
  currentRole?: string;

  @ApiPropertyOptional({ description: 'Years of experience' })
  yearsExperience?: number;

  @ApiPropertyOptional({ description: 'Location' })
  location?: string;

  @ApiProperty({ description: 'Resume status' })
  status: ResumeStatus;

  @ApiProperty({ description: 'Match reasons', type: [String] })
  matchReasons: string[];
}

export class CandidateSearchResponseDto {
  @ApiProperty({ description: 'Matching candidates', type: [CandidateMatchDto] })
  candidates: CandidateMatchDto[];

  @ApiProperty({ description: 'Total number of candidates' })
  totalCandidates: number;

  @ApiProperty({ description: 'Search criteria' })
  searchCriteria: Record<string, any>;

  @ApiProperty({ description: 'Search time in seconds' })
  searchTime: number;

  @ApiPropertyOptional({ description: 'Pagination information' })
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    startIndex: number;
    endIndex: number;
  };
}
