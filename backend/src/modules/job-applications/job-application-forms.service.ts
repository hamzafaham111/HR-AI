import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobApplicationForm, JobApplicationFormDocument } from './schemas/job-application-form.schema';
import { CreateJobApplicationFormDto, UpdateJobApplicationFormDto, JobApplicationFormResponseDto } from './dto/job-application-form.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class JobApplicationFormsService {
  constructor(
    @InjectModel(JobApplicationForm.name)
    private jobApplicationFormModel: Model<JobApplicationFormDocument>,
  ) {}

  async createForm(userId: string, createDto: CreateJobApplicationFormDto): Promise<JobApplicationFormResponseDto> {
    // Check if a form already exists for this job
    const existingForm = await this.jobApplicationFormModel.findOne({
      jobId: createDto.jobId,
      userId,
    });

    if (existingForm) {
      throw new BadRequestException('A form already exists for this job');
    }

    const formData = {
      ...createDto,
      userId,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
    };

    const form = new this.jobApplicationFormModel(formData);
    const savedForm = await form.save();

    return this.mapToResponseDto(savedForm);
  }

  async getFormsByUser(userId: string, pagination: PaginationDto): Promise<JobApplicationFormResponseDto[]> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const forms = await this.jobApplicationFormModel
      .find({ userId })
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return forms.map(form => this.mapToResponseDto(form));
  }

  async getFormById(formId: string, userId: string): Promise<JobApplicationFormResponseDto> {
    const form = await this.jobApplicationFormModel
      .findById(formId)
      .populate('jobId', 'title company')
      .exec();

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (form.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to access this form');
    }

    return this.mapToResponseDto(form);
  }

  async getFormByJobId(jobId: string, userId: string): Promise<JobApplicationFormResponseDto | null> {
    const form = await this.jobApplicationFormModel
      .findOne({ jobId, userId })
      .populate('jobId', 'title company')
      .exec();

    if (!form) {
      return null;
    }

    return this.mapToResponseDto(form);
  }

  async getPublicFormByJobId(jobId: string): Promise<JobApplicationFormResponseDto | null> {
    const form = await this.jobApplicationFormModel
      .findOne({ 
        jobId, 
        isPublic: true, 
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      })
      .populate('jobId', 'title company')
      .exec();

    if (!form) {
      return null;
    }

    return this.mapToResponseDto(form);
  }

  async updateForm(formId: string, updateDto: UpdateJobApplicationFormDto, userId: string): Promise<JobApplicationFormResponseDto> {
    const form = await this.jobApplicationFormModel.findById(formId);

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (form.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to update this form');
    }

    const updateData = {
      ...updateDto,
      expiresAt: updateDto.expiresAt ? new Date(updateDto.expiresAt) : form.expiresAt,
    };

    const updatedForm = await this.jobApplicationFormModel
      .findByIdAndUpdate(formId, updateData, { new: true })
      .populate('jobId', 'title company')
      .exec();

    return this.mapToResponseDto(updatedForm);
  }

  async deleteForm(formId: string, userId: string): Promise<void> {
    const form = await this.jobApplicationFormModel.findById(formId);

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (form.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this form');
    }

    await this.jobApplicationFormModel.findByIdAndDelete(formId);
  }

  async incrementSubmissionCount(formId: string): Promise<void> {
    await this.jobApplicationFormModel.findByIdAndUpdate(
      formId,
      { $inc: { submissionCount: 1 } },
      { new: true }
    );
  }

  async getFormStats(userId: string): Promise<Record<string, number>> {
    const stats = await this.jobApplicationFormModel.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalForms: { $sum: 1 },
          activeForms: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', true] },
                    {
                      $or: [
                        { $eq: ['$expiresAt', null] },
                        { $gt: ['$expiresAt', new Date()] }
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalSubmissions: { $sum: '$submissionCount' },
          publicForms: {
            $sum: {
              $cond: [{ $eq: ['$isPublic', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalForms: 0,
      activeForms: 0,
      totalSubmissions: 0,
      publicForms: 0
    };
  }

  private mapToResponseDto(form: JobApplicationFormDocument): JobApplicationFormResponseDto {
    return {
      id: form._id.toString(),
      jobId: form.jobId.toString(),
      title: form.title,
      description: form.description,
      fields: form.fields,
      requiresResume: form.requiresResume,
      allowMultipleFiles: form.allowMultipleFiles,
      maxFileSizeMb: form.maxFileSizeMb,
      allowedFileTypes: form.allowedFileTypes,
      isActive: form.isActive,
      isPublic: form.isPublic,
      expiresAt: form.expiresAt,
      submissionCount: form.submissionCount,
      settings: form.settings,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  }
}

