import { CallbackHandler } from 'langfuse-langchain';

/**
 * Port for interacting with language models.
 */
export interface ILlmService {
  /**
   * Generates a response based on a prompt.
   */
  generate(
    prompt: string,
    options?: { runName?: string; callbacks?: CallbackHandler[] },
  ): Promise<any>;

  /**
   * Sends a quality score for LLM performance.
   */
  score(params: {
    name: string;
    value: number;
    traceId?: string;
    observationId?: string;
    comment?: string;
  }): Promise<void>;

  /**
   * Returns a handler for LangChain integration.
   */
  getHandler(): CallbackHandler;

  /**
   * Flushes the event buffer.
   */
  flush(): Promise<void>;
}
