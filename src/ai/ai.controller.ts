import {
  Controller,
  Post,
  Body,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AiService } from './ai.service';
import type { Response } from 'express';

interface GenerateSeoDto {
  product_name: string;
  category: string;
  keywords: string;
}

@Controller('api')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('generate-seo')
  generateSeo(@Body() body: GenerateSeoDto, @Res() res: Response) {
    this.logger.log(
      `Received generate-seo request for product: ${body.product_name}`,
    );

    // 1. Input validation
    if (!body.product_name || !body.category || !body.keywords) {
      this.logger.warn('Validation failed: Missing required fields');
      throw new HttpException(
        'Missing required fields: product_name, category, keywords',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Set headers for forced streaming (SSE / Chunked Transfer)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.status(HttpStatus.OK);

    // 3. Subscribe to the stream from the service
    const stream$ = this.aiService.streamSeoFromFlowise(body);

    const subscription = stream$.subscribe({
      next: (event: MessageEvent) => {
        // Send a piece of text to the client directly into the open connection
        res.write(`data: ${String(event.data)}\n\n`);
      },
      error: (error: Record<string, any>) => {
        const message = String(error?.['message'] || error);
        this.logger.error(`Stream error: ${message}`);
        res.write(`data: {"error": "${message}"}\n\n`);
        res.end();
      },
      complete: () => {
        this.logger.log('Stream completed successfully');
        // Close connection when AI finished generating
        res.end();
      },
    });

    // If the client disconnected themselves (closed tab) - unsubscribe
    res.on('close', () => {
      subscription.unsubscribe();
    });
  }
}
