import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { tmdbConfig } from '../config/tmdb.config';

@Injectable()
export class TmdbService {
    private readonly logger = new Logger(TmdbService.name);
    private readonly baseUrl = tmdbConfig.apiUrl;
    private readonly headers = {
        Authorization: `Bearer ${tmdbConfig.readToken}`,
        'Content-Type': 'application/json',
    };

    async searchMovie(query: string, year?: number) {
        try {
            // Multi-strategy search: Turkish + English for better results
            const trResponse = await axios.get(`${this.baseUrl}/search/movie`, {
                headers: this.headers,
                params: { query, language: 'tr-TR', year, include_adult: false },
            });

            const enResponse = await axios.get(`${this.baseUrl}/search/movie`, {
                headers: this.headers,
                params: { query, language: 'en-US', year, include_adult: false },
            });

            // Merge and deduplicate by ID
            const allResults = [...(trResponse.data.results || []), ...(enResponse.data.results || [])];
            const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());

            // Sort: exact match first, then by popularity
            const sorted = uniqueResults.sort((a, b) => {
                const aMatch = a.title?.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
                const bMatch = b.title?.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
                if (aMatch !== bMatch) return bMatch - aMatch;
                return (b.popularity || 0) - (a.popularity || 0);
            });

            return sorted.slice(0, 20);
        } catch (error) {
            this.logger.error(`Error searching movie: ${query}`, error);
            return [];
        }
    }

    async searchTvShow(query: string, year?: number) {
        try {
            // Multi-strategy search: Turkish + English for better results
            const trResponse = await axios.get(`${this.baseUrl}/search/tv`, {
                headers: this.headers,
                params: { query, language: 'tr-TR', first_air_date_year: year, include_adult: false },
            });

            const enResponse = await axios.get(`${this.baseUrl}/search/tv`, {
                headers: this.headers,
                params: { query, language: 'en-US', first_air_date_year: year, include_adult: false },
            });

            // Merge and deduplicate by ID
            const allResults = [...(trResponse.data.results || []), ...(enResponse.data.results || [])];
            const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());

            // Sort: exact match first, then by popularity
            const sorted = uniqueResults.sort((a, b) => {
                const aMatch = a.name?.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
                const bMatch = b.name?.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
                if (aMatch !== bMatch) return bMatch - aMatch;
                return (b.popularity || 0) - (a.popularity || 0);
            });

            return sorted.slice(0, 20);
        } catch (error) {
            this.logger.error(`Error searching TV show: ${query}`, error);
            return [];
        }
    }

    async getMovieDetails(id: number) {
        try {
            const response = await axios.get(`${this.baseUrl}/movie/${id}`, {
                headers: this.headers,
                params: { 
                    language: 'tr-TR',
                    append_to_response: 'credits,videos,images,similar'
                },
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Error getting movie details: ${id}`, error);
            return null;
        }
    }

    async getTvShowDetails(id: number) {
        try {
            const response = await axios.get(`${this.baseUrl}/tv/${id}`, {
                headers: this.headers,
                params: { 
                    language: 'tr-TR',
                    append_to_response: 'aggregate_credits,videos,images,similar'
                },
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Error getting TV show details: ${id}`, error);
            return null;
        }
    }
    async findByExternalId(externalId: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/find/${externalId}`, {
                headers: this.headers,
                params: { 
                    language: 'tr-TR',
                    external_source: 'imdb_id'
                },
            });
            // Combine results from movie_results and tv_results
            return [
                ...(response.data.movie_results || []),
                ...(response.data.tv_results || [])
            ];
        } catch (error) {
            this.logger.error(`Error finding by external ID: ${externalId}`, error);
            return [];
        }
    }

    async getSeasonDetails(tvId: number, seasonNumber: number) {
        try {
            const response = await axios.get(`${this.baseUrl}/tv/${tvId}/season/${seasonNumber}`, {
                headers: this.headers,
                params: { 
                    language: 'tr-TR'
                },
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Error getting season ${seasonNumber} for TV ${tvId}`, error);
            return null;
        }
    }
}
