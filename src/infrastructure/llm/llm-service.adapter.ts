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

  getHandler() {
    return this.langfuseService.getHandler();
  }

  async flush(): Promise<void> {
    await this.langfuseService.flush();
  }
}
