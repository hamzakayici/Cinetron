import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './media.entity';
import * as fs from 'fs';
import * as path from 'path';

// Define supported video extensions
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);
    // This path matches the volume mount in docker-compose: /app/media
    private readonly mediaPath = process.env.MEDIA_PATH || '/app/media';

    constructor(
        @InjectRepository(Media)
        private mediaRepository: Repository<Media>,
    ) { }

    findAll(): Promise<Media[]> {
        return this.mediaRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async scanDirectory(): Promise<{ message: string, added: number }> {
        this.logger.log(`Scanning directory: ${this.mediaPath}`);

        if (!fs.existsSync(this.mediaPath)) {
            this.logger.warn(`Media directory not found: ${this.mediaPath}`);
            return { message: 'Media directory not found', added: 0 };
        }

        const files = this.getFiles(this.mediaPath);
        let addedCount = 0;

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (!VIDEO_EXTENSIONS.includes(ext)) {
                continue;
            }

            const fileName = path.basename(file);
            const exists = await this.mediaRepository.findOne({ where: { filePath: file } });

            if (!exists) {
                // Simple parser: "Movie Name (2023).mp4" -> Title: "Movie Name", Year: 2023
                const { title, year } = this.parseFileName(fileName);

                const newMedia = this.mediaRepository.create({
                    title: title,
                    year: year,
                    filePath: file,
                    originalFileName: fileName,
                    type: 'movie',
                    // Temporary placeholder until worker fetches real data
                    posterUrl: `https://placehold.co/400x600/1a1a1a/ffffff?text=${encodeURIComponent(title)}`,
                    overview: `Auto-detected from file: ${fileName}`,
                    processed: true
                });

                await this.mediaRepository.save(newMedia);
                addedCount++;
                this.logger.log(`Added new media: ${title}`);
            }
        }

        return { message: 'Scan complete', added: addedCount };
    }

    // Recursive file walker
    private getFiles(dir: string, files_: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        for (const i in files) {
            const name = dir + '/' + files[i];
            if (fs.statSync(name).isDirectory()) {
                this.getFiles(name, files_);
            } else {
                files_.push(name);
            }
        }
        return files_;
    }

    private parseFileName(fileName: string): { title: string, year: number | null } {
        // Remove extension
        const nameWithoutExt = path.parse(fileName).name;

        // Regex to find year in parenthesis, e.g. "The Matrix (1999)"
        const yearMatch = nameWithoutExt.match(/\((\d{4})\)/);
        let year = null;
        let title = nameWithoutExt;

        if (yearMatch) {
            year = parseInt(yearMatch[1]);
            // Remove year from title
            title = nameWithoutExt.replace(/\((\d{4})\)/, '').trim();
        }

        // Clean up dots and underscores
        title = title.replace(/[._]/g, ' ').trim();

        return { title, year };
    }
}
