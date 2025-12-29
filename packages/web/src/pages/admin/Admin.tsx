import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { scanLibrary } from '../../services/media';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import MediaManagement from '../../components/admin/MediaManagement';

const Admin = () => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<{ message: string, added: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'media' | 'library' | 'users'>('media');
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'viewer' });

    const handleScan = async () => {
        setScanning(true);
        setResult(null);
        setError(null);
        try {
            const res = await scanLibrary() as any; // Cast to any to handle new fields
            setResult({ message: res.message, added: res.added });
        } catch (err) {
            setError("Scan failed. Check console or server logs.");
        } finally {
            setScanning(false);
        }
    };

    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', newUser);
            setShowUserModal(false);
            setNewUser({ email: '', password: '', role: 'viewer' });
            alert("User created!");
            fetchUsers();
        } catch (err) {
            alert("Failed to create user");
        }
    };

    return (
        <div className="max-w-4xl mx-auto pt-10 px-6 pb-20">
            <h1 className="text-3xl font-bold mb-8">{t('sidebar.settings')}</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('media')}
                    className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'media' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-white/60 hover:text-white'}`}
                >
                    Media
                </button>
                <button
                    onClick={() => setActiveTab('library')}
                    className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'library' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-white/60 hover:text-white'}`}
                >
                    Library
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'users' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-white/60 hover:text-white'}`}
                >
                    Users
                </button>
            </div>

            {activeTab === 'media' && <MediaManagement />}

            {activeTab === 'library' && (
                <div className="bg-surface rounded-xl p-6 border border-white/5">
                    <h2 className="text-xl font-semibold mb-4">Library Management</h2>
                    <p className="text-white/60 mb-6">
                        Scan your MinIO bucket (bucket: <strong>filmler</strong>) for new content. System will automatically access the cloud storage.
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-medium"
                        >
                            <RefreshCw className={`h-5 w-5 ${scanning ? 'animate-spin' : ''}`} />
                            {scanning ? 'Scanning...' : 'Scan Library'}
                        </button>

                        {result && (
                            <div className="flex flex-col gap-2">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/20"
                                >
                                    <CheckCircle size={18} />
                                    <span className="font-mono text-sm">{result.message}</span>
                                </motion.div>
                            </div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-2 rounded-lg"
                            >
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">User Management</h2>
                        <button
                            onClick={() => setShowUserModal(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            + Add User
                        </button>
                    </div>

                    <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-white/60 text-sm uppercase">
                                <tr>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">{user.firstName} {user.lastName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-white/10 text-white/60'}`}>
                                                {user.role ? user.role.toUpperCase() : 'VIEWER'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-white/40">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">Create New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">Email</label>
                                <input
                                    type="email" required
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
                                <input
                                    type="password" required
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors text-white"
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUserModal(false)}
                                    className="flex-1 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary-600 hover:bg-primary-700 py-2 rounded-lg font-bold transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
