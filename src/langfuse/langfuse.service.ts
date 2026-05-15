import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { CallbackHandler } from 'langfuse-langchain';

@Injectable()
export class LangfuseService implements OnModuleDestroy {
  private handler: CallbackHandler;

  constructor() {
    this.handler = new CallbackHandler({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL,
    });
  }

  /**
   * Returns the LangChain Handler for automatic tracing.
   */
  getHandler(): CallbackHandler {
    return this.handler;
  }

  /**
   * Asynchronous event queue flush.
   */
  async flush(): Promise<void> {
    await this.handler.flushAsync();
  }

  /**
   * Records a score for a specific trace.
   */
  async score(params: {
    name: string;
    value: number;
    traceId: string;
    observationId?: string;
    comment?: string;
    dataType?: 'NUMERIC' | 'BOOLEAN' | 'CATEGORICAL';
  }): Promise<void> {
    this.handler.langfuse.score(params);
    return Promise.resolve();
  }

  async onModuleDestroy() {
    await this.flush();
  }
}
