import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { MediaService } from './media.service';
import { Media } from './media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Processor('media')
export class MediaProcessor extends WorkerHost {
    private readonly logger = new Logger(MediaProcessor.name);

    constructor(
        private readonly mediaService: MediaService,
        @InjectRepository(Media)
        private readonly mediaRepository: Repository<Media>,
    ) {
        super();
    }

    async process(job: Job<{ mediaId: string }>): Promise<any> {
        this.logger.debug(`Processing job ${job.name} for media ${job.data.mediaId}`);

        switch (job.name) {
            case 'enhance':
                return this.handleEnhance(job.data.mediaId);
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleEnhance(mediaId: string) {
        const media = await this.mediaRepository.findOneBy({ id: mediaId });
        if (!media) {
            this.logger.error(`Media not found for enhancement: ${mediaId}`);
            return;
        }

        this.logger.log(`Enhancing metadata for: ${media.title}`);
        await this.mediaService.enhanceMediaMetadata(media);
    }
}
