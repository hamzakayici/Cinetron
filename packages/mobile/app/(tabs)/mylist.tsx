import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { getFavorites } from '../../services/api';
import { Media } from '../../constants/Types';
import MediaCard from '../../components/MediaCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';

export default function MyListScreen() {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 py-6 border-b border-white/5">
        <View className="flex-row items-center">
          <Heart size={24} color="#8b5cf6" fill="#8b5cf6" />
          <Text className="text-white text-2xl font-bold font-sans ml-3">Listem</Text>
        </View>
        <Text className="text-gray-400 text-sm font-sans mt-2">
          {favorites.length} {favorites.length === 1 ? 'içerik' : 'içerik'}
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {favorites.map((media) => (
              <View key={media.id} className="mb-4">
                <MediaCard media={media} width={160} />
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <Heart size={64} color="#374151" />
            <Text className="text-gray-500 font-sans mt-4 text-center text-lg">
              Listeniz boş
            </Text>
            <Text className="text-gray-600 font-sans mt-2 text-center px-8">
              Beğendiğiniz içerikleri eklemek için ❤️ simgesine dokunun
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
