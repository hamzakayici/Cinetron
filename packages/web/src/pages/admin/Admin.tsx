import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import MediaManagement from '../../components/admin/MediaManagement';
import { UploadQueueProvider } from '../../context/UploadQueueContext';
import UploadManager from '../../components/admin/UploadManager';

const Admin = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'media' | 'users'>('media');
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'viewer' });



    const [users, setUsers] = useState<any[]>([]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

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
        <UploadQueueProvider>
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
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'users' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-white/60 hover:text-white'}`}
                >
                    Users
                </button>
            </div>

            {activeTab === 'media' && <MediaManagement />}



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
            {/* Upload Manager UI */}
            <UploadManager />
            </div>
        </UploadQueueProvider>
    );
};

export default Admin;
