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
import { Episode } from './episode.entity';

// Define supported video extensions
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

import { WatchHistory } from './watch-history.entity';
import { Favorite } from '../users/favorite.entity';
import { Subtitle } from './subtitle.entity';

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
        @InjectRepository(Subtitle)
        private subtitleRepository: Repository<Subtitle>,
        @InjectQueue('media') private mediaQueue: Queue,
        private readonly tmdbService: TmdbService,
    ) {
        this.initializeMinio();
    }

    private initializeMinio() {
        const endPoint = process.env.MINIO_ENDPOINT || 'minio';
        const accessKey = process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY || 'minioadmin';
        const secretKey = process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY || 'minioadmin';

        // Ensure port is a number
        const port = parseInt(process.env.MINIO_API_PORT || '9000', 10);

        try {
            this.minioClient = new Minio.Client({
                endPoint,
                port,
                useSSL: false, // Default to false for internal docker network
                accessKey,
                secretKey,
            });

            // Initialize Public Client (Signer)
            // Parses MINIO_EXTERNAL_URL to config (e.g., http://localhost:9000 -> endPoint: localhost, port: 9000)
            const externalUrlStr = process.env.MINIO_EXTERNAL_URL || 'http://localhost:9000';
            try {
                // Handle cases where external URL might not have protocol for legacy reasons, though we default to http://
                const urlWithProto = externalUrlStr.includes('://') ? externalUrlStr : `http://${externalUrlStr}`;
                const parsedUrl = new URL(urlWithProto);

                this.publicMinioClient = new Minio.Client({
                    endPoint: parsedUrl.hostname,
                    port: parseInt(parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80')),
                    useSSL: parsedUrl.protocol === 'https:',
                    accessKey,
                    secretKey,
                });
                this.logger.log(`MinIO Public Signer initialized for: ${parsedUrl.hostname}:${parsedUrl.port}`);
            } catch (e) {
                this.logger.warn(`Failed to initialize public MinIO signer from ${externalUrlStr}, falling back to internal`, e);
                this.publicMinioClient = this.minioClient;
            }

            this.logger.log(`MinIO Client initialized for endpoint: ${endPoint}:${port}`);
        } catch (err) {
            this.logger.error('Failed to initialize MinIO Client', err);
        }
    }

    async onModuleInit() {
        this.logger.log('Checking for initial data seeding...');
        await this.seedMockData();
        await this.ensureBucketExists();
    }

    private async ensureBucketExists() {
        if (!this.minioClient) return;
        try {
            const exists = await this.minioClient.bucketExists(this.minioBucket);
            if (!exists) {
                await this.minioClient.makeBucket(this.minioBucket, 'us-east-1'); // Region is required but often ignored by MinIO
                this.logger.log(`Created default MinIO bucket: ${this.minioBucket}`);
            } else {
                this.logger.log(`MinIO bucket '${this.minioBucket}' already exists.`);
            }
        } catch (err) {
            this.logger.error(`Failed to ensure MinIO bucket '${this.minioBucket}' exists`, err);
        }
    }

    async findAll(): Promise<Media[]> {
        const medias = await this.mediaRepository.find({
            order: { createdAt: 'DESC' }
        });

        return Promise.all(medias.map(async (media) => {
            return media;
        }));
    }

    async findOne(id: string): Promise<Media & { playbackUrl?: string }> {
        const media = await this.mediaRepository.findOne({
            where: { id },
            relations: ['episodes'],
            order: {
                episodes: {
                    seasonNumber: 'ASC',
                    episodeNumber: 'ASC'
                }
            }
        });
        if (!media) return null;

        const result: Media & { playbackUrl?: string } = { ...media };

        if (media.filePath.startsWith('minio:')) {
            const url = await this.getPresignedUrl(media.filePath);
            if (url) {
                result.playbackUrl = url;
            }
        } else if (media.filePath.startsWith('http://') || media.filePath.startsWith('https://')) {
            result.playbackUrl = media.filePath;
        } else {
            const fileName = path.basename(media.filePath);
            result.playbackUrl = `/media/${encodeURIComponent(fileName)}`;
        }

        return result;
    }

    async getPresignedUrl(filePath: string): Promise<string | null> {
        if (!this.minioClient || !filePath.startsWith('minio:')) return null;

        try {
            const parts = filePath.split(':');
            if (parts.length < 3) return null;

            const bucket = parts[1];
            const objectName = parts.slice(2).join(':');

            // Use the PUBLIC client to generate the URL
            // This ensures the signature is calculated for the external host ("localhost")
            // and the URL itself points to the external host.
            // No string replacement needed.
            const url = await this.publicMinioClient.presignedGetObject(bucket, objectName, 3 * 60 * 60);
            return url;
        } catch (error) {
            this.logger.error(`Failed to get presigned URL for ${filePath}:`, error);
            return null;
        }
    }

    async seedMockData() {
        const testTitle = "Big Buck Bunny";
        const exists = await this.mediaRepository.findOneBy({ title: testTitle });
        if (!exists) {
            this.logger.log(`Seeding test video: ${testTitle}`);
            const media = this.mediaRepository.create({
                title: testTitle,
                year: 2008,
                overview: "A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.",
                filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
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
                filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", // Placeholder video
                type: 'series',
                // Using placeholder so metadata enhancer fetches real data from TMDB
                posterUrl: `https://placehold.co/400x600/1a1a1a/ffffff?text=${encodeURIComponent(seriesTitle)}`,
                backdropUrl: `https://placehold.co/1920x1080/1a1a1a/ffffff?text=${encodeURIComponent(seriesTitle)}`,
                processed: true
            });
            
            // Re-use BigBuckBunny link for now as reliable playback
            series.filePath = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; 
            
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
                    filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Mock video
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
    async getEpisode(id: string): Promise<Episode & { playbackUrl?: string }> {
        const episode = await this.episodeRepository.findOne({
            where: { id },
            relations: ['media']
        });
        if (!episode) return null;

        const result: Episode & { playbackUrl?: string } = { ...episode };

        if (episode.filePath.startsWith('minio:')) {
            const url = await this.getPresignedUrl(episode.filePath);
            if (url) {
                result.playbackUrl = url;
            }
        } else if (episode.filePath.startsWith('http://') || episode.filePath.startsWith('https://')) {
            result.playbackUrl = episode.filePath;
        } else {
            const fileName = path.basename(episode.filePath);
            result.playbackUrl = `/media/${encodeURIComponent(fileName)}`;
        }
        return result;
    }

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

    // Admin CRUD Methods
    async createMedia(dto: any, files: any): Promise<Media> {
        const media = this.mediaRepository.create({
            title: dto.title,
            type: dto.type,
            year: dto.year ? parseInt(dto.year) : undefined,
            overview: dto.overview,
        });

        // Handle file uploads
        if (files.videoFile && files.videoFile[0]) {
            media.filePath = `/files/uploads/videos/${files.videoFile[0].filename}`;
        }
        if (files.posterFile && files.posterFile[0]) {
            media.posterUrl = `/files/uploads/images/${files.posterFile[0].filename}`;
        }
        if (files.backdropFile && files.backdropFile[0]) {
            media.backdropUrl = `/files/uploads/images/${files.backdropFile[0].filename}`;
        }

        // Save media first
        const savedMedia = await this.mediaRepository.save(media);

        // TMDB enrichment temporarily disabled
        // Uncomment when getDetails is implemented
        /*
        if (dto.tmdbId) {
            try {
                await this.enrichMediaWithTmdb(savedMedia.id, dto.tmdbId, dto.type);
            } catch (e) {
                this.logger.warn(`Failed to fetch TMDB metadata for ${dto.tmdbId}`, e);
            }
        }
        */

        return savedMedia;
    }

    async updateMedia(id: string, dto: any, files: any): Promise<Media> {
        const media = await this.mediaRepository.findOne({ where: { id } });
        if (!media) {
            throw new Error('Media not found');
        }

        // Update basic fields
        if (dto.title) media.title = dto.title;
        if (dto.type) media.type = dto.type;
        if (dto.year) media.year = parseInt(dto.year);
        if (dto.overview) media.overview = dto.overview;

        // Handle file uploads (only if new files provided)
        if (files.videoFile && files.videoFile[0]) {
            media.filePath = `/files/uploads/videos/${files.videoFile[0].filename}`;
        }
        if (files.posterFile && files.posterFile[0]) {
            media.posterUrl = `/files/uploads/images/${files.posterFile[0].filename}`;
        }
        if (files.backdropFile && files.backdropFile[0]) {
            media.backdropUrl = `/files/uploads/images/${files.backdropFile[0].filename}`;
        }

        return this.mediaRepository.save(media);
    }

    async deleteMedia(id: string): Promise<void> {
        const media = await this.mediaRepository.findOne({ where: { id } });
        if (!media) {
            throw new Error('Media not found');
        }

        // TODO: Delete associated files from filesystem
        // This is a future enhancement for production

        await this.mediaRepository.remove(media);
    }

    // TMDB metadata enrichment - disabled for now
    // Uncomment when getDetails method is implemented in TmdbService
    /*
    private async enrichMediaWithTmdb(mediaId: string, tmdbId: string, mediaType: string): Promise<void> {
        const type = mediaType === 'series' || mediaType === 'tv' ? 'tv' : 'movie';
        const metadata = await this.tmdbService.getDetails(type, parseInt(tmdbId));

        if (metadata) {
            await this.mediaRepository.update(mediaId, {
                overview: metadata.overview || undefined,
                year: metadata.year || undefined,
                posterUrl: metadata.posterUrl || undefined,
                backdropUrl: metadata.backdropUrl || undefined,
            });
        }
    }
    */

    // Subtitle Management
    async addSubtitle(mediaId: string, filename: string, language: string, label: string) {
        const subtitle = this.subtitleRepository.create({
            mediaId,
            url: `/files/uploads/subtitles/${filename}`,
            language,
            label,
        });
        return this.subtitleRepository.save(subtitle);
    }

    async getSubtitles(mediaId: string) {
        return this.subtitleRepository.find({
            where: { mediaId },
            order: { createdAt: 'ASC' },
        });
    }

    async deleteSubtitle(subtitleId: string) {
        // TODO: Delete file from filesystem
        return this.subtitleRepository.delete(subtitleId);
    }
}
