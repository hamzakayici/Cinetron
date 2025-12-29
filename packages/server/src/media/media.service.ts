import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as Minio from 'minio';
import * as path from 'path';
import * as fs from 'fs';
import { TmdbService } from './tmdb.service';
import { Media } from './media.entity';

// Define supported video extensions
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

import { WatchHistory } from './watch-history.entity';
import { Favorite } from '../users/favorite.entity';

@Injectable()
export class MediaService implements OnModuleInit {
    private readonly logger = new Logger(MediaService.name);
    // Local media path
    private readonly mediaPath = process.env.MEDIA_PATH || '/app/media';

    // MinIO Configuration
    private minioClient: Minio.Client;
    private publicMinioClient: Minio.Client; // Used for generating presigned URLs with external host
    private readonly minioBucket = process.env.MINIO_BUCKET || 'default';

    constructor(
        @InjectRepository(Media)
        private mediaRepository: Repository<Media>,
        @InjectRepository(Episode)
        private episodeRepository: Repository<Episode>,
        @InjectRepository(WatchHistory)
        private historyRepository: Repository<WatchHistory>,
        @InjectRepository(Favorite)
        private favoriteRepository: Repository<Favorite>,
        @InjectQueue('media') private mediaQueue: Queue,
        private readonly tmdbService: TmdbService,
    ) {
        this.initializeMinio();
    }

// ... existing setup ...

    async seedMockData() {
        const testTitle = "Big Buck Bunny";
        const exists = await this.mediaRepository.findOneBy({ title: testTitle });
        if (!exists) {
            this.logger.log(`Seeding test video: ${testTitle}`);
            const media = this.mediaRepository.create({
                title: testTitle,
                year: 2008,
                overview: "A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.",
                filePath: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                type: 'movie',
                posterUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg",
                backdropUrl: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217",
                processed: true
            });
            await this.mediaRepository.save(media);
        }

        const seriesTitle = "Ezel";
        const seriesExists = await this.mediaRepository.findOneBy({ title: seriesTitle });
        if (!seriesExists) {
            this.logger.log(`Seeding test series: ${seriesTitle}`);
            const series = this.mediaRepository.create({
                title: seriesTitle,
                year: 2009,
                overview: "Ömer, sevdiği kadın Eyşan ve en yakın arkadaşları Cengiz ve Ali tarafından ihanete uğrar. Hapiste geçirdiği yıllardan sonra estetik ameliyatla yüzünü değiştirip 'Ezel' olarak geri döner ve intikam planını devreye sokar.",
                filePath: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", // Placeholder video
                type: 'series',
                // Using placeholder so metadata enhancer fetches real data from TMDB
                posterUrl: `https://placehold.co/400x600/1a1a1a/ffffff?text=${encodeURIComponent(seriesTitle)}`,
                backdropUrl: `https://placehold.co/1920x1080/1a1a1a/ffffff?text=${encodeURIComponent(seriesTitle)}`,
                processed: true
            });
            
            // Re-use BigBuckBunny link for now as reliable playback
            series.filePath = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; 
            
            const savedSeries = await this.mediaRepository.save(series);

            // Seed Episodes
            const episodes = [
                { s: 1, e: 1, title: 'İhanet', overview: 'Ömer bir sabah, en yakın arkadaşları Ali ve Cengiz ile sevgilisi Eyşan tarafından bir soygun suçu üzerine atılarak hapse gönderilir.' },
                { s: 1, e: 2, title: 'Şüphe', overview: 'Ezel yeni kimliğiyle intikamına başlar. İlk hedefi Cengiz ve Ali arasındaki güveni sarsmaktır.' },
                { s: 1, e: 3, title: 'Aşk', overview: 'Eyşan ile karşılaşan Ezel, eski duygularına hakim olmaya çalışır.' }
            ];

            for (const ep of episodes) {
                await this.episodeRepository.save(this.episodeRepository.create({
                    title: ep.title,
                    seasonNumber: ep.s,
                    episodeNumber: ep.e,
                    overview: ep.overview,
                    filePath: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Mock video
                    mediaId: savedSeries.id,
                    stillUrl: `https://placehold.co/1920x1080/1a1a1a/ffffff?text=S${ep.s}E${ep.e}`
                }));
            }

            // Trigger enhance immediately !
             await this.mediaQueue.add('enhance', { mediaId: savedSeries.id });
        }
    }

    /**
     * Enhances media with metadata from TMDB
     * This is a utility method that can be called during scanning or manually
     */
    async enhanceMediaMetadata(media: Media): Promise<Media> {
        try {
            if (media.type === 'movie') {
                const results = await this.tmdbService.searchMovie(media.title, media.year);
                if (results && results.length > 0) {
                    const match = results[0];
                    const details = await this.tmdbService.getMovieDetails(match.id);
                    if (details) {
                        media.overview = details.overview;
                        media.posterUrl = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
                        media.backdropUrl = `https://image.tmdb.org/t/p/original${details.backdrop_path}`;
                        await this.mediaRepository.save(media);
                        this.logger.log(`Enhanced metadata for movie: ${media.title}`);
                    }
                }
            } else if (media.type === 'tv' || media.type === 'series') {
                const results = await this.tmdbService.searchTvShow(media.title, media.year);
                if (results && results.length > 0) {
                    const match = results[0];
                    const details = await this.tmdbService.getTvShowDetails(match.id);
                    if (details) {
                        media.overview = details.overview;
                        media.posterUrl = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
                        media.backdropUrl = `https://image.tmdb.org/t/p/original${details.backdrop_path}`;
                        await this.mediaRepository.save(media);
                        this.logger.log(`Enhanced metadata for series: ${media.title}`);
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Failed to enhance metadata for ${media.title}`, error);
        }
        return media;
    }

    async scanLibrary(): Promise<{ message: string, added: number, details?: any }> {
        let addedCount = 0;
        let messages = [];

        // MinIO-Only Scan Strategy
        // We no longer scan local directory /app/media as per user request (Cloud Native approach)

        let minioStats = { found: 0, added: 0 };
        if (this.minioClient) {
            try {
                // Ensure bucket exists before scanning to be safe
                await this.ensureBucketExists();

                minioStats = await this.scanMinio();
                addedCount += minioStats.added;
                messages.push(`MinIO (${this.minioBucket}): Found ${minioStats.found}, Added ${minioStats.added}`);
            } catch (err) {
                this.logger.error('MinIO scan failed', err);
                messages.push(`MinIO scan failed: ${err.message}`);
            }
        } else {
            messages.push('MinIO client not verified');
        }

        return { message: messages.join(' | '), added: addedCount, details: minioStats };
    }

    private async scanMinio(): Promise<{ found: number, added: number }> {
        return new Promise((resolve, reject) => {
            if (!this.minioClient) {
                return resolve({ found: 0, added: 0 });
            }

            const bucket = this.minioBucket;
            const objects: any[] = [];
            const listStream = this.minioClient.listObjects(bucket, '', true);

            listStream.on('data', (obj) => objects.push(obj));
            listStream.on('error', (err) => reject(err));

            listStream.on('end', async () => {
                let added = 0;
                let found = 0;
                const activeFilePaths = new Set<string>();

                for (const obj of objects) {
                    const name = obj.name || obj.key;
                    if (!name) continue;

                    const ext = path.extname(name).toLowerCase();
                    if (!VIDEO_EXTENSIONS.includes(ext)) continue;

                    found++;
                    const filePath = `minio:${bucket}:${name}`;
                    activeFilePaths.add(filePath); // Track active files

                    const exists = await this.mediaRepository.findOne({ where: { filePath } });

                    if (!exists) {
                        const fileName = path.basename(name);
                        const { title, year } = this.parseFileName(fileName);

                        const newMedia = this.mediaRepository.create({
                            title,
                            year,
                            filePath,
                            originalFileName: name,
                            type: 'movie',
                            posterUrl: `https://placehold.co/400x600/1a1a1a/ffffff?text=${encodeURIComponent(title)}`,
                            overview: '', // Leave empty, will be filled by metadata worker
                            processed: true
                        });
                        const savedMedia = await this.mediaRepository.save(newMedia);

                        if (savedMedia) {
                            await this.mediaQueue.add('enhance', { mediaId: savedMedia.id });
                        }
                        this.logger.log(`Dispatched metadata job for: ${name}`);

                        added++;
                    } else {
                        // Check if existing media needs metadata enhancement
                        if (!exists.overview || exists.overview.startsWith('Auto-detected') || !exists.posterUrl || exists.posterUrl.includes('placehold.co')) {
                            this.logger.log(`Re-queueing metadata enhancement for: ${exists.title}`);
                            await this.mediaQueue.add('enhance', { mediaId: exists.id });
                        }
                    }
                }

                // Cleanup Orphans: Delete DB records that are NOT in MinIO anymore
                const allMedia = await this.mediaRepository.find();
                let deletedCount = 0;

                for (const media of allMedia) {
                    const isMinio = media.filePath.startsWith('minio:');
                    const isLegacyMock = media.filePath.startsWith('/mock/'); // Identify old seed data

                    // If it's a minio file but not in active paths OR if it's legacy mock data
                    if ((isMinio && !activeFilePaths.has(media.filePath)) || isLegacyMock) {
                        this.logger.log(`Removing orphaned/legacy media: ${media.title} (${media.filePath})`);
                        await this.mediaRepository.remove(media);
                        deletedCount++;
                    }
                }

                if (deletedCount > 0) {
                    this.logger.log(`Cleanup complete. Removed ${deletedCount} orphaned items.`);
                }

                resolve({ found, added });
            });
        });
    }

    // Recursive file walker
    private getFiles(dir: string, files_: string[] = []): string[] {
        if (!fs.existsSync(dir)) return [];
        const files = fs.readdirSync(dir);
        for (const i in files) {
            const name = path.join(dir, files[i]);
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

    async getProgress(userId: string, mediaId: string): Promise<number> {
        const history = await this.historyRepository.findOne({
            where: { userId, mediaId }
        });
        return history ? history.progressSeconds : 0;
    }

    async saveProgress(userId: string, mediaId: string, progressSeconds: number) {
        let history = await this.historyRepository.findOne({
            where: { userId, mediaId }
        });

        if (history) {
            history.progressSeconds = progressSeconds;
            history.lastWatchedAt = new Date();
        } else {
            history = this.historyRepository.create({
                userId,
                mediaId,
                progressSeconds,
                lastWatchedAt: new Date()
            });
        }
        return this.historyRepository.save(history);
    }

    async getHistory(userId: string): Promise<Media[]> {
        const history = await this.historyRepository.find({
            where: { userId },
            relations: ['media'],
            order: { lastWatchedAt: 'DESC' },
            take: 50 // Limit history
        });
        return history.map(h => h.media).filter(m => !!m);
    }

    async getFavorites(userId: string): Promise<Media[]> {
        const favorites = await this.favoriteRepository.find({
            where: { userId },
            relations: ['media'],
            order: { createdAt: 'DESC' }
        });
        return favorites.map(f => f.media).filter(f => !!f);
    }

    async addFavorite(userId: string, mediaId: string) {
        const exists = await this.favoriteRepository.findOne({ where: { userId, mediaId } });
        if (exists) return exists;

        const fav = this.favoriteRepository.create({ userId, mediaId });
        return this.favoriteRepository.save(fav);
    }

    async removeFavorite(userId: string, mediaId: string) {
        return this.favoriteRepository.delete({ userId, mediaId });
    }

    async checkFavorite(userId: string, mediaId: string): Promise<boolean> {
        const count = await this.favoriteRepository.count({ where: { userId, mediaId } });
        return count > 0;
    }
}
