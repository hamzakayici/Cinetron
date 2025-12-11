import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { DataSource } from 'typeorm';
import { Media } from '../entities/media.entity';

const REDIS_CONNECTION = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Database Connection
const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'cinetron',
    password: process.env.DB_PASSWORD || 'cinetron_password',
    database: process.env.DB_NAME || 'cinetron_db',
    entities: [Media],
    synchronize: false, // Do not sync schema from worker
});

let isDbInitialized = false;

export const startMetadataWorker = async () => {
    if (!isDbInitialized) {
        try {
            await AppDataSource.initialize();
            console.log('Worker Database Connection Initialized');
            isDbInitialized = true;
        } catch (error) {
            console.error('Error initializing Worker DB:', error);
        }
    }

    const worker = new Worker(
        'metadata-queue',
        async (job: Job) => {
            console.log(`Processing metadata job ${job.id} for file: ${job.data.filename}`);

            const { mediaId, filename } = job.data;
            let titleToSearch = filename;
            let yearToSearch = null;

            // Simple parser to extract title and year
            // Example: "Inception (2010).mp4" -> Title: Inception, Year: 2010
            const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
            const yearMatch = nameWithoutExt.match(/\((\d{4})\)/);
            if (yearMatch) {
                yearToSearch = yearMatch[1];
                titleToSearch = nameWithoutExt.replace(/\((\d{4})\)/, '').trim();
            } else {
                titleToSearch = nameWithoutExt;
            }
            // Cleanup common separators
            titleToSearch = titleToSearch.replace(/[._]/g, ' ').trim();

            console.log(`Searching TMDB for: ${titleToSearch} (Year: ${yearToSearch})`);

            try {
                let metadata = {
                    title: titleToSearch,
                    year: yearToSearch ? parseInt(yearToSearch) : null,
                    overview: 'No overview available.',
                    posterUrl: null,
                    backdropUrl: null,
                };

                if (TMDB_API_KEY) {
                    const searchUrl = `https://api.themoviedb.org/3/search/movie`;
                    const response = await axios.get(searchUrl, {
                        params: {
                            api_key: TMDB_API_KEY,
                            query: titleToSearch,
                            year: yearToSearch,
                            language: 'tr-TR' // Default to Turkish as per user locale
                        }
                    });

                    if (response.data.results && response.data.results.length > 0) {
                        const movie = response.data.results[0];
                        metadata.title = movie.title;
                        metadata.year = movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null;
                        metadata.overview = movie.overview;
                        metadata.posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
                        metadata.backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
                        console.log(`TMDB Found: ${movie.title}`);
                    } else {
                        console.log('TMDB returned no results, using filename.');
                    }
                } else {
                    console.log('TMDB_API_KEY not set, using mock/placeholder data.');
                    metadata.posterUrl = `https://placehold.co/400x600/1a1a1a/ffffff?text=${encodeURIComponent(titleToSearch)}`;
                }

                // Update Database
                if (isDbInitialized) {
                    const mediaRepo = AppDataSource.getRepository(Media);
                    await mediaRepo.update(mediaId, {
                        title: metadata.title,
                        year: metadata.year,
                        overview: metadata.overview,
                        posterUrl: metadata.posterUrl,
                        backdropUrl: metadata.backdropUrl
                    });
                    console.log(`Database updated for media: ${mediaId}`);
                } else {
                    console.error('Database not initialized, cannot save metadata.');
                }

                return metadata;

            } catch (error) {
                console.error('Metadata fetch failed:', error);
                throw error;
            }
        },
        { connection: REDIS_CONNECTION }
    );

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`Job ${job.id} failed with ${err.message}`);
    });

    console.log('Metadata worker started listening on queue: metadata-queue');
};
