import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meeting.schema';
import { MeetingCreateDto, MeetingUpdateDto, MeetingResponseDto } from './dto/meeting.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
  ) {}

  async createMeeting(userId: string, createDto: MeetingCreateDto): Promise<MeetingResponseDto> {
    const meeting = new this.meetingModel({
      ...createDto,
      userId,
    });

    const savedMeeting = await meeting.save();
    return this.mapToResponse(savedMeeting);
  }

  async getMeetingsByUser(userId: string, pagination: PaginationDto): Promise<MeetingResponseDto[]> {
    const meetings = await this.meetingModel
      .find({ userId })
      .skip(pagination.getSkip())
      .limit(pagination.limit)
      .sort({ scheduledAt: 1 })
      .exec();

    return meetings.map(meeting => this.mapToResponse(meeting));
  }

  async getMeetingById(meetingId: string, userId?: string): Promise<MeetingResponseDto> {
    const meeting = await this.meetingModel.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // If userId is provided, check if user owns this meeting
    if (userId && meeting.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only view your own meetings');
    }

    return this.mapToResponse(meeting);
  }

  async updateMeeting(meetingId: string, updateDto: MeetingUpdateDto, userId: string): Promise<MeetingResponseDto> {
    const meeting = await this.meetingModel.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Check if user owns this meeting
    if (meeting.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only update your own meetings');
    }

    const updatedMeeting = await this.meetingModel
      .findByIdAndUpdate(meetingId, updateDto, { new: true })
      .exec();

    return this.mapToResponse(updatedMeeting);
  }

  async deleteMeeting(meetingId: string, userId: string): Promise<{ message: string }> {
    const meeting = await this.meetingModel.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Check if user owns this meeting
    if (meeting.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only delete your own meetings');
    }

    await this.meetingModel.findByIdAndDelete(meetingId).exec();
    return { message: 'Meeting deleted successfully' };
  }

  async getMeetingsByCandidate(candidateId: string, userId: string): Promise<MeetingResponseDto[]> {
    const meetings = await this.meetingModel
      .find({ candidateId, userId })
      .sort({ scheduledAt: 1 })
      .exec();

    return meetings.map(meeting => this.mapToResponse(meeting));
  }

  async getMeetingsByJob(jobId: string, userId: string): Promise<MeetingResponseDto[]> {
    const meetings = await this.meetingModel
      .find({ jobId, userId })
      .sort({ scheduledAt: 1 })
      .exec();

    return meetings.map(meeting => this.mapToResponse(meeting));
  }

  async getUpcomingMeetings(userId: string, days: number = 7): Promise<MeetingResponseDto[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const meetings = await this.meetingModel
      .find({
        userId,
        scheduledAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['scheduled', 'in_progress'] },
      })
      .sort({ scheduledAt: 1 })
      .exec();

    return meetings.map(meeting => this.mapToResponse(meeting));
  }

  async updateMeetingStatus(meetingId: string, status: string, userId: string): Promise<MeetingResponseDto> {
    const meeting = await this.meetingModel.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Check if user owns this meeting
    if (meeting.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only update your own meetings');
    }

    const updatedMeeting = await this.meetingModel
      .findByIdAndUpdate(meetingId, { status }, { new: true })
      .exec();

    return this.mapToResponse(updatedMeeting);
  }

  private mapToResponse(meeting: MeetingDocument): MeetingResponseDto {
    return {
      id: meeting._id.toString(),
      candidateId: meeting.candidateId.toString(),
      jobId: meeting.jobId?.toString(),
      hiringProcessId: meeting.hiringProcessId?.toString(),
      title: meeting.title,
      description: meeting.description,
      type: meeting.type,
      status: meeting.status,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      location: meeting.location,
      meetingLink: meeting.meetingLink,
      interviewerIds: meeting.interviewerIds.map(id => id.toString()),
      attendees: meeting.attendees,
      notes: meeting.notes,
      outcome: meeting.outcome,
      feedback: meeting.feedback,
      reminderSent: meeting.reminderSent,
      reminderSentAt: meeting.reminderSentAt,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };
  }
}
