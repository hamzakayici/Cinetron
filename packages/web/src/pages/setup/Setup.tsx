import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, Globe, User, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api';

const Setup = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });

    const [error, setError] = useState('');

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.post('/system/setup', formData);
            // Setup complete, try to auto login or redirect to login
            // For now, redirect to login
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            setStep(3); // Success step
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Setup failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-background to-background" />

            <div className="w-full max-w-2xl relative z-10">
                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/50 mb-6"
                    >
                        <span className="text-3xl font-bold">C</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">{t('welcome.title')}</h1>
                    <p className="text-white/40">{t('welcome.subtitle')}</p>
                </div>

                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-white/5">
                        <motion.div
                            className="h-full bg-primary-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    <div className="p-8 md:p-12 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-3">
                                            <Globe className="text-primary-400" />
                                            {t('welcome.selectLanguage')}
                                        </h2>

                                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                            <button
                                                onClick={() => changeLanguage('tr')}
                                                className={`p-6 rounded-2xl border transition-all duration-300 ${i18n.language === 'tr' ? 'bg-primary-600/20 border-primary-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                            >
                                                <div className="text-4xl mb-2">🇹🇷</div>
                                                <div className="font-bold">Türkçe</div>
                                            </button>

                                            <button
                                                onClick={() => changeLanguage('en')}
                                                className={`p-6 rounded-2xl border transition-all duration-300 ${i18n.language === 'en' ? 'bg-primary-600/20 border-primary-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                            >
                                                <div className="text-4xl mb-2">🇺🇸</div>
                                                <div className="font-bold">English</div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-white/90 transition-colors"
                                        >
                                            {t('welcome.next')}
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                        <User className="text-primary-400" />
                                        {t('setup.adminTitle')}
                                    </h2>

                                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t('setup.firstName')}</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.firstName}
                                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t('setup.lastName')}</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t('setup.email')}</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase text-white/40 mb-2">{t('setup.password')}</label>
                                            <input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-colors"
                                            />
                                        </div>

                                        {error && (
                                            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                                                {error}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-6">
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="text-white/60 hover:text-white transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50"
                                            >
                                                {isLoading && <Loader2 className="animate-spin" size={20} />}
                                                {t('setup.complete')}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center text-center h-[300px]"
                                >
                                    <div className="h-20 w-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                                        <Check size={40} />
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">{t('setup.success')}</h2>
                                    <p className="text-white/40">{t('setup.redirecting')}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Setup;
