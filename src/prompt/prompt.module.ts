import { Module } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { LangfuseModule } from '../langfuse/langfuse.module';

@Module({
  imports: [LangfuseModule],
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}
