import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, StatusBar, TouchableWithoutFeedback } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useEffect, useState, useRef } from 'react';
import { getMediaDetail, getEpisodeDetail } from '../../services/api';
import * as ScreenOrientation from 'expo-screen-orientation';
import Slider from '@react-native-community/slider';
import { Play, Pause, RotateCcw, RotateCw, X, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlayerScreen() {
    const { id, episodeId } = useLocalSearchParams();
    const router = useRouter();
    const videoRef = useRef<Video>(null);
    const insets = useSafeAreaInsets();
    
    // Data State
    const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');

    // Player State
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Load & Orientation
    useEffect(() => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                if (episodeId && typeof episodeId === 'string') {
                    const ep = await getEpisodeDetail(episodeId);
                    if (ep && ep.playbackUrl) {
                        setPlaybackUrl(ep.playbackUrl);
                        setTitle(`${ep.seasonNumber}x${ep.episodeNumber}: ${ep.title}`);
                    }
                } else if (id && typeof id === 'string') {
                    const media = await getMediaDetail(id);
                    if (media && media.playbackUrl) {
                        setPlaybackUrl(media.playbackUrl);
                        setTitle(media.title);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, episodeId]);

    // Auto-hide controls
    useEffect(() => {
        resetControlsTimeout();
        return () => clearControlsTimeout();
    }, [showControls]);

    const resetControlsTimeout = () => {
        clearControlsTimeout();
        if (showControls) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    const clearControlsTimeout = () => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
    };

    const toggleControls = () => {
        if (showControls) {
            setShowControls(false);
        } else {
            setShowControls(true);
            resetControlsTimeout();
        }
    };

    const handleClose = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        router.back();
    };

    const formatTime = (millis: number) => {
        if (!millis) return "00:00";
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handlePlayPause = async () => {
        if (!videoRef.current || !status?.isLoaded) return;
        if (status.isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
        resetControlsTimeout();
    };

    const handleSeek = async (value: number) => {
        if (!videoRef.current) return;
        await videoRef.current.setPositionAsync(value);
        resetControlsTimeout();
    };

    const handleSkip = async (seconds: number) => {
        if (!videoRef.current || !status?.isLoaded) return;
        const newPosition = status.positionMillis + (seconds * 1000);
        await videoRef.current.setPositionAsync(newPosition);
        resetControlsTimeout();
    };

    if (loading) {
        return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator size="large" color="#8b5cf6" /></View>;
    }

    if (!playbackUrl) {
        return (
             <View className="flex-1 bg-black justify-center items-center">
                <Text className="text-white font-sans mb-4">Video URL Only</Text>
                <TouchableOpacity onPress={handleClose} className="bg-white/10 px-6 py-3 rounded-lg">
                    <Text className="text-white font-bold">Kapat</Text>
                </TouchableOpacity>
             </View>
        );
    }

    const isLoaded = status?.isLoaded;
    const position = isLoaded ? status.positionMillis : 0;
    const duration = isLoaded ? status.durationMillis || 0 : 0;

    return (
        <View className="flex-1 bg-black relative">
            <Stack.Screen options={{ headerShown: false, statusBarHidden: true }} />
            <StatusBar hidden />
            
            <TouchableWithoutFeedback onPress={toggleControls}>
                <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'black' }}>
                    <Video
                        ref={videoRef}
                        style={{ width: '100%', height: '100%' }}
                        source={{ uri: playbackUrl }}
                        useNativeControls={false}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay
                        onPlaybackStatusUpdate={setStatus}
                    />
                     {/* Overlay */}
                    {showControls && (
                        <View className="absolute inset-0 bg-black/40 justify-between z-10">
                            {/* Top Bar */}
                            <View 
                                className="flex-row items-center p-4 bg-gradient-to-b from-black/80 to-transparent"
                                style={{ paddingTop: insets.top > 20 ? insets.top : 20 }}
                            >
                                <TouchableOpacity onPress={handleClose} className="p-2 mr-4 bg-white/10 rounded-full">
                                    <ChevronLeft size={24} color="white" />
                                </TouchableOpacity>
                                <Text className="text-white font-bold font-sans text-lg tracking-wide shadow-black/50" numberOfLines={1}>
                                    {title}
                                </Text>
                            </View>

                            {/* Center Controls */}
                            <View className="flex-row items-center justify-center gap-12">
                                <TouchableOpacity onPress={() => handleSkip(-10)} className="p-4 bg-black/30 rounded-full">
                                    <RotateCcw size={32} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handlePlayPause} className="p-6 bg-primary/90 rounded-full shadow-lg shadow-primary/50">
                                    {isLoaded && status.isPlaying ? (
                                        <Pause size={40} color="white" fill="white" />
                                    ) : (
                                        <Play size={40} color="white" fill="white" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                                
                                <TouchableOpacity onPress={() => handleSkip(10)} className="p-4 bg-black/30 rounded-full">
                                    <RotateCw size={32} color="white" />
                                </TouchableOpacity>
                            </View>

                            {/* Bottom Bar */}
                            <View 
                                className="px-6 pb-6 pt-12 bg-gradient-to-t from-black/90 to-transparent"
                                style={{ paddingBottom: insets.bottom > 20 ? insets.bottom : 20 }}
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-white font-medium font-sans text-xs">{formatTime(position)}</Text>
                                    <Text className="text-white/70 font-medium font-sans text-xs">{formatTime(duration)}</Text>
                                </View>
                                <Slider
                                    style={{ width: '100%', height: 40 }}
                                    minimumValue={0}
                                    maximumValue={duration}
                                    value={position}
                                    onSlidingComplete={handleSeek}
                                    onSlidingStart={() => clearControlsTimeout()}
                                    minimumTrackTintColor="#8b5cf6"
                                    maximumTrackTintColor="#rgba(255,255,255,0.3)"
                                    thumbTintColor="#8b5cf6"
                                />
                            </View>
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
}
