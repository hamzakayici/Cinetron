import React, { useState } from 'react';
import { View, Text, Image, Pressable, Platform } from 'react-native';
import { Media } from '../constants/Types';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageOff } from 'lucide-react-native';

interface TVMediaCardProps {
    media: Media;
    width?: number;
}

export default function TVMediaCard({ media, width = 240 }: TVMediaCardProps) {
    const [focused, setFocused] = useState(false);
    const [imageError, setImageError] = useState(false);
    const height = width * 3 / 2;

    // Only enable TV focus on Android TV
    const isTVPlatform = Platform.isTV || Platform.OS === 'android';

    return (
        <Link href={`/media/${media.id}`} asChild>
            <Pressable
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width,
                    height,
                    transform: [{ scale: focused ? 1.1 : 1 }],
                    margin: 12, // Extra spacing for TV D-pad navigation
                }}
                className={`active:scale-95 transition-all duration-200 ${focused ? 'z-10' : ''}`}
            >
                <View
                    className={`rounded-xl overflow-hidden relative ${
                        focused ?'ring-4 ring-primary shadow-2xl shadow-primary/50' : 'shadow-lg'
                    }`}
                    style={{ width: '100%', height: '100%' }}
                >
                    {media.posterUrl && !imageError ? (
                        <Image
                            source={{ uri: media.posterUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <LinearGradient
                            colors={['#1a1a1a', '#0a0a0a']}
                            className="w-full h-full justify-center items-center p-4"
                        >
                            <ImageOff size={48} color="#4b5563" />
                            <Text
                                className="text-white text-center mt-4 font-bold font-sans"
                                numberOfLines={3}
                                style={{ fontSize: focused ? 18 : 16 }}
                            >
                                {media.title}
                            </Text>
                        </LinearGradient>
                    )}

                    {/* Title Overlay (for images) */}
                    {media.posterUrl && !imageError && (
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.9)']}
                            className="absolute bottom-0 left-0 right-0 p-3"
                        >
                            <Text
                                className="text-white font-bold font-sans"
                                numberOfLines={2}
                                style={{ fontSize: focused ? 20 : 16 }}
                            >
                                {media.title}
                            </Text>
                            {media.year && (
                                <Text className="text-gray-400 font-sans text-sm mt-1">
                                    {media.year}
                                </Text>
                            )}
                        </LinearGradient>
                    )}

                    {/* Focus Indicator */}
                    {focused && (
                        <View className="absolute inset-0 border-4 border-primary rounded-xl pointer-events-none" />
                    )}
                </View>
            </Pressable>
        </Link>
    );
}
