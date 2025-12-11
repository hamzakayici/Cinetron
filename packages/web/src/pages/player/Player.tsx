import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../services/api';
import type { Media } from '../../services/media';

const Player = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [media, setMedia] = useState<Media & { playbackUrl?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const response = await api.get(`/media/${id}`);
                setMedia(response.data);
            } catch (err) {
                console.error("Failed to load media", err);
                setError("Failed to load video");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchMedia();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
        );
    }

    if (error || !media || !media.playbackUrl) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
                <h2 className="text-2xl font-bold text-red-500">{error || "Video not found"}</h2>
                <button
                    onClick={() => navigate('/library')}
                    className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 font-bold hover:bg-white/20"
                >
                    <ArrowLeft size={20} />
                    Back to Library
                </button>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-black">
            {/* Back Button Overlay */}
            <div className="absolute top-0 left-0 z-50 p-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={() => navigate('/library')}
                    className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-md hover:bg-black/70"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
            </div>

            {/* Video Player */}
            <video
                controls
                autoPlay
                className="h-full w-full object-contain"
                poster={media.posterUrl || media.backdropUrl}
            >
                <source src={media.playbackUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default Player;
