export class CreateMediaDto {
    title: string;
    type: 'movie' | 'series' | 'tv';
    year?: number;
    overview?: string;
    tmdbId?: string;
    videoFile?: Express.Multer.File;
    posterFile?: Express.Multer.File;
    backdropFile?: Express.Multer.File;
}

export class UpdateMediaDto {
    title?: string;
    type?: 'movie' | 'series' | 'tv';
    year?: number;
    overview?: string;
    tmdbId?: string;
    videoFile?: Express.Multer.File;
    posterFile?: Express.Multer.File;
    backdropFile?: Express.Multer.File;
}
