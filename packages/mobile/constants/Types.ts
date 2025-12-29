export interface Episode {
    id: string;
    title: string;
    seasonNumber: number;
    episodeNumber: number;
    overview?: string;
    filePath: string;
    stillUrl?: string;
    mediaId: string;
    createdAt: string;
    playbackUrl?: string;
}

export interface Media {
    id: string;
    title: string;
    filePath: string;
    originalFileName?: string;
    posterUrl?: string;
    backdropUrl?: string;
    overview?: string;
    year?: number;
    type: 'movie' | 'tv' | 'series';
    processed: boolean;
    createdAt: string;
    episodes?: Episode[];
    playbackUrl?: string;
}
