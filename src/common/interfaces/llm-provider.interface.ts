import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface ILlmProvider {
  getModel(config?: Record<string, any>): BaseChatModel;
}
