import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SeoProcessor } from './seo.processor';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'seo-generation',
    }),
    InfrastructureModule,
  ],
  providers: [SeoProcessor],
  exports: [BullModule],
})
export class JobsModule {}
