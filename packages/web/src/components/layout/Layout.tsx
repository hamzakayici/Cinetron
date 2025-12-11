import { Outlet, Link } from 'react-router-dom';
import { LayoutGrid, Settings, LogOut, Film } from 'lucide-react';

const Layout = () => {
    return (
        <div className="flex h-screen bg-slate-950 text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-cyan-500 flex items-center gap-2">
                        <Film className="h-8 w-8" />
                        Cinetron
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/library" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                        <LayoutGrid size={20} />
                        Library
                    </Link>
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                        <Settings size={20} />
                        Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="flex items-center gap-3 px-4 py-2 w-full text-slate-400 hover:text-white transition-colors">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-950 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
