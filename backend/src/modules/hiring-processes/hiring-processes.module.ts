import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HiringProcessesController } from './hiring-processes.controller';
import { HiringProcessesService } from './hiring-processes.service';
import { HiringProcess, HiringProcessSchema } from './schemas/hiring-process.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HiringProcess.name, schema: HiringProcessSchema },
    ]),
  ],
  controllers: [HiringProcessesController],
  providers: [HiringProcessesService],
  exports: [HiringProcessesService],
})
export class HiringProcessesModule {}
