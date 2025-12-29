import { ScrollView, Image, TouchableOpacity, View, Text, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { getLibrary, getHistory } from '../../services/api';
import { Media } from '../../constants/Types';
import MediaCard from '../../components/MediaCard';
import ContinueWatchingCard from '../../components/ContinueWatchingCard';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Plus } from 'lucide-react-native';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [medias, setMedias] = useState<Media[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [mediaData, historyData] = await Promise.all([
        getLibrary(),
        getHistory().catch(() => [])
      ]);
      setMedias(mediaData);
      setHistory(historyData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const heroItem = medias.length > 0 ? medias[0] : null;
  const recentAdded = medias.slice(0, 10);
  const series = medias.filter(m => m.type === 'series' || m.type === 'tv');
  const movies = medias.filter(m => m.type === 'movie');

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {heroItem ? (
          <View style={{ width: '100%', height: 500, position: 'relative' }}>
            {heroItem.posterUrl || heroItem.backdropUrl ? (
                <Image
                  source={{ uri: heroItem.backdropUrl || heroItem.posterUrl }}
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
            {/* Cinematic Vignette */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.2)', '#000000']}
              locations={[0, 0.6, 1]}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 24 }}
            >
              <Text className="text-primary-400 font-bold tracking-widest text-xs uppercase mb-2 font-sans">
                Öne Çıkan
              </Text>
              <Text className="text-white text-3xl font-bold mb-3 shadow-lg font-sans" numberOfLines={2}>
                {heroItem.title}
              </Text>
              <Text className="text-gray-300 text-sm mb-6 font-sans leading-5" numberOfLines={2}>
                {heroItem.overview}
              </Text>
              
              <View className="flex-row gap-3">
                <Link href={`/media/${heroItem.id}`} asChild>
                    <TouchableOpacity className="bg-primary px-6 py-3 rounded-lg flex-1 flex-row items-center justify-center active:scale-95 transition-transform shadow-lg shadow-purple-500/30">
                        <Play size={20} color="white" fill="white" />
                        <Text className="text-white font-bold ml-2 font-sans">İzle</Text>
                    </TouchableOpacity>
                </Link>
                <Link href={`/media/${heroItem.id}`} asChild>
                    <TouchableOpacity className="bg-white/10 px-5 py-3 rounded-lg flex-row items-center justify-center border border-white/10 active:scale-95 transition-transform backdrop-blur-md">
                       <Plus size={20} color="white" />
                    </TouchableOpacity>
                </Link>
              </View>
            </LinearGradient>
          </View>
        ) : null}

        <View className="px-5" style={{ marginTop: 32 }}>
          {history.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-bold font-sans">Kaldığın Yerden Devam Et</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {history.map((item) => (
                  <ContinueWatchingCard 
                    key={item.media.id} 
                    media={item.media} 
                    progress={item.progress} 
                  />
                ))}
              </ScrollView>
            </View>
          )}
          <View style={{ marginBottom: 32 }}>
            <Section title="Son Eklenenler" items={recentAdded} />
          </View>
          {series.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <Section title="Diziler" items={series} />
            </View>
          )}
          {movies.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <Section title="Filmler" items={movies} />
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Floating Header */}
      <View 
         className="absolute top-0 left-0 right-0 px-6 z-50"
         style={{ paddingTop: insets.top + 10 }}
      >
          <View className="flex-row items-center justify-between">
            <Image 
                source={require('../../assets/images/logo.png')} 
                className="w-28 h-9"
                resizeMode="contain"
            />
            <View className="shadow-lg shadow-black/50">
                 <Image 
                   source={{ uri: 'https://github.com/shadcn.png' }} 
                   className="w-10 h-10 rounded-full border-2 border-white/30"
                />
            </View>
          </View>
      </View>
    </View>
  );
}

const Section = ({ title, items }: { title: string, items: Media[] }) => (
  <View>
    <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-bold font-sans">{title}</Text>
        <Text className="text-primary text-xs font-bold uppercase">Tümünü Gör</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
      {items.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </ScrollView>
  </View>
);
