import { IsString, IsArray, IsBoolean, IsNumber, IsOptional, IsObject, ValidateNested, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FormFieldDto {
  @ApiProperty({ description: 'Field ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Field name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Field label' })
  @IsString()
  label: string;

  @ApiProperty({ 
    description: 'Field type',
    enum: ['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date', 'number']
  })
  @IsEnum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date', 'number'])
  type: string;

  @ApiProperty({ description: 'Is field required' })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ description: 'Field placeholder' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Field options for select/radio/checkbox' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Field validation rules' })
  @IsOptional()
  @IsObject()
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export class CreateJobApplicationFormDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  jobId: string;

  @ApiProperty({ description: 'Form title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Form description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Form fields', type: [FormFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];

  @ApiPropertyOptional({ description: 'Requires resume upload', default: true })
  @IsOptional()
  @IsBoolean()
  requiresResume?: boolean;

  @ApiPropertyOptional({ description: 'Allow multiple file uploads', default: false })
  @IsOptional()
  @IsBoolean()
  allowMultipleFiles?: boolean;

  @ApiPropertyOptional({ description: 'Maximum file size in MB', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxFileSizeMb?: number;

  @ApiPropertyOptional({ description: 'Allowed file types', default: ['pdf', 'doc', 'docx'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @ApiPropertyOptional({ description: 'Form expiration date' })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Form settings' })
  @IsOptional()
  @IsObject()
  settings?: {
    allowAnonymousSubmissions?: boolean;
    requireEmailVerification?: boolean;
    autoRespond?: boolean;
    responseMessage?: string;
    redirectUrl?: string;
  };
}

export class UpdateJobApplicationFormDto {
  @ApiPropertyOptional({ description: 'Form title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Form description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Form fields', type: [FormFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields?: FormFieldDto[];

  @ApiPropertyOptional({ description: 'Requires resume upload' })
  @IsOptional()
  @IsBoolean()
  requiresResume?: boolean;

  @ApiPropertyOptional({ description: 'Allow multiple file uploads' })
  @IsOptional()
  @IsBoolean()
  allowMultipleFiles?: boolean;

  @ApiPropertyOptional({ description: 'Maximum file size in MB' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxFileSizeMb?: number;

  @ApiPropertyOptional({ description: 'Allowed file types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @ApiPropertyOptional({ description: 'Is form active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is form public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Form expiration date' })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Form settings' })
  @IsOptional()
  @IsObject()
  settings?: {
    allowAnonymousSubmissions?: boolean;
    requireEmailVerification?: boolean;
    autoRespond?: boolean;
    responseMessage?: string;
    redirectUrl?: string;
  };
}

export class JobApplicationFormResponseDto {
  @ApiProperty({ description: 'Form ID' })
  id: string;

  @ApiProperty({ description: 'Job ID' })
  jobId: string;

  @ApiProperty({ description: 'Form title' })
  title: string;

  @ApiProperty({ description: 'Form description' })
  description: string;

  @ApiProperty({ description: 'Form fields', type: [FormFieldDto] })
  fields: FormFieldDto[];

  @ApiProperty({ description: 'Requires resume upload' })
  requiresResume: boolean;

  @ApiProperty({ description: 'Allow multiple file uploads' })
  allowMultipleFiles: boolean;

  @ApiProperty({ description: 'Maximum file size in MB' })
  maxFileSizeMb: number;

  @ApiProperty({ description: 'Allowed file types' })
  allowedFileTypes: string[];

  @ApiProperty({ description: 'Is form active' })
  isActive: boolean;

  @ApiProperty({ description: 'Is form public' })
  isPublic: boolean;

  @ApiPropertyOptional({ description: 'Form expiration date' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Number of submissions' })
  submissionCount: number;

  @ApiProperty({ description: 'Form settings' })
  settings: {
    allowAnonymousSubmissions?: boolean;
    requireEmailVerification?: boolean;
    autoRespond?: boolean;
    responseMessage?: string;
    redirectUrl?: string;
  };

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

