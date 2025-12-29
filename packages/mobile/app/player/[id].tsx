import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { getMediaDetail, getEpisodeDetail } from '../../services/api';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react-native';
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

    useEffect(() => {
        loadMedia();
    }, [id]);

    const loadMedia = async () => {
        try {
            if (!id || typeof id !== 'string') return;
            const isEpisode = id.includes('episode-');
            const data = isEpisode ? await getEpisodeDetail(id) : await getMediaDetail(id);
            setPlaybackUrl(data.playbackUrl);
            setTitle(data.title);
        } catch (error) {
            console.error('Failed to load media:', error);
        }
    };

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setDuration(status.durationMillis || 0);
            setPosition(status.positionMillis || 0);
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
        setShowControls(true);
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, isTV ? 5000 : 3000); // TV'de daha uzun süre göster
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

                            {/* Center Controls */}
                            <View className="flex-1 justify-center items-center">
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
                    <View className="absolute inset-0 bg-black/30">
                        <View 
                            className="absolute top-0 left-0 right-0 p-6 flex-row items-center justify-between"
                            style={{ paddingTop: insets.top + 10 }}
                        >
                            <Text className="text-white text-xl font-bold font-sans">{title}</Text>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="bg-black/60 p-2 rounded-full"
                            >
                                <X size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-1 justify-center items-center">
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
