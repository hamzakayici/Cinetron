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
            const params: any = { query };
            if (year) params.year = year;

            const response = await axios.get(`${this.baseUrl}/search/movie`, {
                headers: this.headers,
                params,
            });
            return response.data.results;
        } catch (error) {
            this.logger.error(`Error searching movie: ${query}`, error);
            return [];
        }
    }

    async searchTvShow(query: string, year?: number) {
        try {
            const params: any = { query };
            if (year) params.first_air_date_year = year;

            const response = await axios.get(`${this.baseUrl}/search/tv`, {
                headers: this.headers,
                params,
            });
            return response.data.results;
        } catch (error) {
            this.logger.error(`Error searching TV show: ${query}`, error);
            return [];
        }
    }

    async getMovieDetails(id: number) {
        try {
            const response = await axios.get(`${this.baseUrl}/movie/${id}`, {
                headers: this.headers,
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
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Error getting TV show details: ${id}`, error);
            return null;
        }
    }
}
