import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JobCreateDto, JobUpdateDto, JobResponseDto, ParseTextDto, ParseTextResponseDto } from './dto/job.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto, PaginatedResponseDto } from '../../common/dto/response.dto';

@ApiTags('Job Management')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('parse-text')
  @ApiOperation({ summary: 'Parse job posting text using AI' })
  @ApiResponse({ status: 200, description: 'Job text parsed successfully', type: ParseTextResponseDto })
  async parseJobText(@Body() parseData: ParseTextDto): Promise<ApiResponseDto<ParseTextResponseDto>> {
    const result = await this.jobsService.parseJobText(parseData);
    return new ApiResponseDto(true, 'Job text parsed successfully', result);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job posting created successfully', type: JobResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createJob(@Request() req, @Body() jobData: JobCreateDto): Promise<ApiResponseDto<JobResponseDto>> {
    const job = await this.jobsService.createJob(req.user._id.toString(), jobData);
    return new ApiResponseDto(true, 'Job posting created successfully', job);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all job postings for the current user' })
  @ApiResponse({ status: 200, description: 'Job postings retrieved successfully', type: [JobResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobs(@Request() req, @Query() pagination: PaginationDto): Promise<ApiResponseDto<JobResponseDto[]>> {
    const jobs = await this.jobsService.getJobsByUser(req.user._id.toString(), pagination);
    return new ApiResponseDto(true, 'Job postings retrieved successfully', jobs);
  }

  @Get('public/forms/:jobId')
  @ApiOperation({ summary: 'Get job application form for public access' })
  @ApiResponse({ status: 200, description: 'Job application form retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job posting or form not found' })
  async getPublicJobForm(@Param('jobId') jobId: string): Promise<ApiResponseDto<any>> {
    const form = await this.jobsService.getPublicJobForm(jobId);
    return new ApiResponseDto(true, 'Job application form retrieved successfully', form);
  }

  @Get('public/:jobId')
  @ApiOperation({ summary: 'Get a specific job posting for public access' })
  @ApiResponse({ status: 200, description: 'Job posting retrieved successfully', type: JobResponseDto })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async getPublicJob(@Param('jobId') jobId: string): Promise<ApiResponseDto<JobResponseDto>> {
    const job = await this.jobsService.getPublicJobById(jobId);
    return new ApiResponseDto(true, 'Job posting retrieved successfully', job);
  }

  

  @Get(':jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific job posting' })
  @ApiResponse({ status: 200, description: 'Job posting retrieved successfully', type: JobResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async getJob(@Request() req, @Param('jobId') jobId: string): Promise<ApiResponseDto<JobResponseDto>> {
    const job = await this.jobsService.getJobById(jobId, req.user._id.toString());
    return new ApiResponseDto(true, 'Job posting retrieved successfully', job);
  }

  @Put(':jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a job posting' })
  @ApiResponse({ status: 200, description: 'Job posting updated successfully', type: JobResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async updateJob(
    @Request() req,
    @Param('jobId') jobId: string,
    @Body() updateData: JobUpdateDto
  ): Promise<ApiResponseDto<JobResponseDto>> {
    const job = await this.jobsService.updateJob(jobId, req.user._id.toString(), updateData);
    return new ApiResponseDto(true, 'Job posting updated successfully', job);
  }

  @Delete(':jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a job posting' })
  @ApiResponse({ status: 200, description: 'Job posting deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async deleteJob(@Request() req, @Param('jobId') jobId: string): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.jobsService.deleteJob(jobId, req.user._id.toString());
    return new ApiResponseDto(true, result.message, result);
  }

  @Get(':jobId/candidates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for candidates that match a specific job' })
  @ApiResponse({ status: 200, description: 'Candidates retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of candidates per page' })
  @ApiQuery({ name: 'minScore', required: false, type: Number, description: 'Minimum compatibility score' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order' })
  async searchCandidatesForJob(
    @Param('jobId') jobId: string,
    @Query() pagination: PaginationDto,
    @Query('minScore') minScore?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.jobsService.searchCandidatesForJob(jobId, pagination, {
      minScore,
      sortBy,
      sortOrder,
    });
    return new ApiResponseDto(true, 'Candidates retrieved successfully', result);
  }
}
