import { motion } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Media } from '../../services/media';

interface MediaCardProps {
    media: Media;
    aspect?: 'poster' | 'video';
}

const MediaCard = ({ media, aspect = 'poster' }: MediaCardProps) => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ margin: "-50px" }}
            onClick={() => navigate(`/title/${media.id}`)}
            className={`relative flex-none snap-start cursor-pointer group hover:z-50 ${aspect === 'video' ? 'w-80 aspect-video' : 'w-[200px] aspect-[2/3]'}`}
        >
            <div className="absolute inset-0 rounded-md overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:z-50 group-hover:ring-4 ring-primary-500/0 group-hover:ring-primary-500 group-hover:shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-surface">
                <img
                    src={media.posterUrl || `https://placehold.co/400x600/1a1a1a/333333?text=${encodeURIComponent(media.title)}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={media.title}
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <button className="bg-white text-black p-2 rounded-full hover:scale-110 transition-transform">
                                <Play size={12} fill="currentColor" />
                            </button>
                            <button className="border border-white/50 text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                                <Info size={12} />
                            </button>
                        </div>
                        <h4 className="font-bold text-sm text-white drop-shadow-md mb-1">{media.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-green-400">
                            <span>{media.year || '2024'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MediaCard;
