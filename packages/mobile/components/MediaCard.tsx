import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Media } from '../constants/Types';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageOff } from 'lucide-react-native';

interface MediaCardProps {
    media: Media;
    width?: number;
    height?: number;
}

export default function MediaCard({ media, width = 140 }: MediaCardProps) {
    // Standard Poster Ratio 2:3
    const height = width * 1.5;
    const [imageError, setImageError] = useState(false);

    const hasImage = (media.posterUrl || media.backdropUrl) && !imageError;

    return (
        <Link href={`/media/${media.id}`} asChild>
            <TouchableOpacity className="mr-4 active:scale-95 transition-transform duration-200">
                <View 
                    className="rounded-lg overflow-hidden bg-surface shadow-lg border border-white/5 relative" 
                    style={{ width, height }}
                >
                    {hasImage ? (
                        <Image
                            source={{ uri: media.posterUrl || media.backdropUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                            className="w-full h-full opacity-90"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <LinearGradient
                            colors={['#1a1a1a', '#0a0a0a']}
                            className="w-full h-full justify-center items-center p-2"
                        >
                            <ImageOff size={24} color="#333" />
                            <Text className="text-white/30 text-xs text-center font-sans mt-2" numberOfLines={3}>
                                {media.title}
                            </Text>
                        </LinearGradient>
                    )}
                </View>
                <Text 
                    className="text-gray-300 mt-2 font-sans font-medium text-xs pl-1" 
                    numberOfLines={1} 
                    style={{ width }}
                >
                    {media.title}
                </Text>
            </TouchableOpacity>
        </Link>
    );
}
