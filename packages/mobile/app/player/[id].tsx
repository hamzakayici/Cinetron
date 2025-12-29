import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Pressable, Platform, Dimensions, GestureResponderEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Pause, SkipBack, SkipForward, X, Subtitles as SubtitlesIcon, Check, Lock, Unlock, Maximize2, Minimize2 } from 'lucide-react-native';
import { getMediaDetail, getEpisodeDetail, getSubtitles } from '../../services/api';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const isTV = Platform.isTV || Platform.OS === 'android';

export default function PlayerScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const videoRef = useRef<Video>(null);

    const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [isPlaying, setIsPlaying] = useState(true);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

    // Subtitle State
    const [subtitles, setSubtitles] = useState<any[]>([]);
    const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
    const [cues, setCues] = useState<any[]>([]);
    const [currentCue, setCurrentCue] = useState<string | null>(null);
    const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

    // Advanced Mobile Features
    const [resizeMode, setResizeMode] = useState(ResizeMode.CONTAIN);
    const [isLocked, setIsLocked] = useState(false);
    const lastTapRef = useRef<number>(0);

    useEffect(() => {
        loadMedia();
    }, [id]);

    const loadMedia = async () => {
        try {
            if (!id || typeof id !== 'string') return;
            const isEpisode = id.includes('episode-');
            const [mediaData, subData] = await Promise.all([
                isEpisode ? await getEpisodeDetail(id) : await getMediaDetail(id),
                getSubtitles(id)
            ]);
            
            setPlaybackUrl(mediaData.playbackUrl);
            setTitle(mediaData.title);
            setSubtitles(subData);
        } catch (error) {
            console.error('Failed to load media:', error);
        }
    };

    // Fetch and parse subtitle content when active subtitle changes
    useEffect(() => {
        const loadSubtitleContent = async () => {
            if (!activeSubtitle) {
                setCues([]);
                setCurrentCue(null);
                return;
            }
            
            const sub = subtitles.find(s => s.id === activeSubtitle);
            if (!sub) return;

            try {
                const response = await fetch(sub.url);
                const text = await response.text();
                const parsedCues = parseSubtitles(text);
                setCues(parsedCues);
            } catch (error) {
                console.error("Failed to load subtitle content", error);
            }
        };
        loadSubtitleContent();
    }, [activeSubtitle]);

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setDuration(status.durationMillis || 0);
            
            const pos = status.positionMillis || 0;
            setPosition(pos);

            // Find active cue
            if (cues.length > 0) {
                const active = cues.find(cue => pos >= cue.start && pos <= cue.end);
                setCurrentCue(active ? active.text : null);
            } else {
                setCurrentCue(null);
            }
        }
    };

    const togglePlayPause = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        }
        resetControlsTimeout();
    };

    const skip = async (seconds: number) => {
        if (videoRef.current) {
            const newPosition = Math.max(0, Math.min(position + seconds * 1000, duration));
            await videoRef.current.setPositionAsync(newPosition);
        }
        resetControlsTimeout();
    };

    const handleSeek = async (value: number) => {
        if (videoRef.current) {
            await videoRef.current.setPositionAsync(value);
        }
    };

    const resetControlsTimeout = () => {
        if (isLocked) return;
        setShowControls(true);
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, isTV ? 5000 : 3000);
    };

    // Handle Screen Press (Double Tap & Single Tap)
    const handleScreenPress = (e: GestureResponderEvent) => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;
        
        if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
            // Double Tap Detected
            if (isLocked) return;

            const screenWidth = Dimensions.get('window').width;
            const touchX = e.nativeEvent.pageX;
            
            if (touchX < screenWidth / 2) {
                skip(-10); // Left side -> Rewind
            } else {
                skip(10); // Right side -> Forward
            }
            lastTapRef.current = 0; // Reset
        } else {
            // Single Tap
            lastTapRef.current = now;
            // Delay action to wait for potential double tap? 
            // Better to toggle controls immediately for responsiveness
            if (isLocked) {
                setShowControls(!showControls); // Show lock button
            } else {
                resetControlsTimeout();
            }
        }
    };

    const toggleLock = () => {
        setIsLocked(!isLocked);
        setShowControls(true);
        // If locking, hide controls after delay
        if (!isLocked) {
             if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
             controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
        }
    };

    const toggleResizeMode = () => {
        setResizeMode(prev => prev === ResizeMode.CONTAIN ? ResizeMode.COVER : ResizeMode.CONTAIN);
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!playbackUrl) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <Text className="text-white text-xl font-sans">Yükleniyor...</Text>
            </View>
        );
    }

    // TV Player (Larger controls, simpler UI)
    if (isTV) {
        return (
            <View className="flex-1 bg-black">
                <StatusBar hidden />
                <Pressable 
                    className="flex-1"
                    onPress={resetControlsTimeout}
                >
                    <Video
                        ref={videoRef}
                        source={{ uri: playbackUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay
                        useNativeControls={false}
                        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                    />

                    {showControls && (
                        <View className="absolute inset-0 bg-black/40">
                            {/* Top Bar */}
                            <View className="absolute top-0 left-0 right-0 p-12 flex-row items-center justify-between">
                                <Text className="text-white text-4xl font-bold font-sans">{title}</Text>
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="bg-black/60 p-4 rounded-full"
                                >
                                    <X size={36} color="white" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-1 justify-center items-center">
                                {/* Subtitle Overlay */}
                                {currentCue && (
                                    <View className="absolute bottom-32 px-12 bg-black/60 rounded p-2 mb-8">
                                        <Text className="text-white text-3xl font-sans text-center shadow-md">{currentCue}</Text>
                                    </View>
                                )}

                                <View className="flex-row items-center gap-12">
                                    <TouchableOpacity
                                        onPress={() => skip(-10)}
                                        className="bg-black/80 p-8 rounded-full border-2 border-white/20"
                                    >
                                        <SkipBack size={48} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={togglePlayPause}
                                        className="bg-primary p-10 rounded-full"
                                    >
                                        {isPlaying ? (
                                            <Pause size={60} color="white" fill="white" />
                                        ) : (
                                            <Play size={60} color="white" fill="white" />
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => skip(10)}
                                        className="bg-black/80 p-8 rounded-full border-2 border-white/20"
                                    >
                                        <SkipForward size={48} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Bottom Progress Bar */}
                            <View className="absolute bottom-0 left-0 right-0 p-12">
                                <View className="mb-4">
                                    <Slider
                                        style={{ width: '100%', height: 60 }}
                                        minimumValue={0}
                                        maximumValue={duration}
                                        value={position}
                                        onSlidingComplete={handleSeek}
                                        minimumTrackTintColor="#8b5cf6"
                                        maximumTrackTintColor="rgba(255,255,255,0.3)"
                                        thumbTintColor="#8b5cf6"
                                    />
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-white text-2xl font-sans">{formatTime(position)}</Text>
                                    <Text className="text-white text-2xl font-sans">{formatTime(duration)}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </Pressable>
            </View>
        );
    }

    // Mobile Player (Original)
    return (
        <View className="flex-1 bg-black">
            <StatusBar hidden />
            <Pressable 
                className="flex-1"
                onPress={handleScreenPress}
            >
                <Video
                    ref={videoRef}
                    source={{ uri: playbackUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={resizeMode}
                    shouldPlay
                    useNativeControls={false}
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                />

                {/* Lock Button (Always visible when controls shown) */}
                {showControls && (
                    <View className="absolute top-12 left-6 z-50">
                        <TouchableOpacity 
                            onPress={toggleLock}
                            className="bg-black/60 p-2 rounded-full"
                        >
                            {isLocked ? <Lock size={24} color="#ef4444" /> : <Unlock size={24} color="white" />}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Locked State Overlay */}
                {showControls && isLocked && (
                    <View className="absolute inset-0 justify-center items-center z-40 pointer-events-none">
                         <Text className="text-white/50 font-bold bg-black/40 px-4 py-2 rounded-lg">Screen Locked</Text>
                    </View>
                )}

                {showControls && !isLocked && (
                    <View className="absolute inset-0 bg-black/30">
                        <View 
                            className="absolute top-0 left-0 right-0 p-6 flex-row items-center justify-between"
                            style={{ paddingTop: insets.top + 10 }}
                        >
                            {/* Adjusted padding for Lock button on left */}
                            <Text className="text-white text-xl font-bold font-sans ml-12">{title}</Text>
                            
                            <View className="flex-row gap-4">
                                <TouchableOpacity 
                                    onPress={toggleResizeMode}
                                    className="bg-black/60 p-2 rounded-full"
                                >
                                    {resizeMode === ResizeMode.CONTAIN ? <Maximize2 size={24} color="white" /> : <Minimize2 size={24} color="white" />}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="bg-black/60 p-2 rounded-full"
                                >
                                    <X size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-1 justify-center items-center">
                            {/* Subtitle Overlay */}
                            {currentCue && (
                                <View className="absolute bottom-24 px-4 bg-black/50 rounded p-1 mb-8 max-w-[90%]">
                                    <Text className="text-white text-base font-sans text-center shadow-sm">{currentCue}</Text>
                                </View>
                            )}

                            <View className="flex-row items-center gap-8">
                                <TouchableOpacity
                                    onPress={() => skip(-10)}
                                    className="bg-black/60 p-4 rounded-full"
                                >
                                    <SkipBack size={28} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={togglePlayPause}
                                    className="bg-primary p-6 rounded-full"
                                >
                                    {isPlaying ? (
                                        <Pause size={36} color="white" fill="white" />
                                    ) : (
                                        <Play size={36} color="white" fill="white" />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => skip(10)}
                                    className="bg-black/60 p-4 rounded-full"
                                >
                                    <SkipForward size={28} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Subtitle Button (Top Right) */}
                         <View className="absolute top-20 right-6 z-50">
                            <TouchableOpacity 
                                onPress={() => setShowSubtitleMenu(!showSubtitleMenu)}
                                className="bg-black/60 p-2 rounded-full"
                            >
                                <SubtitlesIcon size={24} color={activeSubtitle ? "#8b5cf6" : "white"} />
                            </TouchableOpacity>
                        </View>

                        {/* Subtitle Menu Modal */}
                        {showSubtitleMenu && (
                            <Pressable 
                                className="absolute inset-0 bg-black/80 justify-center items-center z-50"
                                onPress={() => setShowSubtitleMenu(false)}
                            >
                                <View className="bg-gray-900 w-3/4 rounded-xl overflow-hidden border border-white/10">
                                    <Text className="text-white font-bold p-4 bg-gray-800 border-b border-white/10">Altyazılar</Text>
                                    <TouchableOpacity
                                        onPress={() => { setActiveSubtitle(null); setShowSubtitleMenu(false); }}
                                        className="p-4 border-b border-white/5 flex-row justify-between"
                                    >
                                        <Text className="text-white">Kapalı</Text>
                                        {!activeSubtitle && <Check size={20} color="#8b5cf6" />}
                                    </TouchableOpacity>
                                    {subtitles.map(sub => (
                                        <TouchableOpacity
                                            key={sub.id}
                                            onPress={() => { setActiveSubtitle(sub.id); setShowSubtitleMenu(false); }}
                                            className="p-4 border-b border-white/5 flex-row justify-between"
                                        >
                                            <Text className="text-white">{sub.label} ({sub.language})</Text>
                                            {activeSubtitle === sub.id && <Check size={20} color="#8b5cf6" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Pressable>
                        )}

                        <View 
                            className="absolute bottom-0 left-0 right-0 p-6"
                            style={{ paddingBottom: insets.bottom + 10 }}
                        >
                            <View className="mb-2">
                                <Slider
                                    style={{ width: '100%', height: 40 }}
                                    minimumValue={0}
                                    maximumValue={duration}
                                    value={position}
                                    onSlidingComplete={handleSeek}
                                    minimumTrackTintColor="#8b5cf6"
                                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                                    thumbTintColor="#8b5cf6"
                                />
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-white text-sm font-sans">{formatTime(position)}</Text>
                                <Text className="text-white text-sm font-sans">{formatTime(duration)}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </Pressable>
        </View>
    );
}
// Basic SRT/VTT Parser
const parseSubtitles = (text: string) => {
    const cues = [];
    const lines = text.replace(/\r/g, '').split('\n');
    let start: number | null = null;
    let end: number | null = null;
    let payload = [];
    
    // Time regex: 00:00:20,000 or 00:00:20.000
    const timeRegex = /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/;
    
    const timeToMs = (timeStr: string) => {
        const match = timeStr.match(timeRegex);
        if (!match) return 0;
        const [_, h, m, s, ms] = match;
        return (parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)) * 1000 + parseInt(ms);
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('-->')) {
            const times = line.split('-->');
            start = timeToMs(times[0].trim());
            end = timeToMs(times[1].trim());
            payload = [];
        } else if (line === '' && start !== null && end !== null) {
            cues.push({ start, end, text: payload.join('\n') });
            start = null;
            end = null;
            payload = [];
        } else if (start !== null) {
            // Skip index numbers if they appear solely on a line
            if (!/^\d+$/.test(line)) {
                payload.push(line);
            }
        }
    }
    // Push last cue if file doesn't end with empty line
    if (start !== null && end !== null && payload.length > 0) {
        cues.push({ start, end, text: payload.join('\n') });
    }
    
    return cues;
};
