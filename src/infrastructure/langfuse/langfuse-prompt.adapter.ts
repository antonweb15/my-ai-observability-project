import { Injectable } from '@nestjs/common';
import { IPromptProvider } from '../../core/ports/prompt-provider.port';
import { PromptService } from '../../prompt/prompt.service';

@Injectable()
export class LangfusePromptAdapter implements IPromptProvider {
  constructor(private readonly promptService: PromptService) {}

  async getPrompt(name: string, variables: Record<string, any>): Promise<string> {
    return await this.promptService.getCompiledPrompt(name, variables);
  }
}
