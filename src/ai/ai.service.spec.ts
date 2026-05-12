import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { GenerateSeoUseCase } from '../core/use-cases/generate-seo.use-case';
import { LlmServiceAdapter } from '../infrastructure/llm/llm-service.adapter';
import { VectorStoreService } from '../vector-store/vector-store.service';

describe('AiService', () => {
  let service: AiService;
  let generateSeoUseCase: jest.Mocked<GenerateSeoUseCase>;
  let llmService: jest.Mocked<LlmServiceAdapter>;
  let vectorStoreService: jest.Mocked<VectorStoreService>;

  beforeEach(async () => {
    generateSeoUseCase = {
      execute: jest.fn(),
    } as any;

    llmService = {
      flush: jest.fn(),
    } as any;

    vectorStoreService = {
      addDocuments: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: GenerateSeoUseCase, useValue: generateSeoUseCase },
        { provide: LlmServiceAdapter, useValue: llmService },
        { provide: VectorStoreService, useValue: vectorStoreService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
