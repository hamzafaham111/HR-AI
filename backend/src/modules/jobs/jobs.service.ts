import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { JobCreateDto, JobUpdateDto, JobResponseDto, ParseTextDto, ParseTextResponseDto } from './dto/job.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JobApplicationFormsService } from '../job-applications/job-application-forms.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private readonly jobApplicationFormsService: JobApplicationFormsService,
  ) {}

  async createJob(userId: string, jobData: JobCreateDto): Promise<JobResponseDto> {
    const job = new this.jobModel({
      ...jobData,
      userId,
    });

    const savedJob = await job.save();
    return this.mapToJobResponse(savedJob);
  }

  async getJobsByUser(userId: string, pagination: PaginationDto): Promise<JobResponseDto[]> {
    const jobs = await this.jobModel
      .find({ userId })
      .skip(pagination.getSkip())
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    return jobs.map(job => this.mapToJobResponse(job));
  }

  async getJobById(jobId: string, userId?: string): Promise<JobResponseDto> {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    // If userId is provided, check if user owns this job
    if (userId && job.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only view your own job postings');
    }

    return this.mapToJobResponse(job);
  }

  async getPublicJobById(jobId: string): Promise<JobResponseDto> {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    return this.mapToJobResponse(job);
  }

  async getPublicJobForm(jobId: string): Promise<any> {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    // Try to get the actual form created for this job
    const form = await this.jobApplicationFormsService.getPublicFormByJobId(jobId);
    
    if (form) {
      // Return the actual form that was created in the job detail page
      return form;
    }

    // If no form exists, return a default form structure
    // This ensures the public page still works even if no custom form was created
    const defaultForm = {
      id: `form-${jobId}`,
      jobId: jobId,
      title: `Application Form for ${job.title}`,
      description: `Apply for the ${job.title} position at ${job.company}`,
      fields: [
        {
          id: 1,
          name: 'applicant_name',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 2,
          name: 'applicant_email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'Enter your email address'
        },
        {
          id: 3,
          name: 'applicant_phone',
          label: 'Phone Number',
          type: 'phone',
          required: false,
          placeholder: 'Enter your phone number'
        },
        {
          id: 4,
          name: 'cover_letter',
          label: 'Cover Letter',
          type: 'textarea',
          required: false,
          placeholder: 'Tell us why you are interested in this position'
        }
      ],
      requiresResume: true,
      allowMultipleFiles: false,
      maxFileSizeMb: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      isActive: true,
      isPublic: true,
      submissionCount: 0,
      settings: {
        allowAnonymousSubmissions: true,
        requireEmailVerification: false,
        autoRespond: true,
        responseMessage: 'Thank you for your application! We will review it and get back to you soon.',
        redirectUrl: null
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return defaultForm;
  }

  async updateJob(jobId: string, userId: string, updateData: JobUpdateDto): Promise<JobResponseDto> {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    if (job.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only update your own job postings');
    }

    const updatedJob = await this.jobModel.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true }
    );

    return this.mapToJobResponse(updatedJob);
  }

  async deleteJob(jobId: string, userId: string): Promise<{ message: string }> {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    if (job.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only delete your own job postings');
    }

    await this.jobModel.findByIdAndDelete(jobId);
    return { message: 'Job posting deleted successfully' };
  }

  async parseJobText(parseData: ParseTextDto): Promise<ParseTextResponseDto> {
    // TODO: Implement AI-powered job text parsing
    // For now, return a basic structure
    return {
      title: 'Parsed Job Title',
      company: 'Parsed Company',
      location: 'Parsed Location',
      jobType: 'full_time',
      experienceLevel: 'mid',
      description: parseData.content.substring(0, 200) + '...',
      salaryRange: 'Competitive',
      requirements: [
        { skill: 'JavaScript', level: 'Intermediate', weight: 1.0 },
        { skill: 'React', level: 'Intermediate', weight: 1.0 },
      ],
      responsibilities: [
        'Develop and maintain web applications',
        'Collaborate with cross-functional teams',
      ],
      benefits: [
        'Health insurance',
        'Flexible working hours',
      ],
    };
  }

  async searchCandidatesForJob(
    jobId: string,
    pagination: PaginationDto,
    filters: {
      minScore?: number;
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ): Promise<{
    candidates: any[];
    pagination: {
      page: number;
      limit: number;
      totalCandidates: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    job: {
      id: string;
      title: string;
      company: string;
    };
  }> {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    // TODO: Implement candidate search logic
    // For now, return empty results
    return {
      candidates: [],
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalCandidates: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      job: {
        id: job._id.toString(),
        title: job.title,
        company: job.company,
      },
    };
  }

  private mapToJobResponse(job: JobDocument): JobResponseDto {
    return {
      id: job._id.toString(),
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      benefits: job.benefits,
      salaryRange: job.salaryRange,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
