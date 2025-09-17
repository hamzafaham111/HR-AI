import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { MeetingsService } from './meetings.service';
import { MeetingCreateDto, MeetingUpdateDto, MeetingResponseDto } from './dto/meeting.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Meetings')
@Controller('meetings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all meetings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMeetings(@Request() req, @Query() pagination: PaginationDto): Promise<ApiResponseDto<MeetingResponseDto[]>> {
    const meetings = await this.meetingsService.getMeetingsByUser(req.user.id, pagination);
    return new ApiResponseDto(true, 'Meetings retrieved successfully', meetings);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMeeting(@Request() req, @Body() createDto: MeetingCreateDto): Promise<ApiResponseDto<MeetingResponseDto>> {
    const meeting = await this.meetingsService.createMeeting(req.user.id, createDto);
    return new ApiResponseDto(true, 'Meeting created successfully', meeting);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific meeting by ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getMeeting(@Param('id') id: string, @Request() req): Promise<ApiResponseDto<MeetingResponseDto>> {
    const meeting = await this.meetingsService.getMeetingById(id, req.user.id);
    return new ApiResponseDto(true, 'Meeting retrieved successfully', meeting);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a meeting by ID' })
  @ApiResponse({ status: 200, description: 'Meeting updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async updateMeeting(@Param('id') id: string, @Body() updateDto: MeetingUpdateDto, @Request() req): Promise<ApiResponseDto<MeetingResponseDto>> {
    const meeting = await this.meetingsService.updateMeeting(id, updateDto, req.user.id);
    return new ApiResponseDto(true, 'Meeting updated successfully', meeting);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a meeting by ID' })
  @ApiResponse({ status: 200, description: 'Meeting deleted successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async deleteMeeting(@Param('id') id: string, @Request() req): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.meetingsService.deleteMeeting(id, req.user.id);
    return new ApiResponseDto(true, 'Meeting deleted successfully', result);
  }

  @Get('candidate/:candidateId')
  @ApiOperation({ summary: 'Get meetings for a specific candidate' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMeetingsByCandidate(@Param('candidateId') candidateId: string, @Request() req): Promise<ApiResponseDto<MeetingResponseDto[]>> {
    const meetings = await this.meetingsService.getMeetingsByCandidate(candidateId, req.user.id);
    return new ApiResponseDto(true, 'Meetings retrieved successfully', meetings);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get meetings for a specific job' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMeetingsByJob(@Param('jobId') jobId: string, @Request() req): Promise<ApiResponseDto<MeetingResponseDto[]>> {
    const meetings = await this.meetingsService.getMeetingsByJob(jobId, req.user.id);
    return new ApiResponseDto(true, 'Meetings retrieved successfully', meetings);
  }

  @Get('upcoming/:days?')
  @ApiOperation({ summary: 'Get upcoming meetings' })
  @ApiResponse({ status: 200, description: 'Upcoming meetings retrieved successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUpcomingMeetings(@Param('days') days: string, @Request() req): Promise<ApiResponseDto<MeetingResponseDto[]>> {
    const daysNumber = days ? parseInt(days, 10) : 7;
    const meetings = await this.meetingsService.getUpcomingMeetings(req.user.id, daysNumber);
    return new ApiResponseDto(true, 'Upcoming meetings retrieved successfully', meetings);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update meeting status' })
  @ApiResponse({ status: 200, description: 'Meeting status updated successfully', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async updateMeetingStatus(@Param('id') id: string, @Body() body: { status: string }, @Request() req): Promise<ApiResponseDto<MeetingResponseDto>> {
    const meeting = await this.meetingsService.updateMeetingStatus(id, body.status, req.user.id);
    return new ApiResponseDto(true, 'Meeting status updated successfully', meeting);
  }
}