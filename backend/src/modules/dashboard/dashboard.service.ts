import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { ResumeBank, ResumeBankDocument } from '../resume-bank/schemas/resume-bank.schema';
import { DashboardOverviewDto, DashboardStatsDto, QuickStatsDto, RecentActivityDto, AIInsightsDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(ResumeBank.name) private resumeBankModel: Model<ResumeBankDocument>,
  ) {}

  async getDashboardOverview(userId: string): Promise<DashboardOverviewDto> {
    // Get basic counts
    const totalResumes = await this.resumeBankModel.countDocuments({ userId });
    const totalJobs = await this.jobModel.countDocuments({ userId });
    const totalHiringProcesses = 0; // TODO: Implement when hiring processes module is ready
    const totalMeetings = 0; // TODO: Implement when meetings module is ready
    const totalApplications = 0; // TODO: Implement when job applications module is ready

    // Get detailed statistics
    const statistics = await this.calculateDashboardStatistics(userId);

    // Get recent activity
    const recentActivity = await this.getRecentActivity(userId);

    // Generate AI insights
    const aiInsights = await this.generateAIInsights(userId);

    return {
      totalResumes,
      totalJobs,
      totalHiringProcesses,
      totalMeetings,
      totalApplications,
      statistics,
      recentActivity,
      aiInsights,
    };
  }

  async getQuickStats(userId: string): Promise<QuickStatsDto> {
    const totalResumes = await this.resumeBankModel.countDocuments({ userId });
    const totalJobs = await this.jobModel.countDocuments({ userId });
    const totalHiringProcesses = 0; // TODO: Implement when hiring processes module is ready

    return {
      totalResumes,
      totalJobs,
      totalHiringProcesses,
      timestamp: new Date().toISOString(),
    };
  }

  async getDetailedStatistics(userId: string): Promise<DashboardStatsDto> {
    return this.calculateDashboardStatistics(userId);
  }

  async getAnalytics(userId: string): Promise<{
    statistics: DashboardStatsDto;
    recentActivity: RecentActivityDto[];
    aiInsights: AIInsightsDto;
    generatedAt: string;
  }> {
    const statistics = await this.calculateDashboardStatistics(userId);
    const recentActivity = await this.getRecentActivity(userId);
    const aiInsights = await this.generateAIInsights(userId);

    return {
      statistics,
      recentActivity,
      aiInsights,
      generatedAt: new Date().toISOString(),
    };
  }

  private async calculateDashboardStatistics(userId: string): Promise<DashboardStatsDto> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Resume Statistics
    const totalResumes = await this.resumeBankModel.countDocuments({ userId });
    const activeResumes = await this.resumeBankModel.countDocuments({ userId, status: 'active' });
    const recentResumes = await this.resumeBankModel.countDocuments({
      userId,
      createdAt: { $gte: weekAgo }
    });

    // Job Statistics
    const totalJobs = await this.jobModel.countDocuments({ userId });
    const activeJobs = await this.jobModel.countDocuments({ userId, status: 'active' });
    const recentJobs = await this.jobModel.countDocuments({
      userId,
      createdAt: { $gte: weekAgo }
    });

    // Hiring Process Statistics (placeholder)
    const totalHiringProcesses = 0;
    const activeHiringProcesses = 0;
    const recentHiringProcesses = 0;

    // Meeting Statistics (placeholder)
    const totalMeetings = 0;
    const upcomingMeetings = 0;
    const recentMeetings = 0;

    // Job Application Statistics (placeholder)
    const totalApplications = 0;
    const pendingApplications = 0;
    const recentApplications = 0;

    // Skills Distribution Analysis
    const skillsCounts: Record<string, number> = {};
    const experienceDistribution: Record<string, number> = { '0-2': 0, '3-5': 0, '6-10': 0, '10+': 0 };
    const locationDistribution: Record<string, number> = {};

    const resumes = await this.resumeBankModel.find({ userId });
    resumes.forEach(resume => {
      // Skills analysis
      if (resume.skills) {
        resume.skills.forEach(skill => {
          skillsCounts[skill] = (skillsCounts[skill] || 0) + 1;
        });
      }

      // Experience distribution
      const yearsExp = resume.yearsExperience;
      if (yearsExp) {
        if (yearsExp <= 2) {
          experienceDistribution['0-2']++;
        } else if (yearsExp <= 5) {
          experienceDistribution['3-5']++;
        } else if (yearsExp <= 10) {
          experienceDistribution['6-10']++;
        } else {
          experienceDistribution['10+']++;
        }
      }

      // Location distribution
      if (resume.candidateLocation) {
        locationDistribution[resume.candidateLocation] = (locationDistribution[resume.candidateLocation] || 0) + 1;
      }
    });

    // Top skills (limit to top 10)
    const topSkills = Object.entries(skillsCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [skill, count]) => ({ ...obj, [skill]: count }), {});

    // Top locations
    const topLocations = Object.entries(locationDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    return {
      resumeStats: {
        total: totalResumes,
        active: activeResumes,
        recentUploads: recentResumes,
        archived: totalResumes - activeResumes,
      },
      jobStats: {
        total: totalJobs,
        active: activeJobs,
        recentPostings: recentJobs,
        closed: totalJobs - activeJobs,
      },
      hiringProcessStats: {
        total: totalHiringProcesses,
        active: activeHiringProcesses,
        recent: recentHiringProcesses,
        completed: totalHiringProcesses - activeHiringProcesses,
      },
      meetingStats: {
        total: totalMeetings,
        upcoming: upcomingMeetings,
        recent: recentMeetings,
        completed: totalMeetings - upcomingMeetings,
      },
      applicationStats: {
        total: totalApplications,
        pending: pendingApplications,
        recent: recentApplications,
        processed: totalApplications - pendingApplications,
      },
      analytics: {
        skillsDistribution: topSkills,
        experienceDistribution,
        locationDistribution,
        topLocations,
      },
    };
  }

  private async getRecentActivity(userId: string): Promise<RecentActivityDto[]> {
    const recentActivity: RecentActivityDto[] = [];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Recent resume uploads
    const recentResumes = await this.resumeBankModel
      .find({ userId, createdAt: { $gte: weekAgo } })
      .sort({ createdAt: -1 })
      .limit(5);

    recentResumes.forEach(resume => {
      recentActivity.push({
        type: 'resume_upload',
        title: `Resume uploaded: ${resume.candidateName}`,
        description: 'Added to resume bank',
        timestamp: resume.createdAt,
        data: {
          candidateName: resume.candidateName,
          currentRole: resume.currentRole,
          yearsExperience: resume.yearsExperience,
        },
      });
    });

    // Recent job postings
    const recentJobs = await this.jobModel
      .find({ userId, createdAt: { $gte: weekAgo } })
      .sort({ createdAt: -1 })
      .limit(5);

    recentJobs.forEach(job => {
      recentActivity.push({
        type: 'job_posting',
        title: `Job posted: ${job.title}`,
        description: 'New job opportunity created',
        timestamp: job.createdAt,
        data: {
          jobTitle: job.title,
          location: job.location,
          jobType: job.jobType,
        },
      });
    });

    // Sort all activities by timestamp
    recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return recentActivity.slice(0, 10); // Return top 10 most recent
  }

  private async generateAIInsights(userId: string): Promise<AIInsightsDto> {
    const insights: AIInsightsDto = {
      summary: '',
      recommendations: [],
      trends: {},
      highlights: [],
    };

    // Get basic counts for insights
    const totalResumes = await this.resumeBankModel.countDocuments({ userId });
    const totalJobs = await this.jobModel.countDocuments({ userId });

    if (totalResumes === 0 && totalJobs === 0) {
      insights.summary = 'Welcome to your HR system! Start by adding resumes and creating job postings to see insights.';
      insights.recommendations = [
        'Upload your first resume to the resume bank',
        'Create your first job posting',
        'Set up a hiring process to manage candidates',
      ];
      return insights;
    }

    // Generate insights based on data
    if (totalResumes > 0) {
      insights.highlights.push(`You have ${totalResumes} resumes in your talent pool`);
      
      if (totalResumes < 10) {
        insights.recommendations.push('Consider expanding your resume bank for better candidate matching');
      }
    }

    if (totalJobs > 0) {
      insights.highlights.push(`You have ${totalJobs} active job postings`);
      
      if (totalJobs < 3) {
        insights.recommendations.push('Create more job postings to attract diverse candidates');
      }
    }

    // Skills analysis
    const skillsCounts: Record<string, number> = {};
    const resumes = await this.resumeBankModel.find({ userId });
    resumes.forEach(resume => {
      if (resume.skills) {
        resume.skills.forEach(skill => {
          skillsCounts[skill] = (skillsCounts[skill] || 0) + 1;
        });
      }
    });

    if (Object.keys(skillsCounts).length > 0) {
      const topSkill = Object.entries(skillsCounts).reduce((a, b) => skillsCounts[a[0]] > skillsCounts[b[0]] ? a : b);
      insights.highlights.push(`Most common skill: ${topSkill[0]} (${topSkill[1]} candidates)`);
    }

    // Generate summary
    if (insights.highlights.length > 0) {
      insights.summary = `Your HR system is active with ${totalResumes} resumes and ${totalJobs} jobs. ${insights.highlights.slice(0, 2).join('. ')}`;
    }

    return insights;
  }
}
