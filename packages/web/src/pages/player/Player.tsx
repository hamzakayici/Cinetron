import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Subtitles as SubtitlesIcon, Check, Settings, PictureInPicture, FastForward } from 'lucide-react';
import api from '../../services/api';
import { type Media, saveProgress, getProgress } from '../../services/media';
import { getSubtitles } from '../../services/api';
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

    const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

    // Subtitle State
    const [subtitles, setSubtitles] = useState<any[]>([]);
    const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);

    // Advanced Features State
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    
    // Auto-play fix & Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const [mediaRes, progress, subRes] = await Promise.all([
                    api.get(`/media/${id}`),
                    getProgress(id),
                    getSubtitles(id as string)
                ]);
                setMedia(mediaRes.data);
                setSubtitles(subRes.data);
                
                if (progress > 10) { 
                    setInitialProgress(progress);
                    setShowResumePrompt(true);
                    // Don't auto-play yet, wait for user choice
                    setIsPlaying(false);
                } else {
                    // Auto-play immediately if starting from beginning
                    // Small delay to ensure video element is ready
                    setTimeout(() => {
                         if (videoRef.current) {
                             videoRef.current.play().catch(() => setIsPlaying(false));
                         }
                    }, 100);
                }

            } catch (err) {
                console.error("Failed to load media details", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!videoRef.current) return;
            
            // Prevent default scrolling for Space/Arrows
            if([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }

            switch(e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    togglePlay();
                    break;
                case 'arrowleft':
                case 'j':
                    videoRef.current.currentTime -= 10;
                    handleMouseMove(); // show controls
                    break;
                case 'arrowright':
                case 'l':
                    videoRef.current.currentTime += 10;
                    handleMouseMove();
                    break;
                case 'arrowup':
                    setVolume(v => Math.min(1, v + 0.1));
                    videoRef.current.volume = Math.min(1, volume + 0.1);
                    break;
                case 'arrowdown':
                    setVolume(v => Math.max(0, v - 0.1));
                    videoRef.current.volume = Math.max(0, volume - 0.1);
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                case 'm':
                    toggleMute();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [volume]); // Re-bind when volume changes (or better, use functional updates)

    useEffect(() => {
        const interval = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused && id) {
                saveProgress(id, Math.floor(videoRef.current.currentTime));
            }
        }, 10000); // Save every 10 seconds

        return () => clearInterval(interval);
    }, [id]);

    // Handle subtitle track switching
    useEffect(() => {
        if (!videoRef.current) return;
        
        // Loop through all text tracks and set mode
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
            const track = videoRef.current.textTracks[i];
            // Match by language (our ID is stored in language for uniqueness hack, or we rely on label)
            // Ideally we match by label since track.id might not be reliable across browsers
            if (activeSubtitle && track.label === subtitles.find(s => s.id === activeSubtitle)?.label) {
                track.mode = 'showing';
            } else {
                track.mode = 'hidden';
            }
        }
    }, [activeSubtitle, subtitles]);


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
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (videoRef.current) videoRef.current.muted = newMuted;
    };

    const togglePiP = async () => {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (videoRef.current) {
            await videoRef.current.requestPictureInPicture();
        }
    };

    const changeSpeed = (speed: number) => {
        setPlaybackSpeed(speed);
        if (videoRef.current) videoRef.current.playbackRate = speed;
        setShowSettingsMenu(false);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (!showSubtitleMenu) setShowControls(false); // keep controls if menu open
        }, 3000);
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
            onClick={() => { 
                if(showSubtitleMenu) setShowSubtitleMenu(false); 
                if(showSettingsMenu) setShowSettingsMenu(false);
            }}
            onDoubleClick={toggleFullscreen}
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

            <div className={`absolute top-6 left-6 z-40 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
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
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                crossOrigin="anonymous" // Important for loading subtitles from different origin
            >
                {subtitles.map(sub => (
                    <track
                        key={sub.id}
                        kind="subtitles"
                        src={sub.url}
                        srcLang={sub.language}
                        label={sub.label}
                        default={sub.id === activeSubtitle}
                    />
                ))}
            </video>

            {/* Custom Controls Overlay */}
            <AnimatePresence>
                {showControls && !showResumePrompt && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent z-40"
                        onClick={e => e.stopPropagation()} // Prevent clicking background click handler
                    >
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer group/progress" onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            if (videoRef.current) videoRef.current.currentTime = pos * duration;
                        }}>
                            <div
                                className="h-full bg-primary-500 rounded-full relative"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full scale-0 group-hover/progress:scale-100 transition-transform" />
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
                                <h3 className="text-lg font-bold truncate max-w-sm hidden md:block">{media.title}</h3>
                                
                                {/* Subtitle Button & Menu */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowSubtitleMenu(!showSubtitleMenu)} 
                                        className={`transition ${activeSubtitle ? 'text-primary-500' : 'text-white hover:text-primary-500'}`}
                                        title="Subtitles"
                                    >
                                        <SubtitlesIcon size={24} />
                                    </button>
                                    
                                    <AnimatePresence>
                                    {showSubtitleMenu && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full right-0 mb-4 bg-black/90 border border-white/10 rounded-lg p-2 min-w-[200px] shadow-xl"
                                        >
                                            <h4 className="px-3 py-2 text-xs font-bold text-white/40 uppercase tracking-wider">Subtitles</h4>
                                            
                                            <button 
                                                onClick={() => { setActiveSubtitle(null); setShowSubtitleMenu(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 rounded text-sm text-left transition-colors"
                                            >
                                                <span>Off</span>
                                                {!activeSubtitle && <Check size={14} className="text-primary-500" />}
                                            </button>
                                            
                                            {subtitles.map(sub => (
                                                <button 
                                                    key={sub.id} 
                                                    onClick={() => { setActiveSubtitle(sub.id); setShowSubtitleMenu(false); }}
                                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 rounded text-sm text-left transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span>{sub.label}</span>
                                                        <span className="text-xs text-white/40 uppercase">{sub.language}</span>
                                                    </span>
                                                    {activeSubtitle === sub.id && <Check size={14} className="text-primary-500" />}
                                                </button>
                                            ))}
                                            
                                            {subtitles.length === 0 && (
                                                <div className="px-3 py-2 text-sm text-white/40">No subtitles available</div>
                                            )}
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>

                                {/* Settings Button & Menu */}
                                <div className="relative">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowSettingsMenu(!showSettingsMenu); setShowSubtitleMenu(false); }} 
                                        className={`transition ${showSettingsMenu ? 'text-primary-500' : 'text-white hover:text-primary-500'}`}
                                        title="Settings"
                                    >
                                        <Settings size={24} />
                                    </button>
                                    
                                    <AnimatePresence>
                                    {showSettingsMenu && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full right-0 mb-4 bg-black/90 border border-white/10 rounded-lg p-2 min-w-[160px] shadow-xl"
                                        >
                                            <h4 className="px-3 py-2 text-xs font-bold text-white/40 uppercase tracking-wider">Speed</h4>
                                            
                                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                                <button 
                                                    key={speed} 
                                                    onClick={() => changeSpeed(speed)}
                                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 rounded text-sm text-left transition-colors"
                                                >
                                                    <span>{speed}x</span>
                                                    {playbackSpeed === speed && <Check size={14} className="text-primary-500" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>

                                <button onClick={togglePiP} className="text-white hover:text-white/80 hidden sm:block" title="Picture in Picture">
                                    <PictureInPicture size={24} />
                                </button>

                                <button onClick={toggleFullscreen} className="text-white hover:text-white/80" title="Fullscreen">
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
