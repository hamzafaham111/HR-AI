import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobApplication, JobApplicationDocument, ApplicationStatus } from './schemas/job-application.schema';
import { JobApplicationCreateDto, JobApplicationUpdateDto, JobApplicationResponseDto } from './dto/job-application.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class JobApplicationsService {
  constructor(
    @InjectModel(JobApplication.name) private jobApplicationModel: Model<JobApplicationDocument>,
  ) {}

  async createJobApplication(userId: string, createDto: JobApplicationCreateDto): Promise<JobApplicationResponseDto> {
    // Check if application already exists for this job and candidate
    const existingApplication = await this.jobApplicationModel.findOne({
      jobId: createDto.jobId,
      candidateId: createDto.candidateId,
      userId,
    });

    if (existingApplication) {
      throw new BadRequestException('Application already exists for this job and candidate');
    }

    const application = new this.jobApplicationModel({
      ...createDto,
      userId,
      appliedAt: new Date(),
    });

    const savedApplication = await application.save();
    return this.mapToResponse(savedApplication);
  }

  async getJobApplicationsByUser(userId: string, pagination: PaginationDto): Promise<JobApplicationResponseDto[]> {
    const applications = await this.jobApplicationModel
      .find({ userId })
      .skip(pagination.getSkip())
      .limit(pagination.limit)
      .sort({ appliedAt: -1 })
      .exec();

    return applications.map(application => this.mapToResponse(application));
  }

  async getJobApplicationById(applicationId: string, userId?: string): Promise<JobApplicationResponseDto> {
    const application = await this.jobApplicationModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Job application not found');
    }

    // If userId is provided, check if user owns this application
    if (userId && application.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only view your own job applications');
    }

    return this.mapToResponse(application);
  }

  async updateJobApplication(applicationId: string, updateDto: JobApplicationUpdateDto, userId: string): Promise<JobApplicationResponseDto> {
    const application = await this.jobApplicationModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Job application not found');
    }

    // Check if user owns this application
    if (application.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only update your own job applications');
    }

    // Update status-specific timestamps
    const updateData = { ...updateDto };
    if (updateDto.status) {
      const now = new Date();
      switch (updateDto.status) {
        case ApplicationStatus.REVIEWED:
          updateData['reviewedAt'] = now;
          break;
        case ApplicationStatus.SHORTLISTED:
          updateData['shortlistedAt'] = now;
          break;
        case ApplicationStatus.INTERVIEWED:
          updateData['interviewedAt'] = now;
          break;
        case ApplicationStatus.REJECTED:
          updateData['rejectedAt'] = now;
          break;
        case ApplicationStatus.HIRED:
          updateData['hiredAt'] = now;
          break;
        case ApplicationStatus.WITHDRAWN:
          updateData['withdrawnAt'] = now;
          break;
      }
    }

    const updatedApplication = await this.jobApplicationModel
      .findByIdAndUpdate(applicationId, updateData, { new: true })
      .exec();

    return this.mapToResponse(updatedApplication);
  }

  async deleteJobApplication(applicationId: string, userId: string): Promise<{ message: string }> {
    const application = await this.jobApplicationModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Job application not found');
    }

    // Check if user owns this application
    if (application.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only delete your own job applications');
    }

    await this.jobApplicationModel.findByIdAndDelete(applicationId).exec();
    return { message: 'Job application deleted successfully' };
  }

  async getJobApplicationsByJob(jobId: string, userId: string): Promise<JobApplicationResponseDto[]> {
    const applications = await this.jobApplicationModel
      .find({ jobId, userId })
      .sort({ appliedAt: -1 })
      .exec();

    return applications.map(application => this.mapToResponse(application));
  }

  async getJobApplicationsByCandidate(candidateId: string, userId: string): Promise<JobApplicationResponseDto[]> {
    const applications = await this.jobApplicationModel
      .find({ candidateId, userId })
      .sort({ appliedAt: -1 })
      .exec();

    return applications.map(application => this.mapToResponse(application));
  }

  async getJobApplicationsByStatus(status: ApplicationStatus, userId: string): Promise<JobApplicationResponseDto[]> {
    const applications = await this.jobApplicationModel
      .find({ status, userId })
      .sort({ appliedAt: -1 })
      .exec();

    return applications.map(application => this.mapToResponse(application));
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus, userId: string, rejectionReason?: string): Promise<JobApplicationResponseDto> {
    const application = await this.jobApplicationModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Job application not found');
    }

    // Check if user owns this application
    if (application.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only update your own job applications');
    }

    const updateData: any = { status };
    const now = new Date();

    switch (status) {
      case ApplicationStatus.REVIEWED:
        updateData.reviewedAt = now;
        break;
      case ApplicationStatus.SHORTLISTED:
        updateData.shortlistedAt = now;
        break;
      case ApplicationStatus.INTERVIEWED:
        updateData.interviewedAt = now;
        break;
      case ApplicationStatus.REJECTED:
        updateData.rejectedAt = now;
        if (rejectionReason) {
          updateData.rejectionReason = rejectionReason;
        }
        break;
      case ApplicationStatus.HIRED:
        updateData.hiredAt = now;
        break;
      case ApplicationStatus.WITHDRAWN:
        updateData.withdrawnAt = now;
        break;
    }

    const updatedApplication = await this.jobApplicationModel
      .findByIdAndUpdate(applicationId, updateData, { new: true })
      .exec();

    return this.mapToResponse(updatedApplication);
  }

  async getApplicationStats(userId: string): Promise<Record<string, number>> {
    const stats = await this.jobApplicationModel.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result: Record<string, number> = {};
    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    return result;
  }

  private mapToResponse(application: JobApplicationDocument): JobApplicationResponseDto {
    return {
      id: application._id.toString(),
      jobId: application.jobId.toString(),
      candidateId: application.candidateId.toString(),
      resumeId: application.resumeId?.toString(),
      status: application.status,
      source: application.source,
      coverLetter: application.coverLetter,
      expectedSalary: application.expectedSalary,
      availability: application.availability,
      notes: application.notes,
      applicationData: application.applicationData,
      screeningResults: application.screeningResults,
      interviewFeedback: application.interviewFeedback,
      appliedAt: application.appliedAt,
      reviewedAt: application.reviewedAt,
      shortlistedAt: application.shortlistedAt,
      interviewedAt: application.interviewedAt,
      rejectedAt: application.rejectedAt,
      hiredAt: application.hiredAt,
      withdrawnAt: application.withdrawnAt,
      rejectionReason: application.rejectionReason,
      interviewerIds: application.interviewerIds.map(id => id.toString()),
      meetingIds: application.meetingIds.map(id => id.toString()),
      score: application.score,
      aiAnalysis: application.aiAnalysis,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }
}
