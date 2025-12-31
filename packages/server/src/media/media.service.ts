import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { TmdbService } from './tmdb.service';
import { Media } from './media.entity';
import { Episode } from './episode.entity';
import { WatchHistory } from './watch-history.entity';
import { Favorite } from '../users/favorite.entity';
import { Subtitle } from './subtitle.entity';

// Define supported video extensions
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

@Injectable()
export class MediaService implements OnModuleInit {
    private readonly logger = new Logger(MediaService.name);

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
        private readonly tmdbService: TmdbService,
    ) {}

    async onModuleInit() {
        this.logger.log('MediaService initialized');
        await this.seedMockData();
    }

    async findAll(): Promise<Media[]> {
        return this.mediaRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<Media & { playbackUrl?: string }> {
        const media = await this.mediaRepository.findOne({ where: { id } });
        if (!media) return null;

        // For local files, use direct path
        const result: any = { ...media };
        if (media.filePath) {
            // Check if it is an external MKV link
            if (media.filePath.startsWith('http') && media.filePath.toLowerCase().includes('.mkv')) {
                 // Return relative proxy URL
                 result.playbackUrl = `/media/stream/external?url=${encodeURIComponent(media.filePath)}`;
            } else {
                 result.playbackUrl = media.filePath;
            }
        }
        return result;
    }

    async streamExternal(url: string, res: any) {
        if (!url) {
            res.status(400).send('URL required');
            return;
        }

        const { spawn } = require('child_process');
        
        res.header('Content-Type', 'video/mp4');

        // FFmpeg command to remux to fragmented MP4
        const ffmpeg = spawn('ffmpeg', [
            '-i', url,
            '-c:v', 'copy', // Try copy first for speed
            '-c:a', 'aac',  // Ensure audio is AAC (browser compatible)
            '-f', 'mp4',
            '-movflags', 'frag_keyframe+empty_moov',
            'pipe:1'
        ]);

        ffmpeg.stderr.on('data', (data) => {
            // Optional: log stderr for debugging implementation
            // this.logger.debug(`FFmpeg stderr: ${data}`);
        });

        ffmpeg.stdout.pipe(res);

        res.on('close', () => {
            ffmpeg.kill();
        });
    }

    async getEpisode(id: string): Promise<Episode & { playbackUrl?: string }> {
        const episode = await this.episodeRepository.findOne({ where: { id } });
        if (!episode) return null;

        const result: any = { ...episode };
        if (episode.filePath) {
            result.playbackUrl = episode.filePath;
        }
        return result;
    }

    async seedMockData() {
        this.logger.log('Seeding mock data...');
        const mockMediaData = [
            {
                title: 'Test Link MP4 (Big Buck Bunny)',
                type: 'movie',
                year: 2008,
                overview: 'Test video streamed directly from URL (MP4).',
                posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
                backdropUrl: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217',
                filePath: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                genres: ['Animation', 'Test'],
            },
            {
                title: 'Test Link MKV (Proxy)',
                type: 'movie',
                year: 2024,
                overview: 'Test video streamed via backend proxy (MKV -> MP4).',
                posterUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
                backdropUrl: '',
                filePath: 'http://127.0.0.1:3000/files/uploads/videos/test_local.mkv',
                genres: ['Test', 'Proxy'],
            },
            {
                title: 'Test Local Video',
                type: 'movie',
                year: 2024,
                overview: 'Test video served from local filesystem.',
                posterUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
                backdropUrl: '',
                filePath: '/files/uploads/videos/test_local.mp4',
                genres: ['Test', 'Local'],
            },
            {
                title: 'The Shawshank Redemption',
                type: 'movie',
                year: 1994,
                overview: 'Two imprisoned men bond over several years, finding solace and eventual redemption.',
                posterUrl: 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
                backdropUrl: 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
                filePath: '/files/uploads/videos/shawshank.mp4',
                genres: ['Drama', 'Crime'],
            }
        ];

        for (const data of mockMediaData) {
            const exists = await this.mediaRepository.findOne({ where: { title: data.title } });
            if (!exists) {
                await this.mediaRepository.save(data);
                this.logger.log(`Seeded: ${data.title}`);
            }
        }
        this.logger.log('Seeding verification complete.');
    }

    async enhanceMediaMetadata(media: Media): Promise<Media> {
        try {
            // Search for media in TMDB
            if (!media.title || !media.type) return media;

            const type = media.type === 'series' || media.type === 'tv' ? 'tv' : 'movie';
            let results;

            if (type === 'movie') {
                results = await this.tmdbService.searchMovie(media.title, media.year);
            } else {
                results = await this.tmdbService.searchTvShow(media.title, media.year);
            }

            if (results && results.length > 0) {
                const match = results[0];
                
                // Get full details to extract genres
                let details;
                if (type === 'movie') {
                    details = await this.tmdbService.getMovieDetails(match.id);
                } else {
                    details = await this.tmdbService.getTvShowDetails(match.id);
                }

                // Update media with TMDB data
                media.overview = match.overview || media.overview;
                media.year = match.release_date ? new Date(match.release_date).getFullYear() : 
                             match.first_air_date ? new Date(match.first_air_date).getFullYear() : 
                             media.year;
                media.posterUrl = match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : media.posterUrl;
                media.backdropUrl = match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : media.backdropUrl;

                if (details && details.genres) {
                    media.genres = details.genres.map((g: any) => g.name);
                }

                await this.mediaRepository.save(media);
                this.logger.log(`Enhanced metadata for: ${media.title}`);
            }
        } catch (error) {
            this.logger.error(`Failed to enhance metadata for ${media.title}`, error);
        }

        return media;
    }

    async scanLibrary(): Promise<{ message: string, added: number, details?: any }> {
        this.logger.log('Library scan requested');
        return {
            message: 'Kütüphane taraması henüz uygulanmadı - yönetici yükleme arayüzünü kullanın',
            added: 0,
        };
    }

    // Watch progress and history
    async getProgress(userId: string, mediaId: string): Promise<number> {
        const history = await this.historyRepository.findOne({ where: { userId, mediaId } });
        return history?.progressSeconds || 0;
    }

    async saveProgress(userId: string, mediaId: string, progressSeconds: number) {
        let history = await this.historyRepository.findOne({ where: { userId, mediaId } });

        if (history) {
            history.progressSeconds = progressSeconds;
            history.lastWatchedAt = new Date();
        } else {
            history = this.historyRepository.create({
                userId,
                mediaId,
                progressSeconds,
            });
        }

        return this.historyRepository.save(history);
    }

    async getHistory(userId: string): Promise<Media[]> {
        const history = await this.historyRepository.find({
            where: { userId },
            order: { lastWatchedAt: 'DESC' },
            take: 20,
        });

        return Promise.all(history.map(async (h) => {
            const media = await this.mediaRepository.findOne({ where: { id: h.mediaId } });
            return media;
        }));
    }

    // Favorites
    async getFavorites(userId: string): Promise<Media[]> {
        const favorites = await this.favoriteRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });

        return Promise.all(favorites.map(async (f) => {
            return this.mediaRepository.findOne({ where: { id: f.mediaId } });
        }));
    }

    async addFavorite(userId: string, mediaId: string) {
        const existing = await this.favoriteRepository.findOne({ where: { userId, mediaId } });
        if (existing) return { message: 'Favorilerde zaten mevcut' };

        const favorite = this.favoriteRepository.create({ userId, mediaId });
        await this.favoriteRepository.save(favorite);
        return { message: 'Favorilere eklendi' };
    }

    async removeFavorite(userId: string, mediaId: string) {
        await this.favoriteRepository.delete({ userId, mediaId });
        return { message: 'Favorilerden çıkarıldı' };
    }

    async checkFavorite(userId: string, mediaId: string): Promise<boolean> {
        const count = await this.favoriteRepository.count({ where: { userId, mediaId } });
        return count > 0;
    }

    async searchTMDB(query: string, type: 'movie' | 'tv' | 'all', year?: number) {
        // Check if query looks like an IMDB ID (e.g. tt1234567)
        if (query.startsWith('tt')) {
            return this.tmdbService.findByExternalId(query);
        }

        // Combined search - both movies and TV shows
        if (type === 'all') {
            const [movies, tvShows] = await Promise.all([
                this.tmdbService.searchMovie(query, year),
                this.tmdbService.searchTvShow(query, year),
            ]);

            // Tag results with their type and merge
            const taggedMovies = (movies || []).map((m: any) => ({ ...m, media_type: 'movie' }));
            const taggedTv = (tvShows || []).map((t: any) => ({ ...t, media_type: 'tv' }));
            
            // Combine and sort by popularity
            const combined = [...taggedMovies, ...taggedTv].sort((a, b) => 
                (b.popularity || 0) - (a.popularity || 0)
            );
            
            return combined.slice(0, 20);
        }

        if (type === 'movie') {
            return this.tmdbService.searchMovie(query, year);
        } else {
            return this.tmdbService.searchTvShow(query, year);
        }
    }

    async getTMDBDetails(tmdbId: number, type: 'movie' | 'tv') {
        try {
            let details;
            if (type === 'movie') {
                details = await this.tmdbService.getMovieDetails(tmdbId);
            } else {
                details = await this.tmdbService.getTvShowDetails(tmdbId);
            }

            if (!details) {
                return null;
            }

            // Format response with all needed metadata
            const credits = type === 'movie' ? details.credits : details.aggregate_credits;
            const cast = credits?.cast?.slice(0, 10).map((actor: any) => ({
                name: actor.name,
                character: type === 'movie' ? actor.character : actor.roles?.[0]?.character || '',
                profile_path: actor.profile_path
            })) || [];

            const director = credits?.crew?.find((member: any) => member.job === 'Director')?.name || '';

            return {
                tmdbId: details.id,
                title: details.title || details.name,
                originalTitle: details.original_title || details.original_name,
                overview: details.overview,
                releaseDate: details.release_date || details.first_air_date,
                runtime: details.runtime || details.episode_run_time?.[0],
                genres: details.genres?.map((g: any) => g.name) || [],
                cast,
                director,
                posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
                backdropUrl: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : null,
                seasons: details.seasons || [], // Include seasons for TV shows
            };
        } catch (error) {
            this.logger.error(`Failed to get TMDB details for ${tmdbId}`, error);
            return null;
        }
    }

    async getTMDBSeasonDetails(tvId: number, seasonNumber: number) {
        try {
            const seasonData = await this.tmdbService.getSeasonDetails(tvId, seasonNumber);
            if (!seasonData) {
                return null;
            }

            // Format episodes
            const episodes = seasonData.episodes?.map((ep: any) => ({
                episodeNumber: ep.episode_number,
                name: ep.name,
                overview: ep.overview,
                stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
                airDate: ep.air_date,
                runtime: ep.runtime,
            })) || [];

            return {
                seasonNumber: seasonData.season_number,
                name: seasonData.name,
                overview: seasonData.overview,
                episodes,
            };
        } catch (error) {
            this.logger.error(`Failed to get season ${seasonNumber} for TV ${tvId}`, error);
            return null;
        }
    }

    // Admin CRUD Methods
    async createMedia(dto: any, files: any): Promise<Media> {
        const media = this.mediaRepository.create({
            title: dto.title,
            type: dto.type,
            year: dto.year ? parseInt(dto.year) : undefined,
            overview: dto.overview,
            filePath: '', // Will be set below if applicable
        });

        // Handle file uploads - video is optional for series
        if (files.videoFile && files.videoFile[0]) {
            media.filePath = `/files/uploads/videos/${files.videoFile[0].filename}`;
        } else if (dto.videoUrl) {
            media.filePath = dto.videoUrl;
        } else if (dto.type === 'series' || dto.type === 'tv') {
            // Series don't need a video file - episodes will have videos
            media.filePath = null;
        }

        // Poster
        if (files.posterFile && files.posterFile[0]) {
            media.posterUrl = `/files/uploads/images/${files.posterFile[0].filename}`;
        } else if (dto.posterUrl) {
            media.posterUrl = dto.posterUrl;
        }

        // Backdrop
        if (files.backdropFile && files.backdropFile[0]) {
            media.backdropUrl = `/files/uploads/images/${files.backdropFile[0].filename}`;
        } else if (dto.backdropUrl) {
            media.backdropUrl = dto.backdropUrl;
        }

        // TMDB Metadata
        if (dto.tmdbId) media.tmdbId = parseInt(dto.tmdbId);
        if (dto.director) media.director = dto.director;
        if (dto.runtime) media.runtime = parseInt(dto.runtime);
        if (dto.releaseDate) media.releaseDate = new Date(dto.releaseDate);
        if (dto.cast) {
            try {
                media.cast = typeof dto.cast === 'string' ? JSON.parse(dto.cast) : dto.cast;
            } catch (e) {
                this.logger.warn('Failed to parse cast data', e);
            }
        }
        if (dto.genres) {
            media.genres = typeof dto.genres === 'string' 
                ? dto.genres.split(',').map((g: string) => g.trim()) 
                : dto.genres;
        }

        return this.mediaRepository.save(media);
    }

    async updateMedia(id: string, dto: any, files: any): Promise<Media> {
        const media = await this.mediaRepository.findOne({ where: { id } });
        if (!media) {
            throw new Error('Medya bulunamadı');
        }

        // Update basic fields
        if (dto.title) media.title = dto.title;
        if (dto.type) media.type = dto.type;
        if (dto.year) media.year = parseInt(dto.year);
        if (dto.overview) media.overview = dto.overview;

        // Handle file uploads (only if new files provided)
        if (files.videoFile && files.videoFile[0]) {
            media.filePath = `/files/uploads/videos/${files.videoFile[0].filename}`;
        } else if (dto.videoUrl) {
            media.filePath = dto.videoUrl;
        }

        // Poster
        if (files.posterFile && files.posterFile[0]) {
            media.posterUrl = `/files/uploads/images/${files.posterFile[0].filename}`;
        } else if (dto.posterUrl) {
            media.posterUrl = dto.posterUrl;
        }

        // Backdrop
        if (files.backdropFile && files.backdropFile[0]) {
            media.backdropUrl = `/files/uploads/images/${files.backdropFile[0].filename}`;
        } else if (dto.backdropUrl) {
            media.backdropUrl = dto.backdropUrl;
        }

        return this.mediaRepository.save(media);
    }

    async deleteMedia(id: string): Promise<void> {
        const media = await this.mediaRepository.findOne({ where: { id } });
        if (!media) {
            throw new Error('Medya bulunamadı');
        }

        // TODO: Delete associated files from filesystem
        await this.mediaRepository.remove(media);
    }

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

    // Episode Management
    async createEpisode(mediaId: string, files: any, dto: any) {
        const media = await this.mediaRepository.findOne({ where: { id: mediaId } });
        if (!media) {
            throw new Error('Media not found');
        }

        const episode = this.episodeRepository.create({
            title: dto.title,
            seasonNumber: parseInt(dto.seasonNumber),
            episodeNumber: parseInt(dto.episodeNumber),
            overview: dto.overview || '',
            mediaId: mediaId,
        });

        // Handle video file upload
        if (files.videoFile && files.videoFile[0]) {
            episode.filePath = `/files/uploads/videos/${files.videoFile[0].filename}`;
        } else if (dto.videoUrl) {
            episode.filePath = dto.videoUrl;
        }

        // Handle still image (episode thumbnail)
        if (files.stillImage && files.stillImage[0]) {
            episode.stillUrl = `/files/uploads/images/${files.stillImage[0].filename}`;
        } else if (dto.stillUrl) {
            episode.stillUrl = dto.stillUrl;
        }

        return this.episodeRepository.save(episode);
    }

    async getEpisodesByMedia(mediaId: string) {
        const episodes = await this.episodeRepository.find({
            where: { mediaId },
            order: { seasonNumber: 'ASC', episodeNumber: 'ASC' }
        });

        // Group by season
        const grouped = episodes.reduce((acc, episode) => {
            const season = `Season ${episode.seasonNumber}`;
            if (!acc[season]) {
                acc[season] = [];
            }
            acc[season].push(episode);
            return acc;
        }, {});

        return grouped;
    }

    async deleteEpisode(episodeId: string) {
        const episode = await this.episodeRepository.findOne({ where: { id: episodeId } });
        if (!episode) {
            throw new Error('Episode not found');
        }

        // Delete physical video file if exists
        if (episode.filePath && episode.filePath.startsWith('/files/')) {
            const filePath = episode.filePath.replace('/files/', './public/');
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await this.episodeRepository.remove(episode);
        return { message: 'Episode deleted successfully' };
    }
}
