import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { deleteUser, updateUserPassword } from '../../services/api';

import MediaManagement from '../../components/admin/MediaManagement';
import { UploadQueueProvider } from '../../context/UploadQueueContext';
import UploadManager from '../../components/admin/UploadManager';
import { Trash2, Key, UserPlus } from 'lucide-react';

const Admin = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'media' | 'users'>('media');
    
    // User Management State
    const [users, setUsers] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'viewer' });
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newPassword, setNewPassword] = useState('');

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
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'viewer' });
            alert(t('admin.userCreated'));
            fetchUsers();
        } catch (err) {
            alert(t('admin.userCreateFailed'));
        }
    };

    const handleDeleteUser = async (id: string, email: string) => {
        if (!confirm(t('admin.userDeleteConfirm', { email }))) return;
        try {
            await deleteUser(id);
            alert(t('admin.userDeleted'));
            fetchUsers();
        } catch (err) {
            alert(t('admin.userDeleteFailed'));
        }
    };

    const openPasswordModal = (user: any) => {
        setSelectedUser(user);
        setNewPassword('');
        setShowPasswordModal(true);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            await updateUserPassword(selectedUser.id, newPassword);
            alert(t('admin.passwordUpdated'));
            setShowPasswordModal(false);
            setSelectedUser(null);
            setNewPassword('');
        } catch (err) {
            alert(t('admin.passwordUpdateFailed'));
        }
    };

    return (
        <UploadQueueProvider>
            <div className="p-8 max-w-[1600px] mx-auto pb-24">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{t('admin.dashboard')}</h1>
                    <p className="text-white/60">{t('admin.manageContent')}</p>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'media' ? 'text-primary-400' : 'text-white/60 hover:text-white'}`}
                    >
                        {t('admin.mediaManagement')}
                        {activeTab === 'media' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'users' ? 'text-primary-400' : 'text-white/60 hover:text-white'}`}
                    >
                        {t('admin.userManagement')}
                        {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full" />}
                    </button>
                </div>

                {activeTab === 'media' && <MediaManagement />}

                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">{t('admin.users')}</h2>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <UserPlus size={18} />
                                {t('admin.addUser')}
                            </button>
                        </div>

                        <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-white/60 text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-4">{t('setup.email')}</th>
                                        <th className="px-6 py-4">{t('setup.firstName')} & {t('setup.lastName')}</th>
                                        <th className="px-6 py-4">{t('admin.role')}</th>
                                        <th className="px-6 py-4 text-right">{t('admin.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">{user.email}</td>
                                            <td className="px-6 py-4">{user.firstName} {user.lastName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-white/10 text-white/60'}`}>
                                                    {user.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleViewer')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openPasswordModal(user)}
                                                    className="p-2 text-white/40 hover:text-primary-400 hover:bg-white/10 rounded mr-2 transition-colors"
                                                    title={t('admin.changePassword')}
                                                >
                                                    <Key size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                                    className="p-2 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                                    title={t('admin.actions')}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-white/40">{t('admin.noResults')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Create User Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-6">{t('admin.createUser')}</h2>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">{t('setup.email')}</label>
                                    <input
                                        type="email" required
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-1">{t('setup.firstName')}</label>
                                        <input
                                            type="text"
                                            value={newUser.firstName}
                                            onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-1">{t('setup.lastName')}</label>
                                        <input
                                            type="text"
                                            value={newUser.lastName}
                                            onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">{t('setup.password')}</label>
                                    <input
                                        type="password" required
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">{t('admin.role')}</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors text-white"
                                    >
                                        <option value="viewer">{t('admin.roleViewer')}</option>
                                        <option value="admin">{t('admin.roleAdmin')}</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                                    >
                                        {t('admin.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary-600 hover:bg-primary-700 py-2 rounded-lg font-bold transition-colors"
                                    >
                                        {t('admin.addUser')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Change Password Modal */}
                {showPasswordModal && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-2">{t('admin.changePassword')}</h2>
                            <p className="text-white/60 text-sm mb-6" dangerouslySetInnerHTML={{ __html: t('admin.updatingPasswordFor', { email: selectedUser.email }) }}></p>
                            
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-1">{t('admin.newPassword')}</label>
                                    <input
                                        type="password" required
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-primary-500 outline-none transition-colors"
                                        placeholder={t('admin.newPassword')}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                                    >
                                        {t('admin.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary-600 hover:bg-primary-700 py-2 rounded-lg font-bold transition-colors"
                                    >
                                        {t('admin.updatePassword')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <UploadManager />
            </div>
        </UploadQueueProvider>
    );
};

export default Admin;
