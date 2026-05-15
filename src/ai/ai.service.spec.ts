import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import axios from 'axios';
import { EventEmitter } from 'events';
import { MessageEvent } from '@nestjs/common';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('streamSeoFromFlowise', () => {
    const dto = {
      product_name: 'Test Product',
      category: 'Test Category',
      keywords: 'test, keywords',
    };

    it('should stream data from Flowise SSE format', (done) => {
      const mockStream = new EventEmitter();
      mockedAxios.mockResolvedValueOnce({
        data: mockStream,
      } as any);

      const results: string[] = [];
      service.streamSeoFromFlowise(dto).subscribe({
        next: (event: MessageEvent) => {
          results.push(event.data as string);
        },
        complete: () => {
          try {
            expect(results).toEqual(['chunk1', 'chunk2']);
            done();
          } catch (e) {
            done(e);
          }
        },
        error: (err) => done(err),
      });

      // Use setImmediate to ensure the subscription is active before emitting
      setImmediate(() => {
        mockStream.emit('data', Buffer.from('data: chunk1\n'));
        mockStream.emit('data', Buffer.from('data: chunk2\n'));
        mockStream.emit('end');
      });
    });

    it('should stream raw JSON chunks from Flowise', (done) => {
      const mockStream = new EventEmitter();
      mockedAxios.mockResolvedValueOnce({
        data: mockStream,
      } as any);

      const results: string[] = [];
      service.streamSeoFromFlowise(dto).subscribe({
        next: (event: MessageEvent) => {
          results.push(event.data as string);
        },
        complete: () => {
          try {
            expect(results).toEqual([JSON.stringify({ text: 'SEO Title' })]);
            done();
          } catch (e) {
            done(e);
          }
        },
        error: (err) => done(err),
      });

      setImmediate(() => {
        mockStream.emit('data', Buffer.from(JSON.stringify({ json: { text: 'SEO Title' } })));
        mockStream.emit('end');
      });
    });

    it('should handle axios connection error', (done) => {
      mockedAxios.mockRejectedValueOnce(new Error('Network Error'));

      service.streamSeoFromFlowise(dto).subscribe({
        error: (err) => {
          expect(err.message).toContain('Flowise connection failed: Network Error');
          done();
        },
      });
    });
  });
});
