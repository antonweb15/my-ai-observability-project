import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { LangfuseModule } from '../langfuse/langfuse.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { PromptModule } from '../prompt/prompt.module';
import { GoogleLlmProvider } from './google-llm.provider';

@Module({
  imports: [
    SupabaseModule,
    LangfuseModule,
    VectorStoreModule,
    PromptModule,
  ],
  providers: [
    AiService,
    {
      provide: 'ILLM_PROVIDER',
      useClass: GoogleLlmProvider,
    },
  ],
})
export class AiModule {}
