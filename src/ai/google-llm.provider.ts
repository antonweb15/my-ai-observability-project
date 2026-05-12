import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ILlmProvider } from '../common/interfaces/llm-provider.interface';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

@Injectable()
export class GoogleLlmProvider implements ILlmProvider {
  getModel(
    config?: { model?: string; temperature?: number } & Record<string, unknown>,
  ): BaseChatModel {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: config?.model || 'gemini-3.1-flash-lite',
      temperature: config?.temperature ?? 0.2,
      ...config,
    });
  }
}
