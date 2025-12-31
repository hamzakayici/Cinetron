import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class TranscodeService {
    private readonly logger = new Logger(TranscodeService.name);

    async transcodeMedia(inputPath: string, outputDir: string, filenameBase: string): Promise<Record<string, string>> {
        // Resolve absolute paths
        // Assuming inputPath is relative like '/files/uploads/videos/video.mp4'
        // We need converting to absolute system path for ffmpeg
        const absoluteInputPath = this.resolvePath(inputPath);
        const absoluteOutputDir = this.resolvePath(outputDir); // e.g. ./public/uploads/videos

        const inputExists = fs.existsSync(absoluteInputPath);
        this.logger.log(`Starting transcoding. Input: '${inputPath}' -> Resolved: '${absoluteInputPath}' (Exists: ${inputExists})`);
        
        if (!inputExists) {
            this.logger.error(`Input file does not exist at resolved path: ${absoluteInputPath}`);
             // Try to list directory content to debug
             const dir = path.dirname(absoluteInputPath);
             try {
                const files = fs.readdirSync(dir);
                this.logger.error(`Directory contents of ${dir}: ${files.join(', ')}`);
             } catch (e) {
                this.logger.error(`Could not list directory ${dir}: ${e.message}`);
             }
        }
        
        this.logger.log(`Starting transcoding for: ${absoluteInputPath}`);
        
        const qualities = [
            { name: '1080p', height: 1080, bitrate: '4500k' },
            { name: '720p', height: 720, bitrate: '2500k' },
            { name: '480p', height: 480, bitrate: '1000k' }
        ];

        // Check source resolution first (if needed) - omitting for now to keep simple

        const results: Record<string, string> = {};

        // Process sequentially to avoid cpu overload
        for (const q of qualities) {
            try {
                const outputFilename = `${filenameBase}_${q.name}.mp4`;
                const outputPath = path.join(absoluteOutputDir, outputFilename);
                const publicUrl = `/files/uploads/videos/${outputFilename}`;

                await this.processFile(absoluteInputPath, outputPath, q.height, q.bitrate);
                
                results[q.name] = publicUrl;
                this.logger.log(`Generated ${q.name}: ${publicUrl}`);
            } catch (err) {
                this.logger.error(`Failed to generate ${q.name} for ${filenameBase}`, err);
            }
        }

        return results;
    }

    private resolvePath(relativePath: string): string {
        // Remove /files prefix if present to map to local filesystem
        // Assuming server runs in /usr/src/app and static files are in ./public
        // Map /files/uploads/videos -> ./public/uploads/videos
        
        if (relativePath.startsWith('/files')) {
            return '.' + relativePath.replace('/files', '/public');
        }
        return relativePath;
    }

    private processFile(input: string, output: string, height: number, bitrate: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if file exists
            if (!fs.existsSync(input)) {
                return reject(new Error(`Input file not found: ${input}`));
            }

            ffmpeg(input)
                .output(output)
                .videoCodec('libx264')
                .audioCodec('aac')
                .size(`?x${height}`) // Maintain aspect ratio
                .videoBitrate(bitrate)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });
    }
}
