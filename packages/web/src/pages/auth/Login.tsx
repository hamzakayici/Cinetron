import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.access_token);
            navigate('/library');
        } catch (err: any) {
            console.error('Login failed', err);
            setError(t('login.invalidCredentials') || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
            {/* Abstract Background Elements */}
            <div className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-primary-900/40 blur-[120px]" />
            <div className="absolute top-[40%] -right-[10%] h-[60vh] w-[60vh] rounded-full bg-primary-700/20 blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8"
            >
                <div className="mb-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center mb-6"
                    >
                        <img src="/logo.png" alt="Cinetron" className="h-24 w-auto drop-shadow-2xl" />
                    </motion.div>
                    <h1 className="sr-only">Cinetron</h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-3 text-sm font-medium text-white/40"
                    >
                        {t('welcome.subtitle')}
                    </motion.p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                    <div className="p-8">
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">{t('login.email')}</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/20 outline-none transition-all focus:border-primary-500 focus:bg-white/10 focus:ring-1 focus:ring-primary-500"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">{t('login.password')}</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/20 outline-none transition-all focus:border-primary-500 focus:bg-white/10 focus:ring-1 focus:ring-primary-500"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400 border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-800 px-4 py-3.5 font-bold text-white shadow-lg shadow-primary-900/40 transition-all hover:shadow-primary-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('login.submit')}
                            </motion.button>
                        </form>
                    </div>
                    <div className="border-t border-white/5 bg-white/5 px-8 py-4 text-center">
                        <p className="text-xs text-white/30">
                            {t('login.managedBy')}
                        </p>
                    </div>
                </div>
            </motion.div >

            {/* Bottom Gradient */}
            < div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div >
    );
};

export default Login;
