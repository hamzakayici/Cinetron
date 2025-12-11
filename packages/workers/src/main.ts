import 'dotenv/config';
import { startMetadataWorker } from './metadata/worker';

async function bootstrap() {
    console.log('Starting Cinetron Workers...');

    // Start different workers
    startMetadataWorker();

    // Keep the process alive
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down...');
        process.exit(0);
    });
}

bootstrap();
