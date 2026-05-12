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

  getHandler(): CallbackHandler {
    return this.handler;
  }

  async flush(): Promise<void> {
    await this.handler.flushAsync();
  }

  async score(params: {
    name: string;
    value: number;
    traceId: string;
    observationId?: string;
    comment?: string;
    dataType?: 'NUMERIC' | 'BOOLEAN' | 'CATEGORICAL';
  }): Promise<void> {
    await this.handler.langfuse.score(params);
  }

  async onModuleDestroy() {
    await this.flush();
  }
}
