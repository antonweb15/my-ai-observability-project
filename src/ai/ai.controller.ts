import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { GenerateSeoUseCase } from '../core/use-cases/generate-seo.use-case';
import { GenerateSeoDto } from './dto/generate-seo.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('api')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly generateSeoUseCase: GenerateSeoUseCase,
    @InjectQueue('seo-generation') private readonly seoQueue: Queue,
  ) {}

  @Post('generate-seo')
  async generateSeo(@Body() body: GenerateSeoDto, @Res() res: Response) {
    this.logger.log(
      `Received generate-seo request for product: ${body.product_name}`,
    );

    if (body.background) {
      const job = await this.seoQueue.add('generate', body);
      return res.status(HttpStatus.ACCEPTED).json({
        jobId: job.id,
        message: 'SEO generation task started in background',
      });
    }

    // 1. Set headers for forced streaming (SSE / Chunked Transfer)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.status(HttpStatus.OK);

    // 2. Execute Use Case with streaming
    try {
      const stream$ = await this.generateSeoUseCase.executeStream({
        name: body.product_name,
        category: body.category,
      });

      const subscription = stream$.subscribe({
        next: (chunk: string) => {
          res.write(`data: ${chunk}\n\n`);
        },
        error: (error: Error) => {
          this.logger.error(`Stream error: ${error.message}`);
          res.write(`data: {"error": "${error.message}"}\n\n`);
          res.end();
        },
        complete: () => {
          this.logger.log('Stream completed successfully');
          res.end();
        },
      });

      // If the client disconnected themselves (closed tab) - unsubscribe
      res.on('close', () => {
        subscription.unsubscribe();
      });
    } catch (error: any) {
      this.logger.error(`Failed to start stream: ${error.message}`);
      res.write(`data: {"error": "${error.message}"}\n\n`);
      res.end();
    }
  }
}
