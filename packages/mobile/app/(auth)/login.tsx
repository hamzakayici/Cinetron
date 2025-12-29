import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api, { setServerUrl, getServerUrl } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import { Settings } from 'lucide-react-native';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [serverAddress, setServerAddress] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    useEffect(() => {
        getServerUrl().then(setServerAddress);
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin');
            return;
        }

        if (serverAddress) {
            await setServerUrl(serverAddress);
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data && res.data.access_token) {
                signIn(res.data.access_token);
            }
        } catch (err: any) {
            console.error(err);
            Alert.alert(
                'Giriş Başarısız', 
                err.response?.data?.message || 'Sunucuya bağlanılamadı. Lütfen sunucu adresini kontrol edin.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-black"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View className="flex-1 bg-black justify-center px-8">
                    <Stack.Screen options={{ headerShown: false }} />
                    <StatusBar style="light" />
                    
                    <View className="mb-12 items-center">
                        <Text className="text-5xl font-black text-white tracking-tighter shadow-lg shadow-purple-500/50">CINETRON</Text>
                        <Text className="text-white/60 text-lg mt-2 font-light">Kişisel Sinemanız</Text>
                    </View>

                    <View className="space-y-4 gap-4">
                        <View>
                            <Text className="text-white/70 mb-2 ml-1 font-medium">E-posta</Text>
                            <TextInput
                                className="bg-white/10 text-white rounded-xl px-4 py-4 border border-white/5 focus:border-purple-500"
                                placeholder="E-posta adresiniz"
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View>
                            <Text className="text-white/70 mb-2 ml-1 font-medium">Şifre</Text>
                            <TextInput
                                className="bg-white/10 text-white rounded-xl px-4 py-4 border border-white/5 focus:border-purple-500"
                                placeholder="Şifreniz"
                                placeholderTextColor="#666"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        {showSettings && (
                            <View>
                                <Text className="text-white/70 mb-2 ml-1 font-medium">Sunucu Adresi</Text>
                                <TextInput
                                    className="bg-white/10 text-white rounded-xl px-4 py-4 border border-white/5 focus:border-purple-500"
                                    placeholder="http://192.168.1.100:3000"
                                    placeholderTextColor="#666"
                                    autoCapitalize="none"
                                    value={serverAddress}
                                    onChangeText={setServerAddress}
                                />
                                <Text className="text-xs text-white/40 mt-1 ml-1">Yerel ağ IP adresinizi kullanın (localhost mobilde çalışmaz)</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            className={`bg-purple-600 rounded-xl py-4 mt-4 items-center shadow-lg shadow-purple-900/40 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Giriş Yap</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => setShowSettings(!showSettings)}
                            className="items-center mt-4 p-2"
                        >
                            <Text className="text-white/30 text-sm">
                                {showSettings ? "Ayarları Gizle" : "Sunucu Ayarları"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
