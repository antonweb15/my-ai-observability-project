import { Injectable, Inject } from '@nestjs/common';
import { ILlmService } from '../../core/ports/llm-service.port';
import { LangfuseService } from '../../langfuse/langfuse.service';
import type { ILlmProvider } from '../../common/interfaces/llm-provider.interface';

import { CallbackHandler } from 'langfuse-langchain';
import { BaseMessage } from '@langchain/core/messages';
import { Observable } from 'rxjs';

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
   * Generates a streaming response based on a prompt.
   */
  stream(
    prompt: string,
    options?: { runName?: string; callbacks?: CallbackHandler[] },
  ): Observable<string> {
    const model = this.llmProvider.getModel({
      model: 'gemini-3.1-flash-lite',
      temperature: 0.2,
    });

    return new Observable<string>((subscriber) => {
      let buffer = '';
      model
        .stream(prompt, {
          callbacks: options?.callbacks,
          runName: options?.runName,
        })
        .then(async (stream) => {
          for await (const chunk of stream) {
            const content =
              typeof chunk.content === 'string'
                ? chunk.content
                : JSON.stringify(chunk.content);

            buffer += content;

            // Remove full markdown blocks if present in buffer
            if (buffer.includes('```json')) {
              buffer = buffer.replace(/```json/g, '');
            }
            if (buffer.includes('```')) {
              buffer = buffer.replace(/```/g, '');
            }

            // To avoid sending partial backticks that might be part of a future ```
            // we only send content if it doesn't end with backticks (up to 2)
            // unless the buffer is getting too long or the stream is about to end.
            const match = buffer.match(/`{1,2}$/);
            if (match) {
              const toSend = buffer.slice(0, -match[0].length);
              if (toSend) {
                subscriber.next(toSend);
                buffer = match[0];
              }
            } else {
              if (buffer) {
                subscriber.next(buffer);
                buffer = '';
              }
            }
          }

          // Flush remaining buffer
          if (buffer) {
            // Final check for backticks in case they weren't part of a block
            const finalCleaned = buffer.replace(/```json/g, '').replace(/```/g, '');
            if (finalCleaned) {
              subscriber.next(finalCleaned);
            }
          }
          subscriber.complete();
        })
        .catch((err: unknown) => {
          subscriber.error(err);
        });
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
