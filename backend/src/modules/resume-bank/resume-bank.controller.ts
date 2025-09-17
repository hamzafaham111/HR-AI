import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResumeBankService } from './resume-bank.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResumeBankCreateDto, ResumeBankUpdateDto, ResumeBankResponseDto, ResumeBankStatsDto, ResumeSearchFiltersDto, CandidateSearchResponseDto } from './dto/resume-bank.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto, PaginatedResponseDto } from '../../common/dto/response.dto';

@ApiTags('Resume Bank')
@Controller('resume-bank')
export class ResumeBankController {
  constructor(private readonly resumeBankService: ResumeBankService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a resume to the resume bank' })
  @ApiResponse({ status: 201, description: 'Resume uploaded successfully', type: ResumeBankResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  async uploadResume(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() resumeData: ResumeBankCreateDto,
  ): Promise<ApiResponseDto<ResumeBankResponseDto>> {
    // TODO: Implement file processing and AI extraction
    const resume = await this.resumeBankService.createResume(req.user._id.toString(), {
      ...resumeData,
      filename: file?.originalname || 'resume.pdf',
    });

    return new ApiResponseDto(true, 'Resume uploaded successfully', resume);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resumes from the bank with optional filtering' })
  @ApiResponse({ status: 200, description: 'Resumes retrieved successfully', type: [ResumeBankResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getResumes(
    @Request() req,
    @Query() pagination: PaginationDto,
    @Query() filters: ResumeSearchFiltersDto,
  ): Promise<ApiResponseDto<ResumeBankResponseDto[]>> {
    const resumes = await this.resumeBankService.getResumesByUser(
      req.user._id.toString(),
      pagination,
      filters,
    );

    return new ApiResponseDto(true, 'Resumes retrieved successfully', resumes);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resume bank statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: ResumeBankStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getResumeStats(@Request() req): Promise<ApiResponseDto<ResumeBankStatsDto>> {
    const stats = await this.resumeBankService.getResumeStats(req.user._id.toString());
    return new ApiResponseDto(true, 'Statistics retrieved successfully', stats);
  }

  @Get('search-candidates/:jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find the best candidates for a specific job posting' })
  @ApiResponse({ status: 200, description: 'Candidates found successfully', type: CandidateSearchResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  async searchCandidatesForJob(
    @Request() req,
    @Param('jobId') jobId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: ResumeSearchFiltersDto,
  ): Promise<ApiResponseDto<CandidateSearchResponseDto>> {
    const result = await this.resumeBankService.searchCandidatesForJob(
      jobId,
      req.user._id.toString(),
      pagination,
      filters,
    );

    return new ApiResponseDto(true, 'Candidates found successfully', result);
  }

  @Get(':resumeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific resume from the bank' })
  @ApiResponse({ status: 200, description: 'Resume retrieved successfully', type: ResumeBankResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async getResume(@Param('resumeId') resumeId: string): Promise<ApiResponseDto<ResumeBankResponseDto>> {
    const resume = await this.resumeBankService.getResumeById(resumeId);
    return new ApiResponseDto(true, 'Resume retrieved successfully', resume);
  }

  @Put(':resumeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a resume in the bank' })
  @ApiResponse({ status: 200, description: 'Resume updated successfully', type: ResumeBankResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async updateResume(
    @Param('resumeId') resumeId: string,
    @Body() updateData: ResumeBankUpdateDto,
  ): Promise<ApiResponseDto<ResumeBankResponseDto>> {
    const resume = await this.resumeBankService.updateResume(resumeId, updateData);
    return new ApiResponseDto(true, 'Resume updated successfully', resume);
  }

  @Delete(':resumeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a resume from the bank' })
  @ApiResponse({ status: 200, description: 'Resume deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async deleteResume(@Param('resumeId') resumeId: string): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.resumeBankService.deleteResume(resumeId);
    return new ApiResponseDto(true, result.message, result);
  }
}
