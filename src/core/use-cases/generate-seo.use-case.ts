import { BaseMessage } from '@langchain/core/messages';
import { IVectorStore } from '../ports/vector-store.port';
import { IPromptProvider } from '../ports/prompt-provider.port';
import { ILlmService } from '../ports/llm-service.port';
import { Product } from '../entities/seo.entity';
import { Observable, finalize } from 'rxjs';
import { Logger } from '@nestjs/common';

export class GenerateSeoUseCase {
  constructor(
    private readonly vectorStore: IVectorStore,
    private readonly promptProvider: IPromptProvider,
    private readonly llmService: ILlmService,
  ) {}

  /**
   * Main SEO generation scenario using RAG.
   * 1. Context search in vector store.
   * 2. Getting and compiling prompt from Langfuse.
   * 3. Content generation via LLM with tracing.
   * 4. JSON validation and automatic scoring in Langfuse.
   */
  async execute(product: Product) {
    // 1. Context search
    const docs = await this.vectorStore.similaritySearch(product.category, 2);
    const context = docs.map((d) => d.pageContent).join('\n\n');

    // 2. Getting prompt
    const prompt = await this.promptProvider.getPrompt(
      'seo_description_generator',
      {
        productName: product.name,
        category: product.category,
        context: context,
      },
    );

    // 3. Generation with tracing
    const handler = this.llmService.getHandler();
    const response = (await this.llmService.generate(prompt, {
      runName: 'RAG_SEO_Generation_UseCase',
      callbacks: [handler],
    })) as BaseMessage | string;

    // 4. Validation and scoring
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

      // More robust JSON extraction from markdown
      const jsonMatch =
        rawContent.match(/```json\s*([\s\S]*?)\s*```/) ||
        rawContent.match(/```\s*([\s\S]*?)\s*```/) ||
        [null, rawContent];

      const cleanContent = (jsonMatch[1] || rawContent).trim();

      if (cleanContent) {
        JSON.parse(cleanContent); // Validation check
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

  /**
   * Streaming version of the SEO generation scenario.
   */
  async executeStream(product: Product): Promise<Observable<string>> {
    const logger = new Logger(GenerateSeoUseCase.name);
    // 1. Context search
    logger.log(`Starting RAG for product: ${product.name}`);
    const docs = await this.vectorStore.similaritySearch(product.category, 2);
    const context = docs.map((d) => d.pageContent).join('\n\n');

    // 2. Getting prompt
    logger.log('Retrieving prompt from Langfuse...');
    const prompt = await this.promptProvider.getPrompt(
      'seo_description_generator',
      {
        productName: product.name,
        category: product.category,
        context: context,
      },
    );

    // 3. Generation with tracing
    logger.log('Starting LLM streaming...');
    const handler = this.llmService.getHandler();

    if (!this.llmService.stream) {
      throw new Error('Streaming is not supported by the LLM service adapter');
    }

    return this.llmService
      .stream(prompt, {
        runName: 'RAG_SEO_Streaming_UseCase',
        callbacks: [handler],
      })
      .pipe(
        finalize(() => {
          logger.log('Streaming process finished');
          // Automatic flushing and potentially scoring can be added here if needed
          this.llmService.flush().catch((err) => {
            console.error('Failed to flush LLM service:', err);
          });
        }),
      );
  }
}
