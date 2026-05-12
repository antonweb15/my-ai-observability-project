import { Module, forwardRef } from '@nestjs/common';
import { GenerateSeoUseCase } from '../core/use-cases/generate-seo.use-case';
import { SupabaseVectorStoreAdapter } from './supabase/supabase-vector-store.adapter';
import { LangfusePromptAdapter } from './langfuse/langfuse-prompt.adapter';
import { LlmServiceAdapter } from './llm/llm-service.adapter';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { PromptModule } from '../prompt/prompt.module';
import { LangfuseModule } from '../langfuse/langfuse.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    VectorStoreModule,
    PromptModule,
    LangfuseModule,
    forwardRef(() => AiModule)
  ],
  providers: [
    SupabaseVectorStoreAdapter,
    LangfusePromptAdapter,
    LlmServiceAdapter,
    {
      provide: GenerateSeoUseCase,
      useFactory: (
        vectorStore: SupabaseVectorStoreAdapter,
        promptProvider: LangfusePromptAdapter,
        llmService: LlmServiceAdapter,
      ) => new GenerateSeoUseCase(vectorStore, promptProvider, llmService),
      inject: [SupabaseVectorStoreAdapter, LangfusePromptAdapter, LlmServiceAdapter],
    },
  ],
  exports: [GenerateSeoUseCase, LlmServiceAdapter],
})
export class InfrastructureModule {}
