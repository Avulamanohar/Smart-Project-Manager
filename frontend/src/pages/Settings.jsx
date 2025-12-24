import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion } from 'framer-motion';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);

    // Profile State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    // Security State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityError, setSecurityError] = useState('');
    const [securitySuccess, setSecuritySuccess] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            const { data } = await api.put('/auth/profile', { name, email });
            // Update context to reflect changes immediately
            updateUser(data);
            setProfileSuccess('Profile updated successfully');
        } catch (error) {
            setProfileError(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setSecurityError("Passwords do not match");
            return;
        }

        setLoading(true);
        setSecurityError('');
        setSecuritySuccess('');

        try {
            const { data } = await api.put('/auth/profile', { password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setSecuritySuccess('Password updated successfully');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            setSecurityError(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
            >
                <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
                <p className="text-slate-400">Manage your account preferences and security.</p>
            </motion.header>

            <div className="bg-dark-card border border-slate-800 rounded-2xl overflow-hidden max-w-4xl">
                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-8 py-4 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-8 py-4 text-sm font-medium transition-colors ${activeTab === 'security' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                    >
                        Security
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'profile' ? (
                        <motion.form
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleUpdateProfile}
                            className="max-w-lg space-y-6"
                        >
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            {profileError && <p className="text-red-500 text-sm">{profileError}</p>}
                            {profileSuccess && <p className="text-green-500 text-sm">{profileSuccess}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleUpdatePassword}
                            className="max-w-lg space-y-6"
                        >
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {securityError && <p className="text-red-500 text-sm">{securityError}</p>}
                            {securitySuccess && <p className="text-green-500 text-sm">{securitySuccess}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </motion.form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
