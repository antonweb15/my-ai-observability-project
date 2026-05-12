import { CallbackHandler } from 'langfuse-langchain';
import { GenerateSeoUseCase } from './generate-seo.use-case';
import { IVectorStore } from '../ports/vector-store.port';
import { IPromptProvider } from '../ports/prompt-provider.port';
import { ILlmService } from '../ports/llm-service.port';
import { Product } from '../entities/seo.entity';

describe('GenerateSeoUseCase', () => {
  let useCase: GenerateSeoUseCase;
  let vectorStore: jest.Mocked<IVectorStore>;
  let promptProvider: jest.Mocked<IPromptProvider>;
  let llmService: jest.Mocked<ILlmService>;
  let mockHandler: jest.Mocked<CallbackHandler>;

  beforeEach(() => {
    vectorStore = {
      similaritySearch: jest.fn(),
      addDocuments: jest.fn(),
    };

    promptProvider = {
      getPrompt: jest.fn(),
    };

    mockHandler = {
      traceId: 'test-trace-id',
      observationId: 'test-observation-id',
      getLangchainRunId: jest.fn(),
    } as unknown as jest.Mocked<CallbackHandler>;

    llmService = {
      generate: jest.fn(),
      getHandler: jest.fn().mockReturnValue(mockHandler),
      score: jest.fn(),
      flush: jest.fn(),
    };

    useCase = new GenerateSeoUseCase(vectorStore, promptProvider, llmService);
  });

  const product: Product = {
    name: 'Test Product',
    category: 'test-category',
  };

  it('should generate SEO and score 1 for valid JSON', async () => {
    /* eslint-disable @typescript-eslint/unbound-method */
    vectorStore.similaritySearch.mockResolvedValue([
      { pageContent: 'context info', metadata: {} },
    ]);
    promptProvider.getPrompt.mockResolvedValue('rendered prompt');
    llmService.generate.mockResolvedValue({
      content: '{"seo": "description"}',
    });

    const result = await useCase.execute(product);

    expect(vectorStore.similaritySearch).toHaveBeenCalledWith(
      'test-category',
      2,
    );
    expect(llmService.score).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'valid_json',
        value: 1,
      }),
    );
    expect(result).toBeDefined();
    /* eslint-enable @typescript-eslint/unbound-method */
  });

  it('should handle markdown wrapped JSON', async () => {
    /* eslint-disable @typescript-eslint/unbound-method */
    vectorStore.similaritySearch.mockResolvedValue([]);
    promptProvider.getPrompt.mockResolvedValue('rendered prompt');
    llmService.generate.mockResolvedValue({
      content: '```json\n{"seo": "description"}\n```',
    });

    await useCase.execute(product);

    expect(llmService.score).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'valid_json',
        value: 1,
      }),
    );
    /* eslint-enable @typescript-eslint/unbound-method */
  });

  it('should score 0 for invalid JSON', async () => {
    /* eslint-disable @typescript-eslint/unbound-method */
    vectorStore.similaritySearch.mockResolvedValue([]);
    promptProvider.getPrompt.mockResolvedValue('rendered prompt');
    llmService.generate.mockResolvedValue('invalid json');

    await useCase.execute(product);

    expect(llmService.score).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'valid_json',
        value: 0,
      }),
    );
    /* eslint-enable @typescript-eslint/unbound-method */
  });

  it('should handle missing traceId gracefully', async () => {
    /* eslint-disable @typescript-eslint/unbound-method */
    Object.defineProperty(mockHandler, 'traceId', {
      value: undefined,
      writable: true,
    });
    vectorStore.similaritySearch.mockResolvedValue([]);
    promptProvider.getPrompt.mockResolvedValue('rendered prompt');
    llmService.generate.mockResolvedValue({
      content: '{"ok": true}',
    });

    await useCase.execute(product);

    expect(llmService.score).not.toHaveBeenCalled();
    /* eslint-enable @typescript-eslint/unbound-method */
  });
});
