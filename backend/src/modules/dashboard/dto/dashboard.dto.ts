import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Resume statistics' })
  resumeStats: {
    total: number;
    active: number;
    recentUploads: number;
    archived: number;
  };

  @ApiProperty({ description: 'Job statistics' })
  jobStats: {
    total: number;
    active: number;
    recentPostings: number;
    closed: number;
  };

  @ApiProperty({ description: 'Hiring process statistics' })
  hiringProcessStats: {
    total: number;
    active: number;
    recent: number;
    completed: number;
  };

  @ApiProperty({ description: 'Meeting statistics' })
  meetingStats: {
    total: number;
    upcoming: number;
    recent: number;
    completed: number;
  };

  @ApiProperty({ description: 'Application statistics' })
  applicationStats: {
    total: number;
    pending: number;
    recent: number;
    processed: number;
  };

  @ApiProperty({ description: 'Analytics data' })
  analytics: {
    skillsDistribution: Record<string, number>;
    experienceDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
    topLocations: Array<{ location: string; count: number }>;
  };
}

export class RecentActivityDto {
  @ApiProperty({ description: 'Activity type' })
  type: string;

  @ApiProperty({ description: 'Activity title' })
  title: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Activity timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Activity data' })
  data: Record<string, any>;
}

export class AIInsightsDto {
  @ApiProperty({ description: 'AI summary' })
  summary: string;

  @ApiProperty({ description: 'AI recommendations', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'AI trends' })
  trends: Record<string, any>;

  @ApiProperty({ description: 'AI highlights', type: [String] })
  highlights: string[];
}

export class DashboardOverviewDto {
  @ApiProperty({ description: 'Total resumes in bank' })
  totalResumes: number;

  @ApiProperty({ description: 'Total job postings' })
  totalJobs: number;

  @ApiProperty({ description: 'Total hiring processes' })
  totalHiringProcesses: number;

  @ApiProperty({ description: 'Total meetings scheduled' })
  totalMeetings: number;

  @ApiProperty({ description: 'Total job applications' })
  totalApplications: number;

  @ApiProperty({ description: 'Detailed statistics' })
  statistics: DashboardStatsDto;

  @ApiProperty({ description: 'Recent system activity', type: [RecentActivityDto] })
  recentActivity: RecentActivityDto[];

  @ApiProperty({ description: 'AI-generated insights' })
  aiInsights: AIInsightsDto;
}

export class QuickStatsDto {
  @ApiProperty({ description: 'Total resumes' })
  totalResumes: number;

  @ApiProperty({ description: 'Total jobs' })
  totalJobs: number;

  @ApiProperty({ description: 'Total hiring processes' })
  totalHiringProcesses: number;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}
