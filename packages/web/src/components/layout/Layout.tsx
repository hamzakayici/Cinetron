import { Outlet, Link, useLocation } from 'react-router-dom';
import { Settings, LogOut, Search, Film, Tv, List, History, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

const Layout = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const navItems = [
        { icon: Home, label: t('sidebar.home') || 'Home', path: '/library' }, // Currently Library is Home
        { icon: Search, label: t('sidebar.search') || 'Search', path: '/search' },
        { icon: Film, label: t('sidebar.movies') || 'Movies', path: '/movies' },
        { icon: Tv, label: t('sidebar.series') || 'Series', path: '/series' },
        { icon: List, label: t('sidebar.mylist') || 'My List', path: '/list' },
        { icon: History, label: t('sidebar.history') || 'History', path: '/history' },
        { icon: Settings, label: t('sidebar.settings'), path: '/admin', roles: ['admin'] },
    ];

    // Get user role from token
    let userRole = 'viewer';
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role || 'viewer';
        }
    } catch (e) {
        console.error("Failed to parse token", e);
    }

    const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(userRole));

    return (
        <div className="flex h-screen bg-background text-white selection:bg-primary-500/30">
            {/* Premium Glass Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-20 hover:w-72 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group border-r border-white/5 bg-black/40 backdrop-blur-2xl shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
                {/* Logo Section */}
                <div className="h-24 flex items-center justify-center relative shadow-sm">
                    {/* Collapsed Logo */}
                    <img
                        src="/favicon.png"
                        alt="Icon"
                        className="absolute h-8 w-8 object-contain transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 opacity-100"
                    />

                    {/* Expanded Logo */}
                    <div className="absolute inset-0 flex items-center px-6 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                        <img src="/logo.png" alt="Cinetron" className="h-8 w-auto object-contain" />
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 space-y-1 mt-6">
                    {filteredNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "relative flex items-center h-12 px-3.5 rounded-xl transition-all duration-300 overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-primary-600/20 to-primary-600/5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                                        : "text-white/50 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {/* Active Glow Pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full shadow-[0_0_12px_#8b5cf6]"
                                    />
                                )}

                                <div className="min-w-[24px] flex justify-center">
                                    <item.icon
                                        size={22}
                                        className={clsx(
                                            "transition-colors duration-300",
                                            isActive ? "text-primary-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "group-hover:text-white"
                                        )}
                                    />
                                </div>

                                <span className={clsx(
                                    "ml-4 font-medium whitespace-nowrap transition-all duration-300 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0",
                                    isActive ? "text-white" : "text-white/60 group-hover:text-white"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        className="flex items-center h-12 px-3.5 w-full rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors group/logout"
                    >
                        <LogOut size={22} className="shrink-0 transition-transform group-hover/logout:-translate-x-1" />
                        <span className="ml-4 font-medium whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            {t('sidebar.logout')}
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-24 relative">
                {/* Top Overlay Gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent z-10 pointer-events-none" />

                {/* Scrollable Content */}
                <div className="h-full overflow-y-auto overflow-x-hidden scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
