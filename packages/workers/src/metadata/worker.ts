import { Worker, Job } from 'bullmq';
import axios from 'axios';

const REDIS_CONNECTION = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const startMetadataWorker = () => {
    const worker = new Worker(
        'metadata-queue',
        async (job: Job) => {
            console.log(`Processing metadata job ${job.id} for file: ${job.data.filePath}`);

            try {
                // Mock TMDB API call
                // In production, we would search by filename or hash
                const query = job.data.filename;
                console.log(`Searching TMDB for: ${query}`);

                // Simulating API delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                const mockResult = {
                    title: "Sample Movie",
                    year: 2023,
                    overview: "This is a fetched overview from TMDB mock.",
                    poster_path: "/sample_poster.jpg"
                };

                console.log(`Metadata found: ${mockResult.title}`);

                // TODO: Save to database using TypeORM
                return mockResult;

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
