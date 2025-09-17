import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResumeBank, ResumeBankDocument, ResumeStatus, ResumeSource } from './schemas/resume-bank.schema';
import { ResumeBankCreateDto, ResumeBankUpdateDto, ResumeBankResponseDto, ResumeBankStatsDto, ResumeSearchFiltersDto, CandidateSearchResponseDto } from './dto/resume-bank.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ResumeBankService {
  constructor(
    @InjectModel(ResumeBank.name) private resumeBankModel: Model<ResumeBankDocument>,
  ) {}

  async createResume(userId: string, resumeData: ResumeBankCreateDto): Promise<ResumeBankResponseDto> {
    const resume = new this.resumeBankModel({
      ...resumeData,
      userId,
    });

    const savedResume = await resume.save();
    return this.mapToResumeResponse(savedResume);
  }

  async getResumesByUser(
    userId: string,
    pagination: PaginationDto,
    filters: ResumeSearchFiltersDto = {}
  ): Promise<ResumeBankResponseDto[]> {
    const query: any = { userId };

    // Apply filters
    if (filters.skills && filters.skills.length > 0) {
      query.tags = { $in: filters.skills };
    }

    if (filters.location) {
      query.candidateLocation = { $regex: filters.location, $options: 'i' };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.yearsExperienceMin !== undefined) {
      query.yearsExperience = { $gte: filters.yearsExperienceMin };
    }

    if (filters.yearsExperienceMax !== undefined) {
      query.yearsExperience = { ...query.yearsExperience, $lte: filters.yearsExperienceMax };
    }

    const resumes = await this.resumeBankModel
      .find(query)
      .skip(pagination.getSkip())
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    return resumes.map(resume => this.mapToResumeResponse(resume));
  }

  async getResumeById(resumeId: string): Promise<ResumeBankResponseDto> {
    const resume = await this.resumeBankModel.findById(resumeId);
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return this.mapToResumeResponse(resume);
  }

  async updateResume(resumeId: string, updateData: ResumeBankUpdateDto): Promise<ResumeBankResponseDto> {
    const resume = await this.resumeBankModel.findByIdAndUpdate(
      resumeId,
      updateData,
      { new: true }
    );

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return this.mapToResumeResponse(resume);
  }

  async deleteResume(resumeId: string): Promise<{ message: string }> {
    const resume = await this.resumeBankModel.findByIdAndDelete(resumeId);
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return { message: 'Resume deleted successfully' };
  }

  async getResumeStats(userId: string): Promise<ResumeBankStatsDto> {
    const totalResumes = await this.resumeBankModel.countDocuments({ userId });
    const activeResumes = await this.resumeBankModel.countDocuments({ userId, status: ResumeStatus.ACTIVE });
    const shortlistedResumes = await this.resumeBankModel.countDocuments({ userId, status: ResumeStatus.SHORTLISTED });

    // Get recent uploads (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUploads = await this.resumeBankModel.countDocuments({
      userId,
      createdAt: { $gte: weekAgo }
    });

    // Get top skills
    const skillsAggregation = await this.resumeBankModel.aggregate([
      { $match: { userId: userId } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topSkills = skillsAggregation.map(skill => skill._id);

    // Get experience distribution
    const experienceDistribution = await this.resumeBankModel.aggregate([
      { $match: { userId: userId } },
      {
        $bucket: {
          groupBy: '$yearsExperience',
          boundaries: [0, 2, 5, 10, 20],
          default: '20+',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    const expDist: Record<string, number> = {};
    experienceDistribution.forEach(bucket => {
      expDist[bucket._id] = bucket.count;
    });

    // Get location distribution
    const locationDistribution = await this.resumeBankModel.aggregate([
      { $match: { userId: userId, candidateLocation: { $exists: true } } },
      { $group: { _id: '$candidateLocation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const locDist: Record<string, number> = {};
    locationDistribution.forEach(location => {
      locDist[location._id] = location.count;
    });

    return {
      totalResumes,
      activeResumes,
      shortlistedResumes,
      recentUploads,
      topSkills,
      experienceDistribution: expDist,
      locationDistribution: locDist,
    };
  }

  async searchCandidatesForJob(
    jobId: string,
    userId: string,
    pagination: PaginationDto,
    filters: ResumeSearchFiltersDto = {}
  ): Promise<CandidateSearchResponseDto> {
    const startTime = Date.now();

    // Get all resumes for the user
    const resumes = await this.resumeBankModel.find({ userId }).exec();

    // TODO: Implement AI-powered candidate matching
    // For now, return basic results
    const candidates = resumes.map(resume => ({
      resumeId: resume._id.toString(),
      candidateName: resume.candidateName,
      candidateEmail: resume.candidateEmail,
      compatibilityScore: {
        overallScore: Math.random() * 100,
        skillsMatch: Math.random() * 100,
        experienceMatch: Math.random() * 100,
        roleMatch: Math.random() * 100,
        locationMatch: Math.random() * 100,
        matchConfidence: Math.random() * 100,
      },
      currentRole: resume.currentRole,
      yearsExperience: resume.yearsExperience,
      location: resume.candidateLocation,
      status: resume.status,
      matchReasons: ['Basic profile match'],
    }));

    // Apply pagination
    const totalCandidates = candidates.length;
    const startIndex = pagination.getSkip();
    const endIndex = startIndex + (pagination.limit || 20);
    const paginatedCandidates = candidates.slice(startIndex, endIndex);

    const searchTime = (Date.now() - startTime) / 1000;

    return {
      candidates: paginatedCandidates,
      totalCandidates,
      searchCriteria: {
        jobId,
        filters,
        pagination,
      },
      searchTime,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalPages: Math.ceil(totalCandidates / (pagination.limit || 20)),
        hasNext: endIndex < totalCandidates,
        hasPrevious: startIndex > 0,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalCandidates),
      },
    };
  }

  private mapToResumeResponse(resume: ResumeBankDocument): ResumeBankResponseDto {
    return {
      id: resume._id.toString(),
      filename: resume.filename,
      candidateName: resume.candidateName,
      candidateEmail: resume.candidateEmail,
      candidatePhone: resume.candidatePhone,
      candidateLocation: resume.candidateLocation,
      yearsExperience: resume.yearsExperience,
      currentRole: resume.currentRole,
      desiredRole: resume.desiredRole,
      salaryExpectation: resume.salaryExpectation,
      availability: resume.availability,
      tags: resume.tags,
      notes: resume.notes,
      summary: resume.summary,
      skills: resume.skills,
      education: resume.education,
      experienceLevel: resume.experienceLevel,
      overallAssessment: resume.overallAssessment,
      status: resume.status,
      lastContactDate: resume.lastContactDate,
      source: resume.source,
      jobId: resume.jobId,
      applicationId: resume.applicationId,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }
}
