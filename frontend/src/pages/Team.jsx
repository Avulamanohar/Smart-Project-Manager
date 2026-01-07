import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiMail, FiPlus, FiUser, FiShield, FiBriefcase, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const Team = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Member State
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [activeProjectForAdd, setActiveProjectForAdd] = useState(null);
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);
    const [addMemberError, setAddMemberError] = useState('');
    const [allSystemUsers, setAllSystemUsers] = useState([]);

    useEffect(() => {
        if (showAddMemberModal && allSystemUsers.length === 0) {
            api.get('/auth/users')
                .then(res => setAllSystemUsers(res.data))
                .catch(err => console.error("Failed to fetch users", err));
        }
    }, [showAddMemberModal, allSystemUsers.length]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await api.get('/projects');
                setProjects(data);
            } catch (error) {
                console.error("Failed to fetch projects for team view", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (selectedNewMembers.length === 0) return;

        try {
            const { data } = await api.post(`/projects/${activeProjectForAdd}/members`, { memberIds: selectedNewMembers });
            // Update local state
            setProjects(prev => prev.map(p => p._id === activeProjectForAdd ? data : p));
            setShowAddMemberModal(false);
            setSelectedNewMembers([]);
            setAddMemberError('');
            setActiveProjectForAdd(null);
        } catch (error) {
            console.error("Failed to add members", error);
            setAddMemberError(error.response?.data?.message || "Failed to add members");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#050505] min-h-screen">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-10 flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-6"
            >
                <div>
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Team Hub</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Manage collaborators and permissions across your active projects.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Projects</div>
                    <div className="text-3xl font-bold text-primary">{projects.length}</div>
                </div>
            </motion.header>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner">
                        🚀
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Active Teams</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">You haven't joined or created any projects yet. Start a project to build your dream team.</p>
                    <Link to="/" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        Create Project
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project._id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/40 group hover:border-primary/30 transition-all duration-300"
                        >
                            {/* Project Header Bar */}
                            <div className="px-8 py-6 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg ring-4 ring-slate-50 dark:ring-[#0f0f10] text-white">
                                        <FiBriefcase />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {project.name}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl truncate">{project.description}</p>
                                    </div>
                                </div>
                                <Link
                                    to={`/project/${project._id}`}
                                    className="px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-primary/50 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all flex items-center gap-2 group/btn self-start md:self-auto"
                                >
                                    <span>Workspace</span>
                                    <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {/* Team Grid */}
                            <div className="p-8 bg-white dark:bg-[#0f0f10]">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {/* Owner Card */}
                                    <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-500/20 flex flex-col gap-4 group/card hover:-translate-y-1 transition-transform duration-300">
                                        <div className="absolute top-3 right-3 text-amber-500/50 group-hover/card:text-amber-500 transition-colors">
                                            <FiShield size={20} />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full ring-2 ring-amber-500/50 p-0.5">
                                                {project.owner.avatar ? (
                                                    <img src={project.owner.avatar} alt={project.owner.name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                        {getInitials(project.owner.name)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-slate-900 dark:text-white font-bold">{project.owner.name}</h4>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] uppercase font-bold tracking-wider">
                                                    Project Lead
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-amber-200 dark:border-amber-500/20 flex justify-between items-center">
                                            <span className="text-xs text-amber-700/60 dark:text-amber-400/60 font-medium">Full Access</span>
                                            <a href={`mailto:${project.owner.email}`} className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40">
                                                <FiMail />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Members Cards */}
                                    {project.members.map(member => (
                                        <div key={member._id} className="relative p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 flex flex-col gap-4 group/card hover:-translate-y-1 transition-transform duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full p-0.5">
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                            {getInitials(member.name)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-slate-900 dark:text-white font-bold">{member.name}</h4>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold tracking-wider">
                                                        Contributor
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5 flex justify-between items-center group-hover/card:border-slate-300 dark:group-hover/card:border-white/10 transition-colors">
                                                <span className="text-xs text-slate-400 font-medium">Limited Access</span>
                                                <a href={`mailto:${member.email}`} className="text-slate-400 hover:text-indigo-500 transition-colors p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10">
                                                    <FiMail />
                                                </a>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Member Placeholer (Only if owner) */}
                                    {user._id === project.owner._id && (
                                        <button
                                            onClick={() => {
                                                setActiveProjectForAdd(project._id);
                                                setShowAddMemberModal(true);
                                            }}
                                            className="h-full min-h-[140px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-white/5 flex flex-col items-center justify-center gap-3 text-slate-400 disabled:opacity-50 transition-all group/add"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover/add:text-primary group-hover/add:scale-110 transition-all">
                                                <FiPlus size={24} />
                                            </div>
                                            <span className="font-semibold text-sm group-hover/add:text-primary transition-colors">Invite Member</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Member Modal - Styled */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-[#121212] p-8 rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <FiUser size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Team Member</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Invite a collaborator to this project</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddMember} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Users to Invite</label>
                                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl max-h-60 overflow-y-auto custom-scrollbar p-2">
                                    {(() => {
                                        const project = projects.find(p => p._id === activeProjectForAdd);
                                        if (!project) return null;

                                        const availableUsers = allSystemUsers.filter(u =>
                                            // Exclude owner
                                            (project.owner?._id !== u._id) &&
                                            // Exclude existing members
                                            !project.members?.some(m => m._id === u._id)
                                        );

                                        if (availableUsers.length === 0) {
                                            return <p className="text-center text-slate-500 text-sm py-4">No new users available.</p>;
                                        }

                                        return availableUsers.map(u => {
                                            const isSelected = selectedNewMembers.includes(u._id);
                                            return (
                                                <div
                                                    key={u._id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedNewMembers(prev => prev.filter(id => id !== u._id));
                                                        } else {
                                                            setSelectedNewMembers(prev => [...prev, u._id]);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${isSelected
                                                        ? 'bg-primary/20 border-primary/50'
                                                        : 'hover:bg-slate-200 dark:hover:bg-white/10 border-transparent'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-colors ${isSelected ? 'bg-primary' : 'bg-slate-600'}`}>
                                                        {isSelected ? <FiCheckCircle /> : u.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{u.name}</div>
                                                        <div className="text-xs text-slate-500 truncate">{u.email}</div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                                {addMemberError && (
                                    <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                                        <span>⚠️</span> {addMemberError}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddMemberModal(false)}
                                    className="px-5 py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={selectedNewMembers.length === 0}
                                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiPlus size={16} />
                                    <span>Add {selectedNewMembers.length > 0 ? `${selectedNewMembers.length} ` : ''}Member{selectedNewMembers.length !== 1 ? 's' : ''}</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Team;
