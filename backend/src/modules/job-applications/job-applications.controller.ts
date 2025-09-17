import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { JobApplicationsService } from './job-applications.service';
// import { JobApplicationFormsService } from './job-application-forms.service';
import { JobApplicationCreateDto, JobApplicationUpdateDto, JobApplicationResponseDto } from './dto/job-application.dto';
// import { CreateJobApplicationFormDto, UpdateJobApplicationFormDto, JobApplicationFormResponseDto } from './dto/job-application-form.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApplicationStatus } from './schemas/job-application.schema';

@ApiTags('Job Applications')
@Controller('job-applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
    // private readonly jobApplicationFormsService: JobApplicationFormsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all job applications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Job applications retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobApplications(@Request() req, @Query() pagination: PaginationDto): Promise<ApiResponseDto<JobApplicationResponseDto[]>> {
    const applications = await this.jobApplicationsService.getJobApplicationsByUser(req.user.id, pagination);
    return new ApiResponseDto(true, 'Job applications retrieved successfully', applications);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new job application' })
  @ApiResponse({ status: 201, description: 'Job application created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createJobApplication(@Request() req, @Body() createDto: JobApplicationCreateDto): Promise<ApiResponseDto<JobApplicationResponseDto>> {
    const application = await this.jobApplicationsService.createJobApplication(req.user.id, createDto);
    return new ApiResponseDto(true, 'Job application created successfully', application);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific job application by ID' })
  @ApiResponse({ status: 200, description: 'Job application retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job application not found' })
  async getJobApplication(@Param('id') id: string, @Request() req): Promise<ApiResponseDto<JobApplicationResponseDto>> {
    console.log('getJobApplication =======>>>>>>', id, req.user.id);
    const application = await this.jobApplicationsService.getJobApplicationById(id, req.user.id);
    return new ApiResponseDto(true, 'Job application retrieved successfully', application);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a job application by ID' })
  @ApiResponse({ status: 200, description: 'Job application updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job application not found' })
  async updateJobApplication(@Param('id') id: string, @Body() updateDto: JobApplicationUpdateDto, @Request() req): Promise<ApiResponseDto<JobApplicationResponseDto>> {
    const application = await this.jobApplicationsService.updateJobApplication(id, updateDto, req.user.id);
    return new ApiResponseDto(true, 'Job application updated successfully', application);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job application by ID' })
  @ApiResponse({ status: 200, description: 'Job application deleted successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job application not found' })
  async deleteJobApplication(@Param('id') id: string, @Request() req): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.jobApplicationsService.deleteJobApplication(id, req.user.id);
    return new ApiResponseDto(true, 'Job application deleted successfully', result);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get job applications for a specific job' })
  @ApiResponse({ status: 200, description: 'Job applications retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobApplicationsByJob(@Param('jobId') jobId: string, @Request() req): Promise<ApiResponseDto<JobApplicationResponseDto[]>> {
    const applications = await this.jobApplicationsService.getJobApplicationsByJob(jobId, req.user.id);
    return new ApiResponseDto(true, 'Job applications retrieved successfully', applications);
  }

  @Get('candidate/:candidateId')
  @ApiOperation({ summary: 'Get job applications for a specific candidate' })
  @ApiResponse({ status: 200, description: 'Job applications retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobApplicationsByCandidate(@Param('candidateId') candidateId: string, @Request() req): Promise<ApiResponseDto<JobApplicationResponseDto[]>> {
    const applications = await this.jobApplicationsService.getJobApplicationsByCandidate(candidateId, req.user.id);
    return new ApiResponseDto(true, 'Job applications retrieved successfully', applications);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get job applications by status' })
  @ApiResponse({ status: 200, description: 'Job applications retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobApplicationsByStatus(@Param('status') status: ApplicationStatus, @Request() req): Promise<ApiResponseDto<JobApplicationResponseDto[]>> {
    const applications = await this.jobApplicationsService.getJobApplicationsByStatus(status, req.user.id);
    return new ApiResponseDto(true, 'Job applications retrieved successfully', applications);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update job application status' })
  @ApiResponse({ status: 200, description: 'Job application status updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job application not found' })
  async updateApplicationStatus(@Param('id') id: string, @Body() body: { status: ApplicationStatus; rejectionReason?: string }, @Request() req): Promise<ApiResponseDto<JobApplicationResponseDto>> {
    const application = await this.jobApplicationsService.updateApplicationStatus(id, body.status, req.user.id, body.rejectionReason);
    return new ApiResponseDto(true, 'Job application status updated successfully', application);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get job application statistics' })
  @ApiResponse({ status: 200, description: 'Job application statistics retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getApplicationStats(@Request() req): Promise<ApiResponseDto<Record<string, number>>> {
    const stats = await this.jobApplicationsService.getApplicationStats(req.user.id);
    return new ApiResponseDto(true, 'Job application statistics retrieved successfully', stats);
  }

  // Mock Job Application Forms endpoints - Simple implementation for now
  @Post('forms')
  @ApiOperation({ summary: 'Create a new job application form (Mock)' })
  @ApiResponse({ status: 201, description: 'Job application form created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createForm(@Request() req, @Body() createDto: any): Promise<ApiResponseDto<any>> {
    // Mock response for now
    const mockForm = {
      id: 'mock-form-id',
      jobId: createDto.jobId,
      title: createDto.title,
      description: createDto.description,
      fields: createDto.fields || [],
      requiresResume: createDto.requires_resume || true,
      allowMultipleFiles: createDto.allow_multiple_files || false,
      maxFileSizeMb: createDto.max_file_size_mb || 10,
      allowedFileTypes: createDto.allowed_file_types || ['pdf', 'doc', 'docx'],
      isActive: true,
      isPublic: false,
      submissionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return new ApiResponseDto(true, 'Job application form created successfully (mock)', mockForm);
  }

  @Get('forms/:id')
  @ApiOperation({ summary: 'Get a specific job application form by ID (Mock)' })
  @ApiResponse({ status: 200, description: 'Job application form retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async getForm(@Param('id') id: string, @Request() req): Promise<ApiResponseDto<any>> {
    // Mock response for now
    const mockForm = {
      id: id,
      jobId: 'mock-job-id',
      title: 'Mock Application Form',
      description: 'This is a mock form for testing',
      fields: [
        {
          id: 1,
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name'
        }
      ],
      requiresResume: true,
      allowMultipleFiles: false,
      maxFileSizeMb: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      isActive: true,
      isPublic: false,
      submissionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return new ApiResponseDto(true, 'Job application form retrieved successfully (mock)', mockForm);
  }

  @Put('forms/:id')
  @ApiOperation({ summary: 'Update a job application form by ID (Mock)' })
  @ApiResponse({ status: 200, description: 'Job application form updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async updateForm(@Param('id') id: string, @Body() updateDto: any, @Request() req): Promise<ApiResponseDto<any>> {
    // Mock response for now
    const mockForm = {
      id: id,
      jobId: 'mock-job-id',
      title: updateDto.title || 'Updated Mock Form',
      description: updateDto.description || 'This is an updated mock form',
      fields: updateDto.fields || [],
      requiresResume: updateDto.requires_resume !== undefined ? updateDto.requires_resume : true,
      allowMultipleFiles: updateDto.allow_multiple_files || false,
      maxFileSizeMb: updateDto.max_file_size_mb || 10,
      allowedFileTypes: updateDto.allowed_file_types || ['pdf', 'doc', 'docx'],
      isActive: true,
      isPublic: false,
      submissionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return new ApiResponseDto(true, 'Job application form updated successfully (mock)', mockForm);
  }
}