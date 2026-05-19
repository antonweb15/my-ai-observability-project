import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GenerateSeoUseCase } from '../core/use-cases/generate-seo.use-case';
import { Logger } from '@nestjs/common';

@Processor('seo-generation')
export class SeoProcessor extends WorkerHost {
  private readonly logger = new Logger(SeoProcessor.name);

  constructor(private readonly generateSeoUseCase: GenerateSeoUseCase) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    const { product_name, category } = job.data;

    try {
      const result = await this.generateSeoUseCase.execute({
        name: product_name,
        category: category,
      });

      this.logger.log(`Job ${job.id} completed successfully`);
      return result;
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}
