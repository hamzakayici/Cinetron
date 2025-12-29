import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, LogOut, Server, Info } from 'lucide-react-native';
import { getServerUrl } from '../../services/api';
import { useState, useEffect } from 'react';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    loadServerInfo();
  }, []);

  const loadServerInfo = async () => {
    const url = await getServerUrl();
    setServerUrl(url);
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-5 py-6">
          <Text className="text-white text-2xl font-bold font-sans">Profil</Text>
        </View>

        {/* Profile Info */}
        <View className="items-center py-8">
          <View className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary justify-center items-center mb-4">
            <User size={40} color="#8b5cf6" />
          </View>
          <Text className="text-white text-xl font-bold font-sans">Kullanıcı</Text>
          <Text className="text-gray-400 font-sans mt-1">Cinetron Kullanıcısı</Text>
        </View>

        {/* Settings */}
        <View className="px-5 space-y-4">
          {/* Server Info */}
          <View className="bg-surface rounded-xl p-4 border border-white/5">
            <View className="flex-row items-center mb-2">
              <Server size={20} color="#8b5cf6" />
              <Text className="text-white font-bold font-sans ml-3">Sunucu Bilgisi</Text>
            </View>
            <Text className="text-gray-400 font-sans text-sm ml-8">{serverUrl}</Text>
          </View>

          {/* App Info */}
          <View className="bg-surface rounded-xl p-4 border border-white/5">
            <View className="flex-row items-center mb-2">
              <Info size={20} color="#8b5cf6" />
              <Text className="text-white font-bold font-sans ml-3">Uygulama Bilgisi</Text>
            </View>
            <View className="ml-8 space-y-1">
              <Text className="text-gray-400 font-sans text-sm">Versiyon: 1.0.0</Text>
              <Text className="text-gray-400 font-sans text-sm">Build: 1</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-600/20 border border-red-600 rounded-xl p-4 flex-row items-center justify-center mt-4 active:scale-95"
          >
            <LogOut size={20} color="#dc2626" />
            <Text className="text-red-600 font-bold font-sans ml-3">Çıkış Yap</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View className="items-center py-8">
            <Image 
              source={require('../../assets/images/logo.png')} 
              className="w-32 h-10"
              resizeMode="contain"
            />
            <Text className="text-gray-600 font-sans text-xs mt-2">Kişisel Sinemanız</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
