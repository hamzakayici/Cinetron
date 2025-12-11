import { Play, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMedia, type Media } from '../../services/media';



const Library = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
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

    // If no media, show a cinematic empty state
    if (mediaItems.length === 0) {
        return (
            <div className="relative flex h-screen items-center justify-center bg-background text-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-background to-background opacity-40" />
                <div className="z-10 text-center space-y-6 max-w-lg px-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-3xl shadow-[0_0_50px_rgba(139,92,246,0.3)]"
                    >
                        <Play size={40} className="text-primary-400 ml-2" />
                    </motion.div>
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
                        Welcome to Cinetron
                    </h1>
                    <p className="text-xl text-white/60 font-medium leading-relaxed">
                        Your personal streaming sanctuary is ready. Scan your library in settings to begin the experience.
                    </p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="mt-8 px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-primary-400 hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
                    >
                        Go to Admin Panel
                    </button>
                </div>
            </div>
        );
    }

    const heroItem = mediaItems[0];
    const categories = [
        { title: t('library.recentlyAdded'), aspect: "poster", items: mediaItems },
        { title: t('library.continueWatching'), aspect: "video", items: [] },
    ];

    return (
        <div className="min-h-screen bg-background pb-32">

            {/* Cinematic Hero Section */}
            <div className="relative h-[85vh] w-full overflow-hidden">
                {/* Background Image / Video */}
                <div className="absolute inset-0">
                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, ease: "linear" }}
                        src={heroItem.backdropUrl || heroItem.posterUrl}
                        alt="Hero Backdrop"
                        className="h-full w-full object-cover object-top"
                    />

                    {/* Advanced Vignette Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 flex h-full flex-col justify-end px-4 md:px-16 pb-24 max-w-4xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-6 text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl"
                    >
                        {heroItem.title}
                    </motion.h1>

                    <div className="flex items-center gap-4 mb-6 text-sm font-semibold text-green-400 tracking-wide">
                        <span>98% Match</span>
                        <span className="text-white/60">2024</span>
                        <span className="px-2 py-0.5 border border-white/40 rounded text-xs text-white/80">4K</span>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mb-10 text-lg md:text-xl font-medium text-white/90 drop-shadow-md leading-relaxed line-clamp-3 md:line-clamp-none max-w-2xl text-shadow-hero"
                    >
                        {heroItem.overview}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-4"
                    >
                        <button
                            onClick={() => navigate(`/watch/${heroItem.id}`)}
                            className="flex items-center gap-3 rounded bg-white px-8 py-3.5 text-lg font-bold text-black hover:bg-primary-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            <Play fill="currentColor" size={28} />
                            {t('library.play')}
                        </button>
                        <button
                            onClick={() => navigate(`/title/${heroItem.id}`)}
                            className="flex items-center gap-3 rounded bg-white/20 px-8 py-3.5 text-lg font-bold text-white backdrop-blur-md hover:bg-white/30 transition-all duration-300 hover:scale-105"
                        >
                            <Info size={28} />
                            {t('library.moreInfo')}
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Content Rows */}
            <div className="relative z-20 -mt-32 space-y-16 px-4 md:px-16">
                {categories.map((category, idx) => (
                    category.items.length > 0 && (
                        <div key={idx} className="space-y-4">
                            <h3 className="text-2xl font-bold text-white/90 ml-1 hover:text-primary-400 transition-colors cursor-pointer flex items-center gap-2 group">
                                {category.title}
                                <span className="text-xs opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-primary-400">View All &gt;</span>
                            </h3>

                            <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x -mx-4 px-4 md:-mx-16 md:px-16">
                                {category.items.map((item, i) => (
                                    <motion.div
                                        key={item.id || i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ margin: "-50px" }}
                                        transition={{ duration: 0.4, delay: i * 0.05 }}
                                        onClick={() => navigate(`/title/${item.id}`)}
                                        className={`relative flex-none snap-start cursor-pointer group ${category.aspect === 'video' ? 'w-80 aspect-video' : 'w-[200px] aspect-[2/3]'}`}
                                    >
                                        <div className="absolute inset-0 rounded-md overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:z-50 group-hover:ring-4 ring-primary-500/0 group-hover:ring-primary-500 group-hover:shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-surface">
                                            <img
                                                src={item.posterUrl || `https://placehold.co/400x600/1a1a1a/333333?text=${encodeURIComponent(item.title)}`}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                alt={item.title}
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
                                                    <h4 className="font-bold text-sm text-white drop-shadow-md mb-1">{item.title}</h4>
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-green-400">
                                                        <span>98% Match</span>
                                                        <span className="text-white/60">{item.year || '2024'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default Library;
