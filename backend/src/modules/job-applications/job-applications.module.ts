import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobApplicationsController } from './job-applications.controller';
import { JobApplicationsService } from './job-applications.service';
// import { JobApplicationFormsService } from './job-application-forms.service';
import { JobApplication, JobApplicationSchema } from './schemas/job-application.schema';
// import { JobApplicationForm, JobApplicationFormSchema } from './schemas/job-application-form.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobApplication.name, schema: JobApplicationSchema },
      // { name: JobApplicationForm.name, schema: JobApplicationFormSchema },
    ]),
  ],
  controllers: [JobApplicationsController],
  providers: [JobApplicationsService],
  exports: [JobApplicationsService],
})
export class JobApplicationsModule {}
