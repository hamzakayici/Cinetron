import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { getLibrary } from '../../services/api';
import { Media } from '../../constants/Types';
import MediaCard from '../../components/MediaCard';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const data = await getLibrary();
      setAllMedia(data);
      setFilteredMedia(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterMedia();
  }, [searchQuery, selectedFilter]);

  const filterMedia = () => {
    let filtered = allMedia;

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(m => m.type === selectedFilter || (selectedFilter === 'series' && m.type === 'tv'));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.overview?.toLowerCase().includes(query)
      );
    }

    setFilteredMedia(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
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
      <View className="px-5 py-4">
        <Text className="text-white text-2xl font-bold mb-4 font-sans">Ara</Text>

        {/* Search Input */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-white/10 mb-4">
          <SearchIcon size={20} color="#8b5cf6" />
          <TextInput
            className="flex-1 text-white ml-3 font-sans"
            placeholder="Film veya dizi ara..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
{searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} className="p-1">
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg ${selectedFilter === 'all' ? 'bg-primary' : 'bg-white/10'}`}
          >
            <Text className={`font-sans font-bold ${selectedFilter === 'all' ? 'text-white' : 'text-gray-400'}`}>
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('movie')}
            className={`px-4 py-2 rounded-lg ${selectedFilter === 'movie' ? 'bg-primary' : 'bg-white/10'}`}
          >
            <Text className={`font-sans font-bold ${selectedFilter === 'movie' ? 'text-white' : 'text-gray-400'}`}>
              Filmler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('series')}
            className={`px-4 py-2 rounded-lg ${selectedFilter === 'series' ? 'bg-primary' : 'bg-white/10'}`}
          >
            <Text className={`font-sans font-bold ${selectedFilter === 'series' ? 'text-white' : 'text-gray-400'}`}>
              Diziler
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      <ScrollView 
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredMedia.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {filteredMedia.map((media) => (
              <View key={media.id} className="mb-4">
                <MediaCard media={media} width={160} />
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <SearchIcon size={48} color="#374151" />
            <Text className="text-gray-500 font-sans mt-4 text-center">
              {searchQuery ? 'Sonuç bulunamadı' : 'Aramaya başlayın'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
