import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { FiArrowLeft, FiMail, FiUser, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const TeamMembers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/auth/users');
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
                setError("Failed to load directory. Please try restarting the backend server.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] p-6 lg:p-12 transition-colors duration-300 font-sans">
            <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link to="/" className="inline-flex items-center text-slate-500 hover:text-primary transition-colors mb-4 gap-2">
                        <FiArrowLeft /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Team Members <span className="text-primary">({users.length})</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                        Meet the people building the future.
                    </p>
                </div>

                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-base rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary block pl-12 p-4 transition-all placeholder-slate-400 shadow-sm"
                        placeholder="Search team members..."
                    />
                </div>
            </header>

            {error && (
                <div className="max-w-7xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {loading ? (
                    [...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 h-64 border border-slate-200 dark:border-white/5 animate-pulse flex flex-col items-center justify-center gap-4">
                            <div className="w-24 h-24 bg-slate-200 dark:bg-white/10 rounded-full"></div>
                            <div className="w-3/4 h-6 bg-slate-200 dark:bg-white/10 rounded"></div>
                            <div className="w-1/2 h-4 bg-slate-200 dark:bg-white/10 rounded"></div>
                        </div>
                    ))
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <motion.div
                            key={user._id}
                            variants={itemVariants}
                            whileHover={{ y: -8 }}
                            className="group relative bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-[#1f242c] rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
                        >
                            {/* Decorative Background Blur */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Avatar */}
                            <div className="relative mb-6">
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`}
                                    alt={user.name}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`;
                                    }}
                                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-[#0a0a0a] shadow-lg bg-slate-100 dark:bg-slate-800"
                                    loading="lazy"
                                />
                                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-[#161b22] rounded-full" title="Online"></div>
                            </div>

                            {/* Info */}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                {user.name}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-300 mb-6 flex items-center gap-1.5 justify-center bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full w-full max-w-full overflow-hidden">
                                <FiMail className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                <span className="truncate" title={user.email}>{user.email}</span>
                            </p>

                            {/* Action Button */}
                            <button className="mt-auto w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20 border border-transparent hover:border-primary/20">
                                <FiUser /> View Profile
                            </button>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiSearch className="text-4xl text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No members found</h3>
                        <p className="text-slate-500 dark:text-slate-400">Try adjusting your search query.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default TeamMembers;
