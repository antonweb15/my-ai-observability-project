import { Module, forwardRef } from '@nestjs/common';
import { AiController } from './ai.controller';
import { GoogleLlmProvider } from './google-llm.provider';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [forwardRef(() => InfrastructureModule), JobsModule],
  controllers: [AiController],
  providers: [
    {
      provide: 'ILLM_PROVIDER',
      useClass: GoogleLlmProvider,
    },
  ],
  exports: ['ILLM_PROVIDER'],
})
export class AiModule {}
