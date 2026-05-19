import { Injectable, OnModuleDestroy, Inject } from '@nestjs/common';
import { CallbackHandler } from 'langfuse-langchain';

@Injectable()
export class LangfuseService implements OnModuleDestroy {
  constructor(
    @Inject('LANGFUSE_HANDLER') private readonly handler: CallbackHandler,
  ) {}

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
