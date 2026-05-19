import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ILlmProvider } from '../common/interfaces/llm-provider.interface';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleLlmProvider implements ILlmProvider {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Initializes and returns the Google Gemini model.
   */
  getModel(
    config?: { model?: string; temperature?: number } & Record<string, unknown>,
  ): BaseChatModel {
    return new ChatGoogleGenerativeAI({
      apiKey:
        this.configService.get<string>('app.google.apiKey') || 'missing-key',
      model: config?.model || 'gemini-3.1-flash-lite',
      temperature: config?.temperature ?? 0.2,
      ...config,
    });
  }
}
