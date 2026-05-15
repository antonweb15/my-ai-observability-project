import { Injectable, Inject } from '@nestjs/common';
import { ILlmService } from '../../core/ports/llm-service.port';
import { LangfuseService } from '../../langfuse/langfuse.service';
import type { ILlmProvider } from '../../common/interfaces/llm-provider.interface';

import { CallbackHandler } from 'langfuse-langchain';
import { BaseMessage } from '@langchain/core/messages';

@Injectable()
export class LlmServiceAdapter implements ILlmService {
  constructor(
    private readonly langfuseService: LangfuseService,
    @Inject('ILLM_PROVIDER') private readonly llmProvider: ILlmProvider,
  ) {}

  /**
   * Generates content based on a prompt.
   * @param prompt Prepared prompt text.
   * @param options Execution parameters (run name, callbacks for tracing).
   */
  async generate(
    prompt: string,
    options?: { runName?: string; callbacks?: CallbackHandler[] },
  ): Promise<BaseMessage | string> {
    const model = this.llmProvider.getModel({
      model: 'gemini-3.1-flash-lite',
      temperature: 0.2,
    });

    return await model.invoke(prompt, {
      callbacks: options?.callbacks,
      runName: options?.runName,
    });
  }

  /**
   * Sends a score to Langfuse for analyzing response quality.
   * @param params Scoring parameters (metric name, value, trace ID, etc.).
   */
  async score(params: {
    name: string;
    value: number;
    traceId?: string;
    observationId?: string;
    comment?: string;
  }): Promise<void> {
    if (!params.traceId) return;

    await this.langfuseService.score({
      ...params,
      traceId: params.traceId,
      dataType: 'NUMERIC',
    });
  }

  /**
   * Gets the event handler for LangChain integration with Langfuse.
   */
  getHandler() {
    return this.langfuseService.getHandler();
  }

  /**
   * Forces the upload of accumulated data to Langfuse.
   */
  async flush(): Promise<void> {
    await this.langfuseService.flush();
  }
}
