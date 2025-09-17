import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { HiringProcessesService } from './hiring-processes.service';
import { HiringProcessCreateDto, HiringProcessUpdateDto, HiringProcessResponseDto } from './dto/hiring-process.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Hiring Processes')
@Controller('hiring-processes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HiringProcessesController {
  constructor(private readonly hiringProcessesService: HiringProcessesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all hiring processes for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Hiring processes retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHiringProcesses(@Request() req, @Query() pagination: PaginationDto): Promise<ApiResponseDto<HiringProcessResponseDto[]>> {
    const processes = await this.hiringProcessesService.getHiringProcessesByUser(req.user.id, pagination);
    return new ApiResponseDto(true, 'Hiring processes retrieved successfully', processes);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new hiring process' })
  @ApiResponse({ status: 201, description: 'Hiring process created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createHiringProcess(@Request() req, @Body() createDto: HiringProcessCreateDto): Promise<ApiResponseDto<HiringProcessResponseDto>> {
    const process = await this.hiringProcessesService.createHiringProcess(req.user.id, createDto);
    return new ApiResponseDto(true, 'Hiring process created successfully', process);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific hiring process by ID' })
  @ApiResponse({ status: 200, description: 'Hiring process retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Hiring process not found' })
  async getHiringProcess(@Param('id') id: string, @Request() req): Promise<ApiResponseDto<HiringProcessResponseDto>> {
    const process = await this.hiringProcessesService.getHiringProcessById(id, req.user.id);
    return new ApiResponseDto(true, 'Hiring process retrieved successfully', process);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a hiring process by ID' })
  @ApiResponse({ status: 200, description: 'Hiring process updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Hiring process not found' })
  async updateHiringProcess(@Param('id') id: string, @Body() updateDto: HiringProcessUpdateDto, @Request() req): Promise<ApiResponseDto<HiringProcessResponseDto>> {
    const process = await this.hiringProcessesService.updateHiringProcess(id, updateDto, req.user.id);
    return new ApiResponseDto(true, 'Hiring process updated successfully', process);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hiring process by ID' })
  @ApiResponse({ status: 200, description: 'Hiring process deleted successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Hiring process not found' })
  async deleteHiringProcess(@Param('id') id: string, @Request() req): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.hiringProcessesService.deleteHiringProcess(id, req.user.id);
    return new ApiResponseDto(true, 'Hiring process deleted successfully', result);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get hiring processes for a specific job' })
  @ApiResponse({ status: 200, description: 'Hiring processes retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHiringProcessesByJob(@Param('jobId') jobId: string, @Request() req): Promise<ApiResponseDto<HiringProcessResponseDto[]>> {
    const processes = await this.hiringProcessesService.getHiringProcessesByJob(jobId, req.user.id);
    return new ApiResponseDto(true, 'Hiring processes retrieved successfully', processes);
  }

  @Put(':id/stage')
  @ApiOperation({ summary: 'Update hiring process stage' })
  @ApiResponse({ status: 200, description: 'Hiring stage updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Hiring process not found' })
  async updateHiringStage(@Param('id') id: string, @Body() body: { stage: string }, @Request() req): Promise<ApiResponseDto<HiringProcessResponseDto>> {
    const process = await this.hiringProcessesService.updateHiringStage(id, body.stage, req.user.id);
    return new ApiResponseDto(true, 'Hiring stage updated successfully', process);
  }
}