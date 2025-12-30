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
            result.playbackUrl = media.filePath;
        }
        return result;
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
        const count = await this.mediaRepository.count();
        if (count > 0) {
            this.logger.log(`Database already has ${count} media items. Skipping seed.`);
            return;
        }

        this.logger.log('Seeding mock data...');
        const mockMediaData = [
            {
                title: 'The Shawshank Redemption',
                type: 'movie',
                year: 1994,
                overview: 'Two imprisoned men bond over several years, finding solace and eventual redemption.',
                posterUrl: 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
                backdropUrl: 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
                filePath: '/files/uploads/videos/shawshank.mp4',
                genres: ['Drama', 'Crime'],
            },
            {
                title: 'The Godfather',
                type: 'movie',
                year: 1972,
                overview: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
                posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
                backdropUrl: 'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
                filePath: '/files/uploads/videos/godfather.mp4',
                genres: ['Drama', 'Crime'],
            },
            {
                title: 'Interstellar',
                type: 'movie',
                year: 2014,
                overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
                posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                backdropUrl: 'https://image.tmdb.org/t/p/original/pbrkL804c8yAv3zBZR4QPEafpAR.jpg',
                filePath: '/files/uploads/videos/interstellar.mp4',
                genres: ['Adventure', 'Drama', 'Science Fiction'],
            },
        ];

        for (const data of mockMediaData) {
            await this.mediaRepository.save(data);
        }
        this.logger.log(`Seeded ${mockMediaData.length} mock media items`);
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
            message: 'Library scan not implemented - use admin upload interface',
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
        if (existing) return { message: 'Already in favorites' };

        const favorite = this.favoriteRepository.create({ userId, mediaId });
        await this.favoriteRepository.save(favorite);
        return { message: 'Added to favorites' };
    }

    async removeFavorite(userId: string, mediaId: string) {
        await this.favoriteRepository.delete({ userId, mediaId });
        return { message: 'Removed from favorites' };
    }

    async checkFavorite(userId: string, mediaId: string): Promise<boolean> {
        const count = await this.favoriteRepository.count({ where: { userId, mediaId } });
        return count > 0;
    }

    async searchTMDB(query: string, type: 'movie' | 'tv', year?: number) {
        // Check if query looks like an IMDB ID (e.g. tt1234567)
        if (query.startsWith('tt')) {
            return this.tmdbService.findByExternalId(query);
        }

        if (type === 'movie') {
            return this.tmdbService.searchMovie(query, year);
        } else {
            return this.tmdbService.searchTvShow(query, year);
        }
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
            throw new Error('Media not found');
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
}
