import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize } from 'lucide-react';
import api from '../../services/api';
import { type Media, saveProgress, getProgress } from '../../services/media';
import { motion, AnimatePresence } from 'framer-motion';

const Player = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [media, setMedia] = useState<Media & { playbackUrl?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [initialProgress, setInitialProgress] = useState(0);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    // Controls State
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const [mediaRes, progress] = await Promise.all([
                    api.get(`/media/${id}`),
                    getProgress(id)
                ]);
                setMedia(mediaRes.data);
                if (progress > 10) { // Only prompt if watched more than 10 seconds
                    setInitialProgress(progress);
                    setShowResumePrompt(true);
                }
            } catch (err) {
                console.error("Failed to load media or progress", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused && id) {
                saveProgress(id, Math.floor(videoRef.current.currentTime));
            }
        }, 10000); // Save every 10 seconds

        return () => clearInterval(interval);
    }, [id]);

    const handleResume = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = initialProgress;
            videoRef.current.play();
            setShowResumePrompt(false);
        }
    };

    const handleStartOver = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            setShowResumePrompt(false);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-black text-white"><Loader2 className="animate-spin" /></div>;
    if (!media) return <div className="flex h-screen items-center justify-center bg-black text-white">Media not found</div>;

    return (
        <div
            className={`relative h-screen w-full bg-black overflow-hidden group ${showControls ? 'cursor-default' : 'cursor-none'}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Resume Prompt Modal */}
            <AnimatePresence>
                {showResumePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    >
                        <div className="bg-surface border border-white/10 p-8 rounded-2xl max-w-md w-full text-center">
                            <h2 className="text-2xl font-bold mb-2">Resume Watching?</h2>
                            <p className="text-white/60 mb-8">You left off at {formatTime(initialProgress)}</p>
                            <div className="flex gap-4 justify-center">
                                <button onClick={handleResume} className="px-6 py-3 bg-primary-600 rounded-lg font-bold hover:bg-primary-700 transition">Resume</button>
                                <button onClick={handleStartOver} className="px-6 py-3 bg-white/10 rounded-lg font-bold hover:bg-white/20 transition">Start Over</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute top-6 left-6 z-40">
                <button onClick={() => navigate(-1)} className="p-3 bg-black/50 rounded-full hover:bg-white/20 transition text-white">
                    <ArrowLeft />
                </button>
            </div>

            <video
                ref={videoRef}
                src={media.playbackUrl}
                className="h-full w-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
            />

            {/* Custom Controls Overlay */}
            <AnimatePresence>
                {showControls && !showResumePrompt && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent z-40"
                    >
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer" onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            if (videoRef.current) videoRef.current.currentTime = pos * duration;
                        }}>
                            <div
                                className="h-full bg-primary-500 rounded-full relative"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full scale-0 group-hover:scale-100 transition-transform" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button onClick={togglePlay} className="text-white hover:text-primary-500 transition">
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                                </button>

                                <button onClick={() => {
                                    if (videoRef.current) videoRef.current.currentTime -= 10;
                                }} className="text-white hover:text-primary-500 transition">
                                    <RotateCcw size={24} />
                                </button>

                                <div className="flex items-center gap-2 group/vol">
                                    <button onClick={() => setIsMuted(!isMuted)} className="text-white">
                                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </button>
                                    <input
                                        type="range" min="0" max="1" step="0.1"
                                        value={volume}
                                        onChange={(e) => {
                                            const vol = parseFloat(e.target.value);
                                            setVolume(vol);
                                            if (videoRef.current) videoRef.current.volume = vol;
                                        }}
                                        className="w-0 overflow-hidden group-hover/vol:w-24 transition-all h-1 accent-primary-500"
                                    />
                                </div>

                                <span className="text-sm font-medium tabular-nums opacity-80">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold truncate max-w-md">{media.title}</h3>
                                <button onClick={() => {
                                    if (document.fullscreenElement) document.exitFullscreen();
                                    else document.documentElement.requestFullscreen();
                                }} className="text-white hover:text-white/80">
                                    <Maximize size={24} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Player;
