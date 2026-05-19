import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { of, throwError } from 'rxjs';
import { GenerateSeoUseCase } from '../core/use-cases/generate-seo.use-case';
import { getQueueToken } from '@nestjs/bullmq';

describe('AiController', () => {
  let controller: AiController;
  let useCase: jest.Mocked<GenerateSeoUseCase>;
  let queue: any;

  beforeEach(async () => {
    const mockUseCase = {
      executeStream: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: GenerateSeoUseCase,
          useValue: mockUseCase,
        },
        {
          provide: getQueueToken('seo-generation'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    useCase = module.get(GenerateSeoUseCase);
    queue = module.get(getQueueToken('seo-generation'));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateSeo', () => {
    const dto = {
      product_name: 'Test Product',
      category: 'Test Category',
      keywords: 'test, keywords',
    };

    const mockResponse = () => {
      const res: Partial<Response> = {};
      res.setHeader = jest.fn().mockReturnValue(res);
      res.status = jest.fn().mockReturnValue(res);
      res.write = jest.fn().mockReturnValue(true);
      res.end = jest.fn().mockReturnValue(res);
      res.on = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res as Response;
    };

    it('should setup SSE headers and subscribe to use case stream', async () => {
      /* eslint-disable @typescript-eslint/unbound-method */
      const res = mockResponse();
      const mockChunk = 'test data';
      useCase.executeStream.mockResolvedValue(of(mockChunk));

      await controller.generateSeo(dto, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(useCase.executeStream).toHaveBeenCalledWith({
        name: dto.product_name,
        category: dto.category,
      });
      expect(res.write).toHaveBeenCalledWith(`data: ${mockChunk}\n\n`);
      expect(res.end).toHaveBeenCalled();
      /* eslint-enable @typescript-eslint/unbound-method */
    });

    it('should handle background generation', async () => {
      /* eslint-disable @typescript-eslint/unbound-method */
      const res = mockResponse();
      const backgroundDto = { ...dto, background: true };
      queue.add.mockResolvedValue({ id: 'job-id' });

      await controller.generateSeo(backgroundDto, res);

      expect(queue.add).toHaveBeenCalledWith('generate', backgroundDto);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED);
      expect(res.json).toHaveBeenCalledWith({
        jobId: 'job-id',
        message: 'SEO generation task started in background',
      });
      /* eslint-enable @typescript-eslint/unbound-method */
    });

    it('should handle stream errors', async () => {
      /* eslint-disable @typescript-eslint/unbound-method */
      const res = mockResponse();
      const errorMessage = 'Stream failure';
      useCase.executeStream.mockResolvedValue(
        throwError(() => new Error(errorMessage)),
      );

      await controller.generateSeo(dto, res);

      expect(res.write).toHaveBeenCalledWith(
        `data: {"error": "${errorMessage}"}\n\n`,
      );
      expect(res.end).toHaveBeenCalled();
      /* eslint-enable @typescript-eslint/unbound-method */
    });
  });
});
