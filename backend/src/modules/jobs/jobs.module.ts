import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job, JobSchema } from './schemas/job.schema';
import { JobApplicationFormsService } from '../job-applications/job-application-forms.service';
import { JobApplicationForm, JobApplicationFormSchema } from '../job-applications/schemas/job-application-form.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: JobApplicationForm.name, schema: JobApplicationFormSchema }
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobApplicationFormsService],
  exports: [JobsService],
})
export class JobsModule {}
