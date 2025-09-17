import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeBankController } from './resume-bank.controller';
import { ResumeBankService } from './resume-bank.service';
import { ResumeBank, ResumeBankSchema } from './schemas/resume-bank.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ResumeBank.name, schema: ResumeBankSchema }]),
  ],
  controllers: [ResumeBankController],
  providers: [ResumeBankService],
  exports: [ResumeBankService],
})
export class ResumeBankModule {}
