export interface Media {
    id: string;
    title: string;
    year?: number;
    posterUrl?: string;
    backdropUrl?: string;
    overview?: string;
    filePath: string;
    type: 'movie' | 'tv' | 'series';
    genres?: string[];
}

const API_URL = import.meta.env.VITE_API_URL || '';

export const getMedia = async (): Promise<Media[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_URL}/api/media`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) throw new Error('Failed to fetch media');
    return res.json();
};

export const getMediaById = async (id: string): Promise<Media> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_URL}/api/media/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) throw new Error('Failed to fetch media detail');
    return res.json();
};

export const saveProgress = async (id: string, progress: number): Promise<void> => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/media/${id}/progress`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress })
    });
};

export const getProgress = async (id: string): Promise<number> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/media/${id}/progress`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.progress;
};

export const scanLibrary = async (): Promise<{ message: string, added: number }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/media/scan`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return res.json();
};
