
import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { FiAward, FiTrendingUp, FiCheckCircle, FiStar, FiTarget, FiClock } from 'react-icons/fi';

const Leaderboard = () => {
    const [stats, setStats] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all');

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const { data: projects } = await api.get('/projects');
                const tasksPromises = projects.map(p => api.get(`/tasks/project/${p._id}`));
                const tasksResponses = await Promise.all(tasksPromises);
                const allTasks = tasksResponses.flatMap(res => res.data);

                // --- Calculate Scores & XP ---
                const userScores = {};
                const projectOwners = {};

                // Map owners
                projects.forEach(p => {
                    if (p.owner) projectOwners[p._id] = p.owner._id;
                });

                // Init helper
                const getOrInitUser = (user, userId) => {
                    if (!userScores[userId]) {
                        userScores[userId] = {
                            member: user,
                            points: 0,
                            tasksCompleted: 0,
                            highPriority: 0,
                            projectsCount: new Set()
                        };
                    }
                    return userScores[userId];
                };

                // 1. Fetch ALL Users to ensure everyone is on the board
                const { data: allUsers } = await api.get('/auth/users');
                allUsers.forEach(u => {
                    getOrInitUser(u, u._id);
                });

                // Pre-fill from Projects (just in case 'users' endpoint misses something, though unlikely)
                projects.forEach(p => {
                    if (p.owner) getOrInitUser(p.owner, p.owner._id);
                    if (p.members) p.members.forEach(m => getOrInitUser(m, m._id));
                });

                // Process Tasks
                allTasks.forEach(task => {
                    if (task.status === 'done') {
                        // Time Range Logic (Simplified for UI demo, ideally backend supports strict filtering)
                        const taskDate = new Date(task.updatedAt);
                        const now = new Date();
                        const isThisWeek = (now - taskDate) < 7 * 24 * 60 * 60 * 1000;
                        const isThisMonth = (now.getMonth() === taskDate.getMonth()) && (now.getFullYear() === taskDate.getFullYear());

                        if (timeRange === 'week' && !isThisWeek) return;
                        if (timeRange === 'month' && !isThisMonth) return;

                        const points = (task.priority || 'low').toLowerCase() === 'high' ? 20 :
                            (task.priority || 'low').toLowerCase() === 'medium' ? 10 : 5;

                        const assignees = task.assignees || [];
                        if (assignees.length > 0) {
                            const pointsPerPerson = points / assignees.length;
                            assignees.forEach(a => {
                                const memberId = a._id || a;
                                if (!a.name) return;

                                const userData = getOrInitUser(a, memberId);

                                let finalPoints = pointsPerPerson;
                                const projectId = task.project._id || task.project;
                                const ownerId = projectOwners[projectId];

                                if (ownerId && memberId === ownerId) {
                                    finalPoints += 2; // Team Lead Bonus
                                }

                                userData.points += finalPoints;
                                userData.tasksCompleted += 1;
                                if ((task.priority || '').toLowerCase() === 'high') userData.highPriority += 1;
                                userData.projectsCount.add(projectId);
                            });
                        }
                    }
                });

                // --- Process Badges & Levels ---
                const sorted = Object.values(userScores)
                    .map(s => {
                        const points = Math.round(s.points * 10) / 10;
                        const level = Math.floor(points / 100) + 1; // 100 pts per level
                        const nextLevelThreshold = level * 100;
                        const progress = ((points - ((level - 1) * 100)) / 100) * 100;

                        // Badges
                        const badges = [];
                        if (s.highPriority >= 5) badges.push({ icon: '⚡', name: 'Blitz', color: 'text-yellow-400', bg: 'bg-yellow-400/10' });
                        if (s.tasksCompleted >= 20) badges.push({ icon: '🛡️', name: 'Veteran', color: 'text-blue-400', bg: 'bg-blue-400/10' });
                        if (points >= 200) badges.push({ icon: '🚀', name: 'Legend', color: 'text-purple-400', bg: 'bg-purple-400/10' });
                        if (s.projectsCount.size >= 3) badges.push({ icon: '🌐', name: 'General', color: 'text-emerald-400', bg: 'bg-emerald-400/10' });

                        return {
                            ...s,
                            projectsCount: s.projectsCount.size,
                            points,
                            level,
                            progress,
                            badges
                        };
                    })
                    .sort((a, b) => b.points - a.points);

                // Add Rank Badges
                if (sorted[0]) sorted[0].badges.unshift({ icon: '👑', name: 'Champion', color: 'text-amber-400', bg: 'bg-amber-400/10' });
                if (sorted[1]) sorted[1].badges.unshift({ icon: '🥈', name: 'Runner Up', color: 'text-slate-400', bg: 'bg-slate-400/10' });
                if (sorted[2]) sorted[2].badges.unshift({ icon: '🥉', name: 'Third', color: 'text-orange-400', bg: 'bg-orange-400/10' });

                // Recent Activity Log
                const activityLog = [];
                allTasks.forEach(task => {
                    if (task.status === 'done') {
                        const taskDate = new Date(task.updatedAt);

                        // Strict filters for log history to match current view stats
                        if (timeRange === 'week' && (new Date() - taskDate) >= 7 * 24 * 60 * 60 * 1000) return;
                        if (timeRange === 'month' && ((new Date().getMonth() !== taskDate.getMonth()) || (new Date().getFullYear() !== taskDate.getFullYear()))) return;
                    }
                });

                // Re-calculating full activity log
                const detailedLog = [];
                allTasks.forEach(task => {
                    if (task.status === 'done') {
                        const taskDate = new Date(task.updatedAt);
                        const now = new Date();
                        const isThisWeek = (now - taskDate) < 7 * 24 * 60 * 60 * 1000;
                        const isThisMonth = (now.getMonth() === taskDate.getMonth()) && (now.getFullYear() === taskDate.getFullYear());

                        if (timeRange === 'week' && !isThisWeek) return;
                        if (timeRange === 'month' && !isThisMonth) return;

                        const points = (task.priority || 'low').toLowerCase() === 'high' ? 20 :
                            (task.priority || 'low').toLowerCase() === 'medium' ? 10 : 5;
                        const assignees = task.assignees || [];
                        if (assignees.length > 0) {
                            const pointsPerPerson = points / assignees.length;
                            assignees.forEach(a => {
                                if (!a.name) return;
                                let finalPoints = pointsPerPerson;
                                const projectId = task.project._id || task.project;
                                const ownerId = projectOwners[projectId];
                                let isBonus = false;
                                if (ownerId && (a._id || a) === ownerId) {
                                    finalPoints += 2;
                                    isBonus = true;
                                }
                                detailedLog.push({
                                    user: a,
                                    taskTitle: task.title,
                                    points: Math.round(finalPoints * 10) / 10,
                                    priority: task.priority || 'low',
                                    isBonus,
                                    date: taskDate
                                });
                            });
                        }
                    }
                });
                detailedLog.sort((a, b) => b.date - a.date);
                setRecentActivity(detailedLog.slice(0, 20));

                setStats(sorted);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, [timeRange]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#0a0f1c] transition-colors relative">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>

            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <span className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20 transform -rotate-6">
                            <FiAward size={32} />
                        </span>
                        Leaderboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Rise through the ranks and earn badges! 🏆
                    </p>
                </div>

                <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    {['all', 'month', 'week'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${timeRange === r
                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25 scale-105'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            {r === 'all' ? 'All Time' : r}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-32">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Top 3 Podium - Always show if at least 1 user */}
                    {stats.length > 0 && (
                        <div className="flex flex-wrap justify-center items-end gap-6 mb-20 px-4 pt-10">
                            {/* 2nd Place */}
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center order-1 md:order-1 opacity-90">
                                {stats[1] ? (
                                    <>
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-300 to-indigo-500 rounded-2xl transform rotate-3 scale-95 blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                                            <div className="w-24 h-24 rounded-2xl border-b-4 border-indigo-400 bg-gradient-to-b from-indigo-500 to-indigo-700 relative z-10 overflow-hidden shadow-xl flex flex-col items-center justify-center group-hover:-translate-y-2 transition-transform">
                                                <div className="absolute top-0 w-full h-1/2 bg-white/10"></div>
                                                {stats[1].member.avatar ? <img src={stats[1].member.avatar} className="w-full h-full object-cover" /> : <div className="text-3xl font-black text-indigo-200">{stats[1].member.name?.charAt(0)}</div>}
                                            </div>
                                            <div className="absolute -bottom-4 translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-lg border border-indigo-400 shadow-lg z-20">Lvl {stats[1].level}</div>
                                        </div>
                                        <div className="mt-8 flex flex-col items-center">
                                            <div className="text-4xl font-black text-indigo-300 mb-1">2</div>
                                            <h3 className="font-bold text-slate-700 dark:text-white text-lg">{stats[1].member.name}</h3>
                                            <div className="font-mono text-indigo-400 font-bold">{stats[1].points} pts</div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center opacity-30">
                                        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-400 bg-slate-800/50 flex items-center justify-center text-4xl">🥈</div>
                                        <div className="mt-4 text-slate-500 font-bold">Empty</div>
                                    </div>
                                )}
                            </motion.div>

                            {/* 1st Place - Center */}
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center order-first md:order-2 -mt-12 mb-6 md:mb-0 scale-110 z-20">
                                <div className="absolute -top-20 animate-bounce">
                                    <FiStar className="text-5xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] fill-yellow-400" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-br from-amber-300 to-yellow-600 rounded-3xl blur opacity-50 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                                    <div className="w-32 h-32 rounded-3xl border-b-[6px] border-yellow-500 bg-gradient-to-b from-yellow-400 to-amber-600 relative z-10 overflow-hidden shadow-2xl flex flex-col items-center justify-center group-hover:-translate-y-2 transition-transform">
                                        <div className="absolute top-0 w-full h-1/2 bg-white/20"></div>
                                        {stats[0]?.member.avatar ? <img src={stats[0].member.avatar} className="w-full h-full object-cover" /> : <div className="text-5xl font-black text-yellow-100">{stats[0]?.member.name?.charAt(0)}</div>}
                                    </div>
                                    <div className="absolute -bottom-5 translate-y-1/2 bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-sm font-bold px-4 py-1.5 rounded-xl border border-yellow-400 shadow-xl z-20 whitespace-nowrap">
                                        Lvl {stats[0]?.level} Master
                                    </div>
                                </div>
                                <div className="mt-10 flex flex-col items-center">
                                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm mb-1">1</div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-2xl">{stats[0]?.member.name}</h3>
                                    <div className="font-mono text-yellow-500 font-bold text-xl">{stats[0]?.points} pts</div>
                                    <div className="flex gap-1 mt-2">
                                        {stats[0]?.badges.map((b, i) => (
                                            <span key={i} title={b.name} className="text-lg hover:scale-125 transition-transform cursor-help drop-shadow-md">{b.icon}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* 3rd Place */}
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center order-3 opacity-90">
                                {stats[2] ? (
                                    <>
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-br from-orange-300 to-orange-500 rounded-2xl transform -rotate-3 scale-95 blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                                            <div className="w-24 h-24 rounded-2xl border-b-4 border-orange-400 bg-gradient-to-b from-orange-400 to-orange-600 relative z-10 overflow-hidden shadow-xl flex flex-col items-center justify-center group-hover:-translate-y-2 transition-transform">
                                                <div className="absolute top-0 w-full h-1/2 bg-white/10"></div>
                                                {stats[2].member.avatar ? <img src={stats[2].member.avatar} className="w-full h-full object-cover" /> : <div className="text-3xl font-black text-orange-200">{stats[2].member.name?.charAt(0)}</div>}
                                            </div>
                                            <div className="absolute -bottom-4 translate-y-1/2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-lg border border-orange-400 shadow-lg z-20">Lvl {stats[2].level}</div>
                                        </div>
                                        <div className="mt-8 flex flex-col items-center">
                                            <div className="text-4xl font-black text-orange-400 mb-1">3</div>
                                            <h3 className="font-bold text-slate-700 dark:text-white text-lg">{stats[2].member.name}</h3>
                                            <div className="font-mono text-indigo-400 font-bold">{stats[2].points} pts</div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center opacity-30">
                                        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-400 bg-slate-800/50 flex items-center justify-center text-4xl">🥉</div>
                                        <div className="mt-4 text-slate-500 font-bold">Empty</div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}

                    {/* Rankings List */}
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 pb-20">
                        {stats.map((score, index) => (
                            // Show ALL users in the list below, even if they are on the podium.
                            // This ensures the "Leaderboard" list is complete and easy to scan.
                            <motion.div
                                key={score.member._id}
                                variants={itemVariants}
                                whileHover={{ scale: 1.005 }}
                                className="group relative bg-white dark:bg-[#151b2b] border border-slate-200 dark:border-white/5 rounded-2xl p-4 md:p-5 flex items-center gap-4 md:gap-6 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                            >
                                {/* Progress Bar Background (Subtle) */}
                                <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/10 w-full">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${score.progress}%` }}></div>
                                </div>

                                <div className="w-8 md:w-10 font-black text-xl md:text-2xl text-slate-300 group-hover:text-indigo-500 transition-colors italic">#{index + 1}</div>

                                <div className="relative">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden ring-2 ring-slate-100 dark:ring-white/10 group-hover:ring-indigo-500 transition-all">
                                        {score.member.avatar ? (
                                            <img src={score.member.avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{score.member.name?.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-600">Lvl {score.level}</div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-base md:text-lg truncate">{score.member.name}</h4>
                                        <div className="flex gap-1 hidden md:flex">
                                            {score.badges.map((b, i) => (
                                                <span key={i} title={b.name} className={`text-sm cursor-help opacity-70 hover:opacity-100 hover:scale-110 transition-transform`}>{b.icon}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span>{score.tasksCompleted} Tasks</span>
                                        </div>
                                        <div className="hidden md:flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span>{Math.round(score.progress)}% XP</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right pl-4 border-l border-slate-100 dark:border-white/5">
                                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">{score.points}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Points</div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {stats.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">👻</div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Champions Yet</h3>
                            <p className="text-slate-500">Complete tasks to appear on the leaderboard!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Activity / History Section */}
            {!loading && recentActivity.length > 0 && (
                <div className="max-w-4xl mx-auto mt-16 px-6 pb-24">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                            <FiClock size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Live Activity Feed</h2>
                            <p className="text-slate-500 text-sm">Real-time updates from across the workspace</p>
                        </div>
                    </div>

                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-6 space-y-8">
                        {recentActivity.map((activity, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="relative pl-8"
                            >
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-50 dark:border-[#0a0f1c] ${activity.isBonus ? 'bg-amber-500' :
                                    activity.priority === 'high' ? 'bg-red-500' : 'bg-indigo-500'
                                    } shadow-lg`}></div>

                                <div className="bg-white dark:bg-[#151b2b] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {activity.user.avatar ? (
                                                <img src={activity.user.avatar} className="w-6 h-6 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">{activity.user.name?.charAt(0)}</div>
                                            )}
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{activity.user.name}</span>
                                            <span className="text-slate-400 text-xs">completed</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                                            {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-slate-700 dark:text-slate-300 text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                {activity.taskTitle}
                                            </p>
                                            {activity.priority === 'high' && (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded mt-1">
                                                    <FiTrendingUp size={10} /> High Impact
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`font-black text-lg ${activity.isBonus ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                +{activity.points}
                                            </span>
                                            {activity.isBonus && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Lead Bonus</span>}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
