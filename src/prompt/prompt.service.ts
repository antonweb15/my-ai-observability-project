import { Injectable, Logger } from '@nestjs/common';
import { LangfuseService } from '../langfuse/langfuse.service';

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  constructor(private langfuseService: LangfuseService) {}

  /**
   * Retrieves a compiled prompt from Langfuse.
   * @param name Prompt name in the Langfuse system.
   * @param input Object with variables for template substitution.
   * @param options Optional: label or prompt version.
   */
  async getCompiledPrompt(
    name: string,
    input: Record<string, any>,
    options: { label?: string; version?: string } = { label: 'production' },
  ): Promise<string> {
    this.logger.log(`Fetching prompt "${name}" for product: ${input.productName}`);
    const handler = this.langfuseService.getHandler();
    const promptConfig = await handler.langfuse.getPrompt(name, undefined, {
      label: options.label,
    });
    const compiled = promptConfig.compile(input);
    this.logger.log(`Prompt "${name}" compiled successfully`);
    return compiled;
  }
}
