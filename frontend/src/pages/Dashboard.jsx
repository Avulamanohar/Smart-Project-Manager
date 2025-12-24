import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth();
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
            }
        };
        fetchData();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/projects', {
                name: newProjectName,
                description: newProjectDesc,
                deadline: new Date(),
                members: []
            });
            setProjects([...projects, data]);
            setStats(prev => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
            setShowModal(false);
            setNewProjectName('');
            setNewProjectDesc('');
        } catch (error) {
            console.error("Failed to create project", error);
        }
    };

    return (
        <>
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-dark-bg/50 backdrop-blur-md sticky top-0 z-10"
            >
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Welcome back, {user?.name}</h2>
                    <p className="text-xs text-slate-500">Here's what's happening today.</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">{user?.email}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">🔔</div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-primary hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                    >
                        + New Project
                    </button>
                </div>
            </motion.header>


            <div className="flex-1 p-8 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                >
                    {[
                        { label: 'Total Projects', value: stats.totalProjects, color: 'from-blue-500 to-cyan-400' },
                        { label: 'Active Tasks', value: stats.activeTasks, color: 'from-orange-500 to-amber-400' },
                        { label: 'Completed', value: stats.completedTasks, color: 'from-green-500 to-emerald-400' },
                        { label: 'Team Members', value: stats.teamMembers, color: 'from-purple-500 to-pink-400' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-dark-card border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity`}></div>
                            <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                            <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                        </div>
                    ))}
                </motion.div>

                <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-bold text-white mb-6 flex items-center"
                >
                    Your Projects <span className="ml-2 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{projects.length}</span>
                </motion.h3>

                {projects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center text-slate-500 mt-20 p-10 border-2 border-dashed border-slate-800 rounded-2xl"
                    >
                        <h3 className="text-xl mb-2 font-semibold">No projects yet</h3>
                        <p className="mb-6">Create your first project to get started with ProdMax.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Create Project
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {projects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index + 0.3 }}
                            >
                                <Link to={`/project/${project._id}`} className="block group h-full">
                                    <div className="bg-dark-card border border-slate-800 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 h-full flex flex-col relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center text-xl">
                                                🚀
                                            </div>
                                            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-500/20">Active</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
                                        <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-2 leading-relaxed">{project.description}</p>

                                        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
                                            <div className="bg-primary h-full rounded-full w-1/3"></div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                                            <div className="flex -space-x-2 items-center">
                                                {[project.owner, ...project.members].slice(0, 3).map((member, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border-2 border-dark-card text-white shadow-sm" title={member.name}>
                                                        {member.avatar ? (
                                                            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            member && member.name ? (
                                                                <span>{member.name.charAt(0)}</span>
                                                            ) : (
                                                                <span>?</span>
                                                            )
                                                        )}
                                                    </div>
                                                ))}
                                                {(project.members.length + 1) > 3 && (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border-2 border-dark-card text-slate-400">
                                                        +{project.members.length + 1 - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-primary font-medium group-hover:underline">View Board →</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Create Project Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Create New Project</h3>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={e => setNewProjectDesc(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none h-24 resize-none"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary rounded hover:bg-indigo-600 font-semibold"
                                >
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
