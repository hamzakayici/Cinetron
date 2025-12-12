import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Plus, ThumbsUp, Check } from 'lucide-react';
import { getMediaById, type Media } from '../../services/media';
import { addFavorite, removeFavorite, checkFavorite } from '../../services/api';

const MediaDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [media, setMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (!id) return;

        getMediaById(id)
            .then(setMedia)
            .catch(console.error)
            .finally(() => setLoading(false));

        checkFavorite(id)
            .then(res => setIsFavorite(res.data.isFavorite))
            .catch(console.error);
    }, [id]);

    const toggleFavorite = async () => {
        if (!media) return;
        try {
            if (isFavorite) {
                await removeFavorite(media.id);
                setIsFavorite(false);
            } else {
                await addFavorite(media.id);
                setIsFavorite(true);
            }
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-background text-white">Loading...</div>;
    }

    if (!media) {
        return <div className="flex h-screen items-center justify-center bg-background text-white">Media not found</div>;
    }

    return (
        <div className="relative min-h-screen bg-background text-white">
            {/* Backdrop */}
            <div className="absolute inset-0 h-[70vh]">
                <img
                    src={media.backdropUrl || media.posterUrl || 'https://placehold.co/1920x1080/1a1a1a/ffffff?text=No+Image'}
                    alt={media.title}
                    className="h-full w-full object-cover opacity-50 mask-image-gradient"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
            </div>

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute left-8 top-8 z-50 rounded-full bg-black/50 p-3 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
                <ArrowLeft size={24} />
            </button>

            {/* Content */}
            <div className="relative z-10 mx-auto max-w-7xl px-8 pt-[30vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="mb-4 text-6xl font-black uppercase tracking-tight drop-shadow-2xl">
                        {media.title}
                    </h1>

                    <div className="mb-6 flex items-center gap-4 text-lg font-medium text-white/70">
                        {media.year && <span>{media.year}</span>}
                        {media.type === 'movie' ? <span>Film</span> : <span>TV Show</span>}
                        <span className="rounded border border-white/30 px-2 py-0.5 text-xs">HD</span>
                    </div>

                    <p className="mb-8 max-w-2xl text-xl leading-relaxed text-white/90 drop-shadow-lg">
                        {media.overview || 'No overview available.'}
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/watch/${media.id}`)}
                            className="flex items-center gap-3 rounded bg-white px-8 py-3 text-xl font-bold text-black transition-transform hover:scale-105 active:scale-95"
                        >
                            <Play fill="currentColor" size={24} />
                            Oynat
                        </button>

                        <button
                            onClick={toggleFavorite}
                            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors ${isFavorite
                                ? 'bg-white border-white text-black'
                                : 'border-white/30 bg-black/30 backdrop-blur-sm hover:border-white hover:bg-white/10'
                                }`}
                        >
                            {isFavorite ? <Check size={24} /> : <Plus size={24} />}
                        </button>

                        <button className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-black/30 backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10">
                            <ThumbsUp size={24} />
                        </button>
                    </div>

                    {/* Additional Metadata / Cast could go here */}
                    <div className="mt-20">
                        <h3 className="mb-4 text-2xl font-bold">More Like This</h3>
                        <p className="text-white/50">Recommendation engine coming soon...</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MediaDetail;
