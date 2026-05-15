import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MessageEvent, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { of, throwError } from 'rxjs';

describe('AiController', () => {
  let controller: AiController;
  let service: jest.Mocked<AiService>;

  beforeEach(async () => {
    const mockService = {
      streamSeoFromFlowise: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get(AiService);
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
      return res as Response;
    };

    it('should throw HttpException if validation fails', () => {
      const res = mockResponse();
      const invalidDto = { ...dto, product_name: '' };

      expect(() => controller.generateSeo(invalidDto, res)).toThrow(
        HttpException,
      );
      expect(() => controller.generateSeo(invalidDto, res)).toThrow(
        'Missing required fields',
      );
    });

    it('should setup SSE headers and subscribe to service stream', () => {
      /* eslint-disable @typescript-eslint/unbound-method */
      const res = mockResponse();
      const mockEvent = { data: 'test data' };
      service.streamSeoFromFlowise.mockReturnValue(
        of(mockEvent as MessageEvent),
      );

      controller.generateSeo(dto, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(service.streamSeoFromFlowise).toHaveBeenCalledWith(dto);
      expect(res.write).toHaveBeenCalledWith(
        `data: ${String(mockEvent.data)}\n\n`,
      );
      expect(res.end).toHaveBeenCalled();
      /* eslint-enable @typescript-eslint/unbound-method */
    });

    it('should handle stream errors', () => {
      /* eslint-disable @typescript-eslint/unbound-method */
      const res = mockResponse();
      const errorMessage = 'Stream failure';
      service.streamSeoFromFlowise.mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      controller.generateSeo(dto, res);

      expect(res.write).toHaveBeenCalledWith(
        `data: {"error": "${errorMessage}"}\n\n`,
      );
      expect(res.end).toHaveBeenCalled();
      /* eslint-enable @typescript-eslint/unbound-method */
    });
  });
});
