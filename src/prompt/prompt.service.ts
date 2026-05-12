import { Injectable } from '@nestjs/common';
import { LangfuseService } from '../langfuse/langfuse.service';

@Injectable()
export class PromptService {
  constructor(private langfuseService: LangfuseService) {}

  async getCompiledPrompt(
    name: string,
    input: Record<string, any>,
    options: { label?: string; version?: string } = { label: 'production' },
  ): Promise<string> {
    const handler = this.langfuseService.getHandler();
    const promptConfig = await handler.langfuse.getPrompt(name, undefined, {
      label: options.label,
    });
    return promptConfig.compile(input);
  }
}
