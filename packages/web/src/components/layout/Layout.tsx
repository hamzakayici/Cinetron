import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Settings, LogOut, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

const Layout = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const navItems = [
        { icon: LayoutGrid, label: t('sidebar.library'), path: '/library' },
        { icon: Settings, label: t('sidebar.settings'), path: '/admin' },
    ];

    return (
        <div className="flex h-screen bg-background text-white selection:bg-primary-500/30">
            {/* Minimalist Glass Sidebar */}
            <aside className="w-24 group hover:w-64 transition-[width] duration-500 ease-in-out border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col z-50 fixed inset-y-0 left-0">
                <div className="p-6 flex items-center gap-4 overflow-hidden whitespace-nowrap">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/50">
                        <Film className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Cinetron
                    </h1>
                </div>

                <nav className="flex-1 px-3 space-y-2 mt-8">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group-hover:px-4",
                                    isActive
                                        ? "bg-primary-600/10 text-primary-400"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon size={24} className={clsx("shrink-0 transition-colors", isActive ? "text-primary-400" : "text-white/40 group-hover:text-white")} />
                                <span className={clsx("font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300", isActive ? "text-primary-100" : "")}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full"
                                    />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => {
                            // Clear any stored tokens if they existed
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        className="flex items-center gap-4 px-3 py-3 w-full rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    >
                        <LogOut size={24} className="shrink-0" />
                        <span className="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
