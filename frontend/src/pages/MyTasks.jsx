
import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiAlertCircle, FiBriefcase, FiArrowRight, FiTarget, FiCalendar, FiFilter, FiSearch, FiPieChart, FiList } from 'react-icons/fi';
import ProjectAnalytics from '../components/ProjectAnalytics';
import TaskDetailsModal from '../components/TaskDetailsModal';

const MyTasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'todo', 'in_progress', 'done'
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'analytics'
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        const fetchMyTasks = async () => {
            try {
                const { data } = await api.get('/tasks/my-tasks');
                setTasks(data);
            } catch (error) {
                console.error("Failed to fetch my tasks", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyTasks();
    }, []);

    // Helper functions
    const getStatusInfo = (status) => {
        switch (status) {
            case 'done': return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <FiCheckCircle /> };
            case 'in_progress': return { color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: <FiClock /> };
            default: return { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: <FiTarget /> };
        }
    };

    const getPriorityColor = (priority) => {
        switch ((priority || 'low').toLowerCase()) {
            case 'high': return 'text-red-500 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
            case 'medium': return 'text-orange-500 bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20';
            default: return 'text-blue-500 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
        }
    };

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const pendingTasks = totalTasks - completedTasks;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Group tasks by project
    const groupedTasks = tasks
        .filter(t => {
            const matchesFilter = filter === 'all' || t.status === filter;
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesFilter && matchesSearch;
        })
        .reduce((acc, task) => {
            const projectId = task.project?._id || 'unknown';
            if (!acc[projectId]) {
                acc[projectId] = {
                    project: task.project,
                    tasks: []
                };
            }
            acc[projectId].tasks.push(task);
            return acc;
        }, {});

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1c]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="h-screen bg-slate-50 dark:bg-[#0a0f1c] text-slate-900 dark:text-white transition-colors duration-300 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-24 px-10 flex items-center justify-between bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shrink-0 z-20">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">My Tasks</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 text-sm">
                        <span className="font-semibold text-primary">{pendingTasks}</span> pending tasks across your projects
                    </p>
                </div>

                {/* Header Stats & Controls */}
                <div className="flex items-center gap-4">
                    {/* View Switcher */}
                    <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="List View"
                        >
                            <FiList className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('analytics')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="Analytics View"
                        >
                            <FiPieChart className="w-5 h-5" />
                        </button>
                    </div>

                    {viewMode === 'list' && (
                        <div className="relative group hidden sm:block">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block w-48 pl-10 p-2 transition-all placeholder-slate-400 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-black/40"
                                placeholder="Search tasks..."
                            />
                        </div>
                    )}

                    <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <FiTarget />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total</p>
                            <p className="font-bold text-lg leading-none">{totalTasks}</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Done</p>
                            <p className="font-bold text-lg leading-none">{completedTasks}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex flex-col relative w-full">
                {viewMode === 'analytics' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <ProjectAnalytics tasks={tasks} project={{ name: 'My Personal Workspace', members: [] }} />
                    </motion.div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-10 pb-20 custom-scrollbar">
                        <div className="max-w-7xl mx-auto">
                            {/* Filters */}
                            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 sticky top-0 z-10 bg-slate-50/95 dark:bg-[#0a0f1c]/95 backdrop-blur py-2 -mt-2">
                                {['all', 'todo', 'in_progress', 'done'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filter === f
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5'
                                            }`}
                                    >
                                        {f.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            <motion.div
                                key={`${filter}-${searchQuery}`}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-8"
                            >
                                {Object.keys(groupedTasks).length === 0 ? (
                                    <motion.div
                                        key="empty-state"
                                        variants={itemVariants}
                                        className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-white/[0.02]"
                                    >
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                            {searchQuery ? '🔍' : '☕'}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                            {searchQuery ? 'No tasks found' : 'All Caught Up!'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                                            {searchQuery
                                                ? `We couldn't find any tasks matching "${searchQuery}"`
                                                : "You have no tasks matching this filter. Enjoy your free time!"
                                            }
                                        </p>
                                        {(filter !== 'all' || searchQuery) && (
                                            <button
                                                onClick={() => { setFilter('all'); setSearchQuery(''); }}
                                                className="text-primary hover:underline font-medium"
                                            >
                                                Clear Filters & Search
                                            </button>
                                        )}
                                    </motion.div>
                                ) : (
                                    Object.values(groupedTasks).map(({ project, tasks }) => {
                                        const projectCompleted = tasks.filter(t => t.status === 'done').length;
                                        const projectProgress = Math.round((projectCompleted / tasks.length) * 100);

                                        return (
                                            <motion.div
                                                variants={itemVariants}
                                                key={project?._id || 'unknown'}
                                                className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/20"
                                            >
                                                {/* Project Header */}
                                                <div className="bg-slate-50/50 dark:bg-white/[0.02] p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                                            <FiBriefcase className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                                                {project?.name || 'Unknown Project'}
                                                                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold">
                                                                    {tasks.length} Tasks
                                                                </span>
                                                            </h2>
                                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${projectProgress}%` }}></div>
                                                                </div>
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{projectProgress}% Done</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to={project?._id ? `/project/${project._id}` : '#'}
                                                        className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/10 hover:text-primary dark:hover:text-white transition-all flex items-center gap-2 group w-fit"
                                                    >
                                                        View Board <FiArrowRight className="group-hover:translate-x-0.5 transition-transform" />
                                                    </Link>
                                                </div>

                                                {/* Task List */}
                                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                                    {tasks.map(task => {
                                                        const statusInfo = getStatusInfo(task.status);
                                                        return (
                                                            <div
                                                                key={task._id}
                                                                onClick={() => setSelectedTask(task)}
                                                                className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
                                                            >

                                                                {/* Status Icon */}
                                                                <div className={`w-10 h-10 rounded-full ${statusInfo.bg} flex items-center justify-center ${statusInfo.color} shrink-0`}>
                                                                    {statusInfo.icon}
                                                                </div>

                                                                {/* Main Content */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <h3 className={`text-base font-semibold truncate ${task.status === 'done' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                                            {task.title}
                                                                        </h3>
                                                                        {task.status === 'done' && <span className="text-emerald-500 text-xs font-bold">✓ Completed</span>}
                                                                    </div>
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-2xl">{task.description || 'No description provided'}</p>
                                                                </div>

                                                                {/* Meta Data */}
                                                                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                                                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 w-32 justify-start sm:justify-end">
                                                                        <FiCalendar />
                                                                        <span>
                                                                            {task.dueDate
                                                                                ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                                                : 'No Date'}
                                                                        </span>
                                                                    </div>

                                                                    <div className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider w-24 text-center ${getPriorityColor(task.priority)}`}>
                                                                        {task.priority || 'Low'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}
            </main>

            {/* Task Details Modal */}
            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                />
            )}
        </div>
    );
};

export default MyTasks;
