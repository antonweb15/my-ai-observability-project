import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { GoogleLlmProvider } from './google-llm.provider';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [VectorStoreModule, forwardRef(() => InfrastructureModule)],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'ILLM_PROVIDER',
      useClass: GoogleLlmProvider,
    },
  ],
  exports: ['ILLM_PROVIDER', AiService],
})
export class AiModule {}
