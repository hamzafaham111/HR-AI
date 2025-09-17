import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

// Core modules
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ResumeBankModule } from './modules/resume-bank/resume-bank.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HiringProcessesModule } from './modules/hiring-processes/hiring-processes.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { JobApplicationsModule } from './modules/job-applications/job-applications.module';
import { HealthModule } from './modules/health/health.module';

// Configuration
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    AuthModule,
    JobsModule,
    ResumeBankModule,
    DashboardModule,
    HiringProcessesModule,
    MeetingsModule,
    JobApplicationsModule,
    HealthModule,
  ],
})
export class AppModule {}
