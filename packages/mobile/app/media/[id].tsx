import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getMediaDetail, toggleFavorite } from '../../services/api';
import { Media, Episode } from '../../constants/Types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Play, Heart } from 'lucide-react-native';

export default function MediaDetailScreen() {
    const { id } = useLocalSearchParams();
    const [media, setMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            if (id && typeof id === 'string') {
                try {
                    const data = await getMediaDetail(id);
                    setMedia(data);
                    // TODO: Get actual favorite status from API
                    // For now, assume not favorite
                    setIsFavorite(false);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            }
        };
        load();
    }, [id]);

    const handleToggleFavorite = async () => {
        if (!media || favoriteLoading) return;
        
        setFavoriteLoading(true);
        try {
            await toggleFavorite(media.id);
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        } finally {
            setFavoriteLoading(false);
        }
    };

    if (loading) {
        return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator size="large" color="#10b981" /></View>;
    }

    if (!media) {
        return <View className="flex-1 bg-background justify-center items-center"><Text className="text-white font-sans">Media Not Found</Text></View>;
    }

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Hero / Backdrop */}
                <View style={{ width: '100%', height: 450, position: 'relative' }}>
                    {media.posterUrl || media.backdropUrl ? (
                        <Image
                            source={{ uri: media.posterUrl || media.backdropUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={['#2e1065', '#000000']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}
                    <LinearGradient
                        colors={['transparent', 'rgba(10,10,10,0.4)', '#0a0a0a']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 20 }}
                    >
                        <View className="absolute top-12 left-0 right-0 flex-row items-center justify-between px-4">
                            <TouchableOpacity onPress={() => router.back()} className="bg-black/40 p-2 rounded-full border border-white/10">
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleToggleFavorite}
                                disabled={favoriteLoading}
                                className="bg-black/40 p-2 rounded-full border border-white/10 active:scale-95"
                            >
                                <Heart 
                                    size={24} 
                                    color={isFavorite ? "#8b5cf6" : "white"} 
                                    fill={isFavorite ? "#8b5cf6" : "transparent"}
                                />
                            </TouchableOpacity>
                        </View>
                        
                        <Text className="text-primary-400 font-bold font-sans tracking-wider uppercase text-xs mb-2">
                            {media.type} • {media.year}
                        </Text>
                        <Text className="text-white text-4xl font-bold font-sans mb-4 shadow-lg leading-tight">
                            {media.title}
                        </Text>
                    </LinearGradient>
                </View>

                <View className="px-5 -mt-6">
                   {media.type === 'movie' && (
                        <TouchableOpacity 
                            className="bg-primary-600 flex-row items-center justify-center py-3.5 rounded-lg mb-6 shadow-lg shadow-primary-900/50 active:scale-95 transition-transform"
                            onPress={() => router.push(`/player/${media.id}`)}
                        >
                            <Play color="white" fill="white" size={20} />
                            <Text className="text-white font-bold ml-2 font-sans">Hemen İzle</Text>
                        </TouchableOpacity>
                   )}

                    <Text className="text-gray-300 leading-7 font-sans mb-8 text-base">
                        {media.overview || "Özet bulunamadı."}
                    </Text>

                    {/* Episodes List */}
                    {media.type === 'series' && media.episodes && media.episodes.length > 0 && (
                        <View>
                            <Text className="text-white text-lg font-bold font-sans mb-4">Bölümler</Text>
                            {media.episodes.map((episode) => (
                                <View key={episode.id} className="mb-4 bg-gray-900 rounded-lg overflow-hidden flex-row">
                                     <View className="w-32 h-20 bg-gray-800 relative">
                                         {episode.stillUrl ? (
                                            <Image source={{ uri: episode.stillUrl }} className="w-full h-full" resizeMode="cover" />
                                         ) : (
                                            <View className="w-full h-full justify-center items-center"><Play size={24} color="#666" /></View>
                                         )}
                                          <View className="absolute inset-0 bg-black/30 justify-center items-center">
                                                <TouchableOpacity onPress={() => router.push({ pathname: `/player/${media.id}`, params: { episodeId: episode.id } })}>
                                                    <Ionicons name="play-circle" size={32} color="white" />
                                                </TouchableOpacity>
                                          </View>
                                     </View>
                                     <View className="flex-1 p-3 justify-center">
                                         <Text className="text-white font-bold text-sm mb-1">{episode.seasonNumber}x{episode.episodeNumber} - {episode.title}</Text>
                                         <Text className="text-gray-400 text-xs line-clamp-2" numberOfLines={2}>{episode.overview}</Text>
                                     </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
