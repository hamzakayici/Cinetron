import { Play, Info, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getMedia, Media } from '../../services/media';

const HERO_MOVIE = {
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    backdrop: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    logo: "DUNE LOGO"
};

const Library = () => {
    const [mediaItems, setMediaItems] = useState<Media[]>([]);

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const data = await getMedia();
                setMediaItems(data);
            } catch (err) {
                console.error("Failed to fetch media", err);
            }
        };

        fetchMedia();
    }, []);

    const categories = [
        { title: "Continue Watching", aspect: "video", items: [] }, // Placeholder
        { title: "Recently Added", aspect: "poster", items: mediaItems }, // Real Data
        { title: "Sci-Fi & Fantasy", aspect: "poster", items: [] }, // Placeholder
    ];

    return (
        <div className="pb-20">
            {/* Hero Section (Static for now) */}
            <div className="relative h-[80vh] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={HERO_MOVIE.backdrop}
                        alt="Hero Backdrop"
                        className="h-full w-full object-cover object-top opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>

                <div className="relative z-10 flex h-full flex-col justify-end px-12 pb-24">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 text-7xl font-black uppercase tracking-tighter text-white drop-shadow-2xl"
                    >
                        {HERO_MOVIE.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8 max-w-2xl text-lg font-medium text-white/80 drop-shadow-md"
                    >
                        {HERO_MOVIE.description}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-4"
                    >
                        <button className="flex items-center gap-3 rounded-lg bg-white px-8 py-3 font-bold text-black hover:bg-white/90 transition-colors">
                            <Play fill="currentColor" size={24} />
                            Play
                        </button>
                        <button className="flex items-center gap-3 rounded-lg bg-white/20 px-8 py-3 font-bold text-white backdrop-blur-md hover:bg-white/30 transition-colors">
                            <Info size={24} />
                            More Info
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Content Rows */}
            <div className="relative z-20 -mt-32 space-y-12 px-12">
                {categories.map((category, idx) => (
                    category.items.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                        >
                            <h3 className="mb-4 text-xl font-bold text-white/90">{category.title}</h3>
                            <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x">
                                {category.items.map((item, i) => (
                                    <div
                                        key={item.id || i}
                                        className={`relative flex-none snap-start overflow-hidden rounded-lg bg-surface transition-all duration-300 hover:z-30 hover:scale-105 hover:ring-2 hover:ring-primary-500 cursor-pointer group ${category.aspect === 'video' ? 'w-80 aspect-video' : 'w-48 aspect-[2/3]'}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-4">
                                            <h4 className="font-bold text-sm">{item.title}</h4>
                                            <div className="mt-2 flex items-center gap-2">
                                                <button className="rounded-full bg-white p-2 text-black hover:scale-110 transition-transform">
                                                    <Play size={12} fill="currentColor" />
                                                </button>
                                                <button className="rounded-full border border-white/30 p-2 text-white hover:border-white hover:bg-white/10 transition-colors">
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <img
                                            src={item.posterUrl || `https://placehold.co/400x600/1a1a1a/333333?text=${encodeURIComponent(item.title)}`}
                                            className="h-full w-full object-cover"
                                            alt={item.title}
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )
                ))}
            </div>
        </div>
    );
};

export default Library;
