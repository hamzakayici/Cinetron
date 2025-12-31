import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Plus, ThumbsUp, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMediaById, type Media } from '../../services/media';
import { addFavorite, removeFavorite, checkFavorite, getEpisodes } from '../../services/api';

interface Episode {
    id: string;
    title: string;
    seasonNumber: number;
    episodeNumber: number;
    overview?: string;
    filePath?: string;
    stillUrl?: string;
}

const MediaDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [media, setMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    
    // Episode state for series
    const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({});
    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

    const { t } = useTranslation();

    const isSeries = media?.type === 'series' || media?.type === 'tv' || media?.type === 'show';

    useEffect(() => {
        if (!id) return;

        getMediaById(id)
            .then(data => {
                setMedia(data);
                // Fetch episodes if it's a series
                if (data.type === 'series' || data.type === 'tv' || data.type === 'show') {
                    getEpisodes(id)
                        .then(res => {
                            setEpisodes(res.data);
                            // Set first season as selected
                            const seasons = Object.keys(res.data).sort((a, b) => {
                                const aNum = parseInt(a.replace(/\D/g, '')) || 0;
                                const bNum = parseInt(b.replace(/\D/g, '')) || 0;
                                return aNum - bNum;
                            });
                            if (seasons.length > 0) {
                                setSelectedSeason(seasons[0]);
                            }
                        })
                        .catch(console.error);
                }
            })
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

    const playEpisode = (episode: Episode) => {
        if (episode.filePath) {
            navigate(`/watch/${media?.id}?episode=${episode.id}`);
        }
    };

    const seasons = Object.keys(episodes).sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.replace(/\D/g, '')) || 0;
        return aNum - bNum;
    });

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-background text-white">{t('detail.loading')}</div>;
    }

    if (!media) {
        return <div className="flex h-screen items-center justify-center bg-background text-white">{t('detail.mediaNotFound')}</div>;
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
                        <span>{t(`media.type.${media.type}`, { defaultValue: media.type })}</span>
                        <span className="rounded border border-white/30 px-2 py-0.5 text-xs">HD</span>
                        {isSeries && seasons.length > 0 && (
                            <span>{seasons.length} {t('detail.seasons')}</span>
                        )}
                    </div>

                    <p className="mb-8 max-w-2xl text-xl leading-relaxed text-white/90 drop-shadow-lg">
                        {media.overview || t('detail.noOverview')}
                    </p>

                    {/* Action Buttons - Only show Play for movies */}
                    <div className="flex items-center gap-4">
                        {!isSeries && (
                            <button
                                onClick={() => navigate(`/watch/${media.id}`)}
                                className="flex items-center gap-3 rounded bg-white px-8 py-3 text-xl font-bold text-black transition-transform hover:scale-105 active:scale-95"
                            >
                                <Play fill="currentColor" size={24} />
                                {t('library.play')}
                            </button>
                        )}

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

                    {/* Episode Browser for Series */}
                    {isSeries && seasons.length > 0 && (
                        <div className="mt-12">
                            {/* Season Selector */}
                            <div className="mb-6 flex items-center gap-4">
                                <h3 className="text-2xl font-bold">{t('detail.episodes')}</h3>
                                
                                {/* Season Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                                        className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium hover:bg-white/20 transition-colors"
                                    >
                                        {selectedSeason}
                                        <ChevronDown size={18} className={`transition-transform ${showSeasonDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {showSeasonDropdown && (
                                        <div className="absolute left-0 top-full mt-2 z-50 min-w-[150px] rounded-lg bg-surface border border-white/10 shadow-xl overflow-hidden">
                                            {seasons.map(season => (
                                                <button
                                                    key={season}
                                                    onClick={() => {
                                                        setSelectedSeason(season);
                                                        setShowSeasonDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors ${selectedSeason === season ? 'bg-white/20 font-bold' : ''}`}
                                                >
                                                    {season}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Episode Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                {episodes[selectedSeason]?.sort((a, b) => a.episodeNumber - b.episodeNumber).map(episode => (
                                    <motion.div
                                        key={episode.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => playEpisode(episode)}
                                        className={`group rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary-500 transition-all cursor-pointer ${!episode.filePath ? 'opacity-50' : ''}`}
                                    >
                                        {/* Episode Thumbnail */}
                                        <div className="aspect-video bg-black/50 relative overflow-hidden">
                                            {episode.stillUrl ? (
                                                <img src={episode.stillUrl} alt={episode.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900/50 to-black">
                                                    <span className="text-4xl font-bold text-white/30">E{episode.episodeNumber}</span>
                                                </div>
                                            )}
                                            
                                            {/* Play overlay */}
                                            {episode.filePath && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                                                        <Play fill="black" className="text-black ml-1" size={24} />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Episode Number Badge */}
                                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium">
                                                {t('detail.episodeShort')} {episode.episodeNumber}
                                            </div>
                                        </div>
                                        
                                        {/* Episode Info */}
                                        <div className="p-3">
                                            <h4 className="font-semibold line-clamp-1">{episode.title || `${t('detail.episode')} ${episode.episodeNumber}`}</h4>
                                            {episode.overview && (
                                                <p className="text-sm text-white/60 mt-1 line-clamp-2">{episode.overview}</p>
                                            )}
                                            {!episode.filePath && (
                                                <p className="text-xs text-yellow-500 mt-2">{t('detail.noVideo')}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            
                            {/* No episodes message */}
                            {(!episodes[selectedSeason] || episodes[selectedSeason].length === 0) && (
                                <div className="text-center text-white/50 py-12">
                                    {t('detail.noEpisodes')}
                                </div>
                            )}
                        </div>
                    )}

                    {/* For movies or series without episodes, show recommendations */}
                    {(!isSeries || seasons.length === 0) && (
                        <div className="mt-20">
                            <h3 className="mb-4 text-2xl font-bold">{t('detail.moreLikeThis')}</h3>
                            <p className="text-white/50">{t('detail.recommendationComingSoon')}</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default MediaDetail;
