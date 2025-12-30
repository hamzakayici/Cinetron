export class CreateMediaDto {
    title: string;
    type: 'movie' | 'series' | 'tv';
    year?: number;
    overview?: string;
    tmdbId?: string;
    posterUrl?: string; // TMDB URL
    backdropUrl?: string; // TMDB URL
    videoUrl?: string; // Direct Video URL
    videoFile?: Express.Multer.File;
    posterFile?: Express.Multer.File;
    backdropFile?: Express.Multer.File;
    genres?: string[];
}

export class UpdateMediaDto {
    title?: string;
    type?: 'movie' | 'series' | 'tv';
    year?: number;
    overview?: string;
    tmdbId?: string;
    posterUrl?: string;
    backdropUrl?: string;
    videoUrl?: string;
    videoFile?: Express.Multer.File;
    posterFile?: Express.Multer.File;
    backdropFile?: Express.Multer.File;
    genres?: string[];
}
