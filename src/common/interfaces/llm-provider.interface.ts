import { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * Interface for working with LLM providers (Gemini, OpenAI, etc.).
 */
export interface ILlmProvider {
  /**
   * Returns a configured instance of the model.
   */
  getModel(
    config?: { model?: string; temperature?: number } & Record<string, unknown>,
  ): BaseChatModel;
}
