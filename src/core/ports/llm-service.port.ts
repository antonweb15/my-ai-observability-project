import { CallbackHandler } from 'langfuse-langchain';

export interface ILlmService {
  generate(
    prompt: string,
    options?: { runName?: string; callbacks?: CallbackHandler[] },
  ): Promise<any>;
  score(params: {
    name: string;
    value: number;
    traceId?: string;
    observationId?: string;
    comment?: string;
  }): Promise<void>;
  getHandler(): CallbackHandler;
  flush(): Promise<void>;
}
