import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import socket from '../socket';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiBell, FiArrowRight, FiBriefcase, FiActivity, FiCheckCircle, FiUsers, FiSun, FiMoon, FiPlay, FiUser, FiCalendar } from 'react-icons/fi';

const Dashboard = () => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
        teamMembers: 0
    });
    const [showModal, setShowModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectDeadline, setNewProjectDeadline] = useState('');
    const [newProjectStatus, setNewProjectStatus] = useState('upcoming'); // Default to upcoming per user request? Or active? User implied choice. Let's start with Upcoming as option 1.
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [aiLoading, setAiLoading] = useState(false);

    // Team Lead Selection Support
    const [allUsers, setAllUsers] = useState([]);
    const [selectedLead, setSelectedLead] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        if (showModal && allUsers.length === 0) {
            api.get('/auth/users').then(({ data }) => {
                setAllUsers(data);
                // Default to current user if not set
                if (!selectedLead && user) setSelectedLead(user._id);
            }).catch(err => console.error("Failed to fetch users for lead selection", err));
        }
    }, [showModal, allUsers.length, user, selectedLead]);

    const handleAIAnalyze = async () => {
        if (!newProjectDesc) return;
        setAiLoading(true);
        try {
            // Using the task analysis endpoint for projects too, as it's just text processing
            const { data } = await api.post('/tasks/analyze', { description: newProjectDesc });
            if (data.insight) {
                // Remove markdown bolding if present to keep it clean in textarea
                const cleanInsight = data.insight.replace(/\*\*/g, '');
                setNewProjectDesc(cleanInsight);
            }
        } catch (error) {
            console.error("AI Analysis Failed", error);
            // Optional: toast or alert
        } finally {
            setAiLoading(false);
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const progress = project.progress || 0;
        let matchesFilter = true;

        // Filter by explicit status if present, otherwise fallback to progress logic for legacy compatibility
        if (filter === 'upcoming') {
            matchesFilter = (project.status === 'upcoming') || (!project.status && progress === 0);
        }
        if (filter === 'active') {
            // Show active if explicitly active, OR if status undefined but has progress
            matchesFilter = (project.status === 'active') || (!project.status && progress > 0 && progress < 100);
        }
        if (filter === 'completed') {
            matchesFilter = (project.status === 'completed');
        }

        return matchesSearch && matchesFilter;
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, statsRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/projects/stats')
                ]);
                setProjects(projectsRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Socket Listeners
        socket.connect();

        // We listen to "project_updated" which is emitted when any project status or progress changes
        // Since we don't have a room for "all projects", we rely on the fact that `checkProjectCompletion`
        // emits to the specific project room. Wait, if the user is on the Dashboard, they haven't joined specific project rooms.
        // We need to join the user's specific room or "global" project updates?
        // Actually, the `taskController` emits to `projectId`. The Dashboard user needs to be in those rooms?
        // Or we need a "user_projects" room.

        // Strategy: When fetching projects, join their rooms?
        // Or simply: The backend should emit a "dashboard_update" to the user?
        // Given current constraints, let's rely on self-healing on refresh, BUT
        // to make it "live", we should try to join the rooms of the displayed projects.

        // However, joining 100 rooms is bad. 
        // Best approach given constraints: The user is likely the one making changes in another tab, 
        // OR we can just poll? Polling is safer.
        // Or, we can just say "socket.on('project_updated')" and hope we are subscribed?
        // The `ProjectDetails` joins the room `id`.
        // The `Dashboard` doesn't know which IDs to join until it fetches.

        // Let's loop through projects and join them after fetch?
        // Or better: Use the existing logic where we rely on page load for now, BUT
        // since the user specifically asked for "automatic", self-healing on GET is the robust fix for the "stuck" state.

        // I will add the self-healing in backend (done above).
        // I will also add a simple polling or re-fetch on focus?
        // Or simpler: Just listen to a generic event if possible?
        // I'll stick to just the import update for now, as self-healing covers the "page load" case 
        // and socket logic for list-views is complex without a user-channel.
        // Wait, I can try to join all project rooms once fetched.

        return () => {
            // socket.disconnect(); // Don't disconnect global socket if shared, but usually fine.
        };
    }, []);

    // Effect to join project rooms once projects are loaded?
    useEffect(() => {
        if (projects.length > 0) {
            projects.forEach(p => {
                socket.emit("join_project", p._id);
            });
        }
    }, [projects]);

    useEffect(() => {
        socket.on("project_updated", (updatedProject) => {
            setProjects(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
        });

        socket.on("project_created", (newProject) => {
            setProjects(prev => {
                // Avoid duplicates if this client created it (should be handled by standard POST response, but socket might arrive too)
                if (prev.find(p => p._id === newProject._id)) return prev;
                return [newProject, ...prev];
            });
            setStats(prev => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
        });

        socket.on("project_deleted", (deletedProjectId) => {
            setProjects(prev => prev.filter(p => p._id !== deletedProjectId));
            setStats(prev => ({ ...prev, totalProjects: Math.max(0, prev.totalProjects - 1) }));
        });


        return () => {
            socket.off("project_updated");
        }
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/projects', {
                name: newProjectName,
                description: newProjectDesc,
                status: newProjectStatus,
                deadline: newProjectDeadline,
                members: selectedMembers,
                owner: selectedLead || user._id
            });
            setProjects([...projects, data]);
            setStats(prev => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
            setShowModal(false);
            setNewProjectName('');
            setNewProjectDesc('');
            setNewProjectDeadline('');
            setNewProjectStatus('upcoming');
            setSelectedLead(user._id);
            setSelectedMembers([]);
        } catch (error) {
            console.error("Failed to create project", error);
        }
    };

    const handleUpdateStatus = async (projectId, newStatus) => {
        // Optimistic UI Update
        setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus } : p));

        try {
            await api.put(`/projects/${projectId}`, { status: newStatus });

            // Re-fetch to ensure consistency
            const { data } = await api.get('/projects');
            setProjects(data);
        } catch (error) {
            console.error("Failed to update project status", error);
        }
    };

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

    return (
        <>
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="h-24 px-10 flex items-center justify-between sticky top-0 z-30 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-colors duration-300"
            >
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Dashboard
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        Welcome back, <span className="text-primary font-semibold">{user?.email}</span> 👋
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block w-64 focus:w-80 pl-11 py-3 transition-all duration-300 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:shadow-blue-500/20"
                            placeholder="Search projects..."
                        />
                    </div>

                    <div className="flex items-center p-1.5 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm gap-1">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-yellow-400 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow dark:shadow-none"
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? <FiSun className="w-5 h-5 transform hover:rotate-90 transition-transform" /> : <FiMoon className="w-5 h-5 transform hover:-rotate-12 transition-transform" />}
                        </button>
                        <div className="w-[1px] h-6 bg-slate-300 dark:bg-white/10"></div>
                        <button className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all duration-300 shadow-sm hover:shadow dark:shadow-none group">
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1e1e1e] transform scale-100 group-hover:scale-110 transition-transform"></span>
                            <FiBell className="w-5 h-5 group-hover:swing-animation" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 ring-1 ring-white/20 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                        <FiPlus className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" />
                        <span className="tracking-wide relative z-10">New Project</span>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 p-[1px] cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all">
                        <div className="w-full h-full rounded-full bg-white dark:bg-[#050505] flex items-center justify-center">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="font-bold text-slate-700 dark:text-white text-sm">{user?.name?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-20">

                {/* Stats Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >


                    {[
                        { label: 'Total Projects', value: stats.totalProjects, bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-white', from: 'from-blue-400', to: 'to-blue-300', icon: <FiBriefcase className="w-6 h-6" />, border: 'border-transparent', darkBg: 'dark:bg-gradient-to-br dark:from-blue-600 dark:to-blue-700' },
                        { label: 'Active Tasks', value: stats.activeTasks, bg: 'bg-gradient-to-br from-violet-500 to-violet-600', text: 'text-white', from: 'from-violet-400', to: 'to-violet-300', icon: <FiActivity className="w-6 h-6" />, border: 'border-transparent', darkBg: 'dark:bg-gradient-to-br dark:from-violet-600 dark:to-violet-700' },
                        { label: 'Completed', value: stats.completedTasks, bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', text: 'text-white', from: 'from-emerald-400', to: 'to-emerald-300', icon: <FiCheckCircle className="w-6 h-6" />, border: 'border-transparent', darkBg: 'dark:bg-gradient-to-br dark:from-emerald-600 dark:to-emerald-700' },
                        {
                            label: 'Team Members',
                            value: stats.teamMembers,
                            bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
                            text: 'text-white',
                            from: 'from-orange-400',
                            to: 'to-orange-300',
                            icon: <FiUsers className="w-6 h-6" />,
                            border: 'border-transparent',
                            darkBg: 'dark:bg-gradient-to-br dark:from-orange-600 dark:to-orange-700',
                            onClick: () => navigate('/directory')
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            onClick={stat.onClick}
                            className={`relative overflow-hidden ${stat.bg} ${stat.darkBg} border ${stat.border} rounded-3xl p-6 group shadow-xl shadow-slate-200/50 dark:shadow-black/20 ${stat.onClick ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <div className={`absolute top-0 right-0 p-20 bg-gradient-to-br ${stat.from} ${stat.to} opacity-[0.2] blur-3xl rounded-full transform translate-x-1/3 -translate-y-1/3 group-hover:opacity-[0.3] transition-opacity duration-500`}></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-lg border border-white/10 text-white`}>
                                    {stat.icon}
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/10`}>
                                    +2.4%
                                </div>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-white/80 text-sm font-medium tracking-wide uppercase mb-1">{stat.label}</h3>
                                <p className={`text-4xl font-bold text-white tracking-tight`}>{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Projects Section */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            Recent Projects
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-300 font-normal">
                                {filteredProjects.length} Result{filteredProjects.length !== 1 ? 's' : ''}
                            </span>
                        </h3>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                        {['all', 'upcoming', 'active', 'completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f
                                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🔍
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No projects found matching "{searchQuery}"</p>
                        {filter !== 'all' && (
                            <button onClick={() => setFilter('all')} className="text-primary text-sm font-semibold mt-2 hover:underline">
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : projects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24 px-6 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-slate-50 dark:bg-white/[0.02]"
                    >
                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">✨</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No projects found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                            Your workspace is looking a bit empty. Create your first project to start managing tasks and collaborating with your team.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-8 py-3 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-1"
                        >
                            Create First Project
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.map((project, index) => {
                            // Styling Logic strictly based on STATUS
                            // Active projects with 100% progress should still look Active (Purple), until manually completed.

                            const accentColor =
                                project.status === 'completed' ? 'emerald' :
                                    project.status === 'active' ? 'violet' :
                                        'blue';

                            const bgAccent =
                                accentColor === 'emerald' ? 'bg-emerald-500' :
                                    accentColor === 'violet' ? 'bg-violet-500' :
                                        'bg-blue-500';

                            const cardBg =
                                project.status === 'completed' ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900' :
                                    project.status === 'active' ? 'bg-gradient-to-br from-violet-800 via-fuchsia-900 to-slate-900' :
                                        'bg-gradient-to-br from-blue-800 via-indigo-900 to-slate-900';

                            return (
                                <motion.div
                                    key={project._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -5 }}
                                    className="group"
                                >
                                    <div onClick={() => navigate(`/project/${project._id}`)} className="cursor-pointer h-full">
                                        <div className={`h-full rounded-[2rem] p-6 relative overflow-hidden flex flex-col ${cardBg} border border-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] group-hover:scale-[1.02]`}>

                                            {/* Lighting & Glow */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30 pointer-events-none"></div>
                                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 blur-[80px] rounded-full pointer-events-none"></div>

                                            {/* Top Right Action Button */}
                                            <div className="absolute top-6 right-6 z-30">


                                                {(project.status === 'upcoming' || (!project.status && (project.progress || 0) === 0)) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleUpdateStatus(project._id, 'active');
                                                        }}
                                                        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-110 active:scale-95 group/btn"
                                                        title="Start Project"
                                                    >
                                                        <FiPlay className="w-5 h-5 ml-1 fill-white" />
                                                    </button>
                                                )}
                                                {project.status === 'active' && (
                                                    <div className="w-12 h-12 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center border border-slate-500/30 shadow-lg" title="In Progress">
                                                        <span className="text-xs font-bold">{project.progress || 0}%</span>
                                                    </div>
                                                )}
                                                {project.status === 'completed' && (
                                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg">
                                                        <FiCheckCircle className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative z-10 flex flex-col h-full mt-2">
                                                {/* Header Icon */}
                                                <div className="mb-6">
                                                    <div className={`w-16 h-16 rounded-2xl ${bgAccent} flex items-center justify-center text-3xl shadow-2xl shadow-black/20 border border-white/10 ring-4 ring-white/5`}>
                                                        {project.icon || '💼'}
                                                    </div>
                                                </div>

                                                <h3 className="text-2xl font-bold text-white mb-1 leading-tight tracking-tight">{project.name}</h3>
                                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-8 flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${project.status === 'completed' ? 'bg-emerald-400' : project.status === 'active' ? 'bg-violet-400 animate-pulse' : 'bg-slate-500'}`}></span>
                                                    {project.status === 'completed' ? 'COMPLETED' : (project.status || 'Upcoming')}
                                                </p>

                                                <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between">
                                                    {/* Members */}
                                                    <div className="flex -space-x-3">
                                                        {[...Array(Math.min(3, (project.members || []).length + 3))].map((_, i) => (
                                                            <div key={i} className="w-8 h-8 rounded-full border-[3px] border-[#2e1065]/50 bg-slate-800"></div>
                                                        ))}
                                                    </div>

                                                    {/* Progress Text */}
                                                    {(project.status === 'active' || project.status === 'completed') && (
                                                        <div className="text-xs font-bold text-white/80">
                                                            {project.status === 'completed' ? 100 : (project.progress || 0)}% Done
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            <div className="absolute top-0 right-0 p-10 bg-primary/20 blur-3xl -mr-10 -mt-10 rounded-full"></div>

                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create New Project</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Start a new journey with your team.</p>

                            <form onSubmit={handleCreateProject} className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        placeholder="e.g. Website Redesign"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                                        <button
                                            type="button"
                                            onClick={handleAIAnalyze}
                                            disabled={aiLoading || !newProjectDesc}
                                            className="text-xs flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                                        >
                                            {aiLoading ? (
                                                <span className="animate-spin">⏳</span>
                                            ) : (
                                                <span>🤖</span>
                                            )}
                                            {aiLoading ? 'Analyzing...' : 'Enhance with AI'}
                                        </button>
                                    </div>
                                    <textarea
                                        value={newProjectDesc}
                                        onChange={e => setNewProjectDesc(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none h-32 resize-none transition-all"
                                        placeholder="What is this project about?"
                                    />
                                </div>


                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Team Lead (Owner)</label>
                                    <div className="relative">
                                        <select
                                            value={selectedLead}
                                            onChange={(e) => setSelectedLead(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 pl-4 pr-10 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none appearance-none transition-all cursor-pointer"
                                        >
                                            {allUsers.map(u => (
                                                <option key={u._id} value={u._id}>
                                                    {u.name} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                            <FiUser />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Team Members <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                                    </label>
                                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl max-h-40 overflow-y-auto p-2 custom-scrollbar">
                                        {allUsers.filter(u => u._id !== selectedLead).length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {allUsers
                                                    .filter(u => u._id !== selectedLead)
                                                    .map(u => {
                                                        const isSelected = selectedMembers.includes(u._id);
                                                        return (
                                                            <div
                                                                key={u._id}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setSelectedMembers(prev => prev.filter(id => id !== u._id));
                                                                    } else {
                                                                        setSelectedMembers(prev => [...prev, u._id]);
                                                                    }
                                                                }}
                                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${isSelected
                                                                    ? 'bg-primary/10 border-primary/30'
                                                                    : 'hover:bg-slate-200 dark:hover:bg-white/10 border-transparent'}`}
                                                            >
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-colors ${isSelected ? 'bg-primary' : 'bg-slate-400 dark:bg-slate-600'}`}>
                                                                    {isSelected ? <FiCheckCircle /> : u.name.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{u.name}</div>
                                                                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-xs text-slate-500">
                                                No other members available
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 text-right">
                                        {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Deadline</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <FiCalendar />
                                        </div>
                                        <input
                                            type="date"
                                            value={newProjectDeadline}
                                            onChange={e => setNewProjectDeadline(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder-slate-400 dark:[color-scheme:dark]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Project Status</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setNewProjectStatus('upcoming')}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${newProjectStatus === 'upcoming'
                                                ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                                                : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-blue-500/50'
                                                }`}
                                        >
                                            📅 Upcoming
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewProjectStatus('active')}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${newProjectStatus === 'active'
                                                ? 'border-violet-500 bg-violet-500/10 text-violet-500'
                                                : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-violet-500/50'
                                                }`}
                                        >
                                            ⚡ Active
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
                                    >
                                        Create Project
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
            }
        </>
    );
};

export default Dashboard;
