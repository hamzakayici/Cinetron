import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

export interface UploadItem {
    id: string;
    files: {
        video?: File;
        poster?: File;
        backdrop?: File;
    };
    metadata: {
        title: string;
        originalTitle?: string;
        overview?: string;
        releaseDate?: string;
        type: 'movie' | 'show' | 'episode';
        parentId?: string;
        seasonNumber?: number;
        episodeNumber?: number;
        videoUrl?: string;
        [key: string]: any;
    };
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    errorMessage?: string;
}

interface UploadQueueContextType {
    queue: UploadItem[];
    addToQueue: (files: UploadItem['files'], metadata: UploadItem['metadata']) => void;
    removeFromQueue: (id: string) => void;
    retryUpload: (id: string) => void;
    clearCompleted: () => void;
}

const UploadQueueContext = createContext<UploadQueueContextType | undefined>(undefined);

export const UploadQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [queue, setQueue] = useState<UploadItem[]>([]);
    const processingRef = useRef(false);

    // Helper to update status
    const updateItemStatus = (id: string, status: UploadItem['status'], progress: number = 0, errorMessage?: string) => {
        setQueue(prev => prev.map(item => 
            item.id === id ? { ...item, status, progress, errorMessage } : item
        ));
    };

    const uploadItem = async (item: UploadItem) => {
        updateItemStatus(item.id, 'uploading', 0);

        const formData = new FormData();
        if (item.files.video) formData.append('videoFile', item.files.video);
        if (item.files.poster) formData.append('posterFile', item.files.poster);
        if (item.files.backdrop) formData.append('backdropFile', item.files.backdrop);
        
        // Append metadata
        Object.entries(item.metadata).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        try {
            await api.post('/media', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    updateItemStatus(item.id, 'uploading', percentCompleted);
                },
            });
            updateItemStatus(item.id, 'completed', 100);
        } catch (error: any) {
            console.error("Upload failed", error);
            updateItemStatus(item.id, 'error', 0, error.message || "Upload failed");
        }
    };

    // Main Processing Loop
    useEffect(() => {
        const processQueue = async () => {
            if (processingRef.current) return;

            const nextItem = queue.find(item => item.status === 'pending');
            if (!nextItem) return;

            processingRef.current = true;
            
            try {
                await uploadItem(nextItem);
            } catch (error) {
                console.error("Upload process error", error);
            } finally {
                processingRef.current = false;
                // Since this effect depends on [queue], updating the item status will re-trigger this effect
                // and the processQueue function will run again to check for the next pending item.
                // However, we need to be careful about race conditions or state updates not reflecting immediately.
                // But generally, updateItemStatus changes 'queue', triggering useEffect.
            }
        };

        processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queue]);

    const addToQueue = (files: UploadItem['files'], metadata: UploadItem['metadata']) => {
        const newItem: UploadItem = {
            id: Math.random().toString(36).substr(2, 9), // Simple ID generation
            files,
            metadata,
            progress: 0,
            status: 'pending'
        };
        setQueue(prev => [...prev, newItem]);
    };

    const removeFromQueue = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const retryUpload = (id: string) => {
        setQueue(prev => prev.map(item => 
            item.id === id ? { ...item, status: 'pending', progress: 0, errorMessage: undefined } : item
        ));
    };

    const clearCompleted = () => {
        setQueue(prev => prev.filter(item => item.status !== 'completed'));
    };

    return (
        <UploadQueueContext.Provider value={{ queue, addToQueue, removeFromQueue, retryUpload, clearCompleted }}>
            {children}
        </UploadQueueContext.Provider>
    );
};

export const useUploadQueue = () => {
    const context = useContext(UploadQueueContext);
    if (!context) {
        throw new Error('useUploadQueue must be used within an UploadQueueProvider');
    }
    return context;
};
