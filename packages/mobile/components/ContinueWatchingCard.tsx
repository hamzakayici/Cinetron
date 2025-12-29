import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Media } from '../constants/Types';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';

interface ContinueWatchingCardProps {
    media: Media;
    progress: number; // Progress in seconds
}

export default function ContinueWatchingCard({ media, progress }: ContinueWatchingCardProps) {
    const width = 280;
    const height = width * 9 / 16; // 16:9 aspect ratio for backdrop

    // Calculate progress percentage (assuming media has duration)
    const progressPercent = media.duration ? (progress / media.duration) * 100 : 0;

    return (
        <Link href={`/player/${media.id}`} asChild>
            <TouchableOpacity className="mr-4 active:scale-95 transition-transform duration-200">
                <View 
                    className="rounded-lg overflow-hidden bg-surface shadow-lg border border-white/5 relative" 
                    style={{ width, height }}
                >
                    {media.backdropUrl || media.posterUrl ? (
                        <Image
                            source={{ uri: media.backdropUrl || media.posterUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                            className="opacity-90"
                        />
                    ) : (
                        <LinearGradient
                            colors={['#1a1a1a', '#0a0a0a']}
                            className="w-full h-full"
                        />
                    )}

                    {/* Dark Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        className="absolute inset-0 justify-end p-3"
                    >
                        {/* Play Button Overlay */}
                        <View className="absolute inset-0 justify-center items-center">
                            <View className="bg-primary/80 rounded-full p-3">
                                <Play size={24} color="white" fill="white" />
                            </View>
                        </View>

                        {/* Title */}
                        <Text className="text-white font-bold font-sans text-sm mb-1" numberOfLines={1}>
                            {media.title}
                        </Text>

                        {/* Progress Bar */}
                        <View className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                            <View 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                        </View>
                    </LinearGradient>
                </View>
            </TouchableOpacity>
        </Link>
    );
}
