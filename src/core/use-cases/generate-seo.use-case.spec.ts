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
  let mockHandler: any;

  beforeEach(() => {
    vectorStore = {
      similaritySearch: jest.fn(),
      addDocuments: jest.fn(),
    } as any;

    promptProvider = {
      getPrompt: jest.fn(),
    } as any;

    mockHandler = {
      traceId: 'test-trace-id',
      observationId: 'test-observation-id',
    };

    llmService = {
      generate: jest.fn(),
      getHandler: jest.fn().mockReturnValue(mockHandler),
      score: jest.fn(),
      flush: jest.fn(),
    } as any;

    useCase = new GenerateSeoUseCase(vectorStore, promptProvider, llmService);
  });

  const product: Product = {
    name: 'Test Product',
    category: 'test-category',
  };

  it('should generate SEO and score 1 for valid JSON', async () => {
    vectorStore.similaritySearch.mockResolvedValue([{ pageContent: 'context info', metadata: {} }]);
    promptProvider.getPrompt.mockResolvedValue('rendered prompt');
    llmService.generate.mockResolvedValue({ content: '{"seo": "description"}' } as any);

    const result = await useCase.execute(product);

    expect(vectorStore.similaritySearch).toHaveBeenCalledWith('test-category', 2);
    expect(llmService.score).toHaveBeenCalledWith(expect.objectContaining({
      name: 'valid_json',
      value: 1,
    }));
    expect(result).toBeDefined();
  });

  it('should handle markdown wrapped JSON', async () => {
    vectorStore.similaritySearch.mockResolvedValue([]);
    promptProvider.getPrompt.mockResolvedValue('rendered prompt');
    llmService.generate.mockResolvedValue({ content: '```json\n{"seo": "description"}\n```' } as any);

    await useCase.execute(product);

    expect(llmService.score).toHaveBeenCalledWith(expect.objectContaining({
      name: 'valid_json',
      value: 1,
    }));
  });

  it('should score 0 for invalid JSON', async () => {
    vectorStore.similaritySearch.mockResolvedValue([]);
    promptProvider.getPrompt.mockResolvedValue('rendered prompt');
    llmService.generate.mockResolvedValue({ content: 'invalid json' } as any);

    await useCase.execute(product);

    expect(llmService.score).toHaveBeenCalledWith(expect.objectContaining({
      name: 'valid_json',
      value: 0,
    }));
  });

  it('should handle missing traceId gracefully', async () => {
    mockHandler.traceId = undefined;
    vectorStore.similaritySearch.mockResolvedValue([]);
    promptProvider.getPrompt.mockResolvedValue('rendered prompt');
    llmService.generate.mockResolvedValue({ content: '{"ok": true}' } as any);

    await useCase.execute(product);

    expect(llmService.score).not.toHaveBeenCalled();
  });
});
