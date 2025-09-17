import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HiringProcess, HiringProcessDocument } from './schemas/hiring-process.schema';
import { HiringProcessCreateDto, HiringProcessUpdateDto, HiringProcessResponseDto } from './dto/hiring-process.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class HiringProcessesService {
  constructor(
    @InjectModel(HiringProcess.name) private hiringProcessModel: Model<HiringProcessDocument>,
  ) {}

  async createHiringProcess(userId: string, createDto: HiringProcessCreateDto): Promise<HiringProcessResponseDto> {
    const hiringProcess = new this.hiringProcessModel({
      ...createDto,
      userId,
    });

    const savedProcess = await hiringProcess.save();
    return this.mapToResponse(savedProcess);
  }

  async getHiringProcessesByUser(userId: string, pagination: PaginationDto): Promise<HiringProcessResponseDto[]> {
    const processes = await this.hiringProcessModel
      .find({ userId })
      .skip(pagination.getSkip())
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    return processes.map(process => this.mapToResponse(process));
  }

  async getHiringProcessById(processId: string, userId?: string): Promise<HiringProcessResponseDto> {
    const process = await this.hiringProcessModel.findById(processId);
    if (!process) {
      throw new NotFoundException('Hiring process not found');
    }

    // If userId is provided, check if user owns this process
    if (userId && process.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only view your own hiring processes');
    }

    return this.mapToResponse(process);
  }

  async updateHiringProcess(processId: string, updateDto: HiringProcessUpdateDto, userId: string): Promise<HiringProcessResponseDto> {
    const process = await this.hiringProcessModel.findById(processId);
    if (!process) {
      throw new NotFoundException('Hiring process not found');
    }

    // Check if user owns this process
    if (process.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only update your own hiring processes');
    }

    const updatedProcess = await this.hiringProcessModel
      .findByIdAndUpdate(processId, updateDto, { new: true })
      .exec();

    return this.mapToResponse(updatedProcess);
  }

  async deleteHiringProcess(processId: string, userId: string): Promise<{ message: string }> {
    const process = await this.hiringProcessModel.findById(processId);
    if (!process) {
      throw new NotFoundException('Hiring process not found');
    }

    // Check if user owns this process
    if (process.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only delete your own hiring processes');
    }

    await this.hiringProcessModel.findByIdAndDelete(processId).exec();
    return { message: 'Hiring process deleted successfully' };
  }

  async getHiringProcessesByJob(jobId: string, userId: string): Promise<HiringProcessResponseDto[]> {
    const processes = await this.hiringProcessModel
      .find({ jobId, userId })
      .sort({ createdAt: -1 })
      .exec();

    return processes.map(process => this.mapToResponse(process));
  }

  async updateHiringStage(processId: string, stage: string, userId: string): Promise<HiringProcessResponseDto> {
    const process = await this.hiringProcessModel.findById(processId);
    if (!process) {
      throw new NotFoundException('Hiring process not found');
    }

    // Check if user owns this process
    if (process.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied: You can only update your own hiring processes');
    }

    const updatedProcess = await this.hiringProcessModel
      .findByIdAndUpdate(processId, { currentStage: stage }, { new: true })
      .exec();

    return this.mapToResponse(updatedProcess);
  }

  private mapToResponse(process: HiringProcessDocument): HiringProcessResponseDto {
    return {
      id: process._id.toString(),
      jobId: process.jobId.toString(),
      title: process.title,
      description: process.description,
      status: process.status,
      stages: process.stages,
      currentStage: process.currentStage,
      candidateIds: process.candidateIds.map(id => id.toString()),
      interviewerIds: process.interviewerIds.map(id => id.toString()),
      startDate: process.startDate,
      endDate: process.endDate,
      notes: process.notes,
      criteria: process.criteria,
      settings: process.settings,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
    };
  }
}
