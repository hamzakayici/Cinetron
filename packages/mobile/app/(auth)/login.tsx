import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api, { setServerUrl, getServerUrl } from '../../services/api';
import { StatusBar } from 'expo-status-bar';

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
            className="flex-1 bg-background"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View className="flex-1 bg-background justify-center px-8">
                    <Stack.Screen options={{ headerShown: false }} />
                    <StatusBar style="light" />
                    
                    <View className="mb-12 items-center">
                        <Image 
                            source={require('../../assets/images/logo.png')} 
                            className="w-48 h-16 mb-4"
                            resizeMode="contain"
                        />
                        <Text className="text-white/60 text-lg font-light font-sans">Kişisel Sinemanız</Text>
                    </View>

                    <View className="space-y-4 gap-4">
                        <View>
                            <Text className="text-white/70 mb-2 ml-1 font-medium font-sans">E-posta</Text>
                            <TextInput
                                className="bg-surface text-white rounded-xl px-4 py-4 border border-white/10 focus:border-primary font-sans"
                                placeholder="E-posta adresiniz"
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View>
                            <Text className="text-white/70 mb-2 ml-1 font-medium font-sans">Şifre</Text>
                            <TextInput
                                className="bg-surface text-white rounded-xl px-4 py-4 border border-white/10 focus:border-primary font-sans"
                                placeholder="Şifreniz"
                                placeholderTextColor="#666"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        {showSettings && (
                            <View>
                                <Text className="text-white/70 mb-2 ml-1 font-medium font-sans">Sunucu Adresi</Text>
                                <TextInput
                                    className="bg-surface text-white rounded-xl px-4 py-4 border border-white/10 focus:border-primary font-sans"
                                    placeholder="http://192.168.1.100:3000"
                                    placeholderTextColor="#666"
                                    autoCapitalize="none"
                                    value={serverAddress}
                                    onChangeText={setServerAddress}
                                />
                                <Text className="text-xs text-white/40 mt-1 ml-1 font-sans">Yerel ağ IP adresinizi kullanın (localhost mobilde çalışmaz)</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            className={`bg-primary rounded-xl py-4 mt-6 items-center shadow-lg shadow-primary-900/40 active:scale-95 transition-transform ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg font-sans">Giriş Yap</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => setShowSettings(!showSettings)}
                            className="items-center mt-4 p-2"
                        >
                            <Text className="text-white/30 text-sm font-sans">
                                {showSettings ? "Ayarları Gizle" : "Sunucu Ayarları"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
