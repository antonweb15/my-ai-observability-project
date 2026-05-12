import { BaseMessage } from '@langchain/core/messages';
import { IVectorStore } from '../ports/vector-store.port';
import { IPromptProvider } from '../ports/prompt-provider.port';
import { ILlmService } from '../ports/llm-service.port';
import { Product } from '../entities/seo.entity';

export class GenerateSeoUseCase {
  constructor(
    private readonly vectorStore: IVectorStore,
    private readonly promptProvider: IPromptProvider,
    private readonly llmService: ILlmService,
  ) {}

  async execute(product: Product) {
    // 1. Поиск контекста
    const docs = await this.vectorStore.similaritySearch(product.category, 2);
    const context = docs.map((d) => d.pageContent).join('\n\n');

    // 2. Получение промпта
    const prompt = await this.promptProvider.getPrompt(
      'seo_description_generator',
      {
        productName: product.name,
        category: product.category,
        context: context,
      },
    );

    // 3. Генерация с трейсингом
    const handler = this.llmService.getHandler();
    const response = (await this.llmService.generate(prompt, {
      runName: 'RAG_SEO_Generation_UseCase',
      callbacks: [handler],
    })) as BaseMessage | string;

    // 4. Валидация и скоринг
    const traceId = handler.traceId;
    const observationId =
      handler.observationId ||
      (typeof handler.getLangchainRunId === 'function'
        ? handler.getLangchainRunId()
        : undefined);

    try {
      const rawContent =
        typeof response === 'object' &&
        response !== null &&
        'content' in response
          ? (response.content as string)
          : String(response);

      const jsonMatch = rawContent.match(/```json?([\s\S]*?)```/) || [
        null,
        rawContent,
      ];
      const cleanContent = (jsonMatch[1] || '').trim();

      if (cleanContent) {
        JSON.parse(cleanContent); // Проверка валидности
      }

      if (traceId) {
        await this.llmService.score({
          name: 'valid_json',
          value: 1,
          traceId,
          observationId,
          comment: 'JSON successfully parsed',
        });
      }
    } catch (e) {
      if (traceId) {
        await this.llmService.score({
          name: 'valid_json',
          value: 0,
          traceId,
          observationId,
          comment: `Parsing error: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }

    return response;
  }
}
