import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Team = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Member State
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [activeProjectForAdd, setActiveProjectForAdd] = useState(null);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [addMemberError, setAddMemberError] = useState('');

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
        try {
            const { data } = await api.post(`/projects/${activeProjectForAdd}/members`, { email: newMemberEmail });
            // Update local state
            setProjects(prev => prev.map(p => p._id === activeProjectForAdd ? data : p));
            setShowAddMemberModal(false);
            setNewMemberEmail('');
            setAddMemberError('');
            setActiveProjectForAdd(null);
            alert("Member added successfully!");
        } catch (error) {
            console.error("Failed to add member", error);
            setAddMemberError(error.response?.data?.message || "Failed to add member");
        }
    };

    if (loading) return <div className="text-white p-8">Loading teams...</div>;

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
            >
                <h2 className="text-3xl font-bold text-white mb-2">My Teams</h2>
                <p className="text-slate-400">Collaborators across your active projects.</p>
            </motion.header>

            {projects.length === 0 ? (
                <div className="text-center text-slate-500 mt-20">
                    <h3 className="text-xl mb-2">No active teams</h3>
                    <p>Join or create a project to start collaborating.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-dark-card border border-slate-800 rounded-2xl p-6 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-6 border-b border-slate-800/50 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <span className="text-2xl">🚀</span>
                                        {project.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1">{project.description}</p>
                                </div>
                                <Link
                                    to={`/project/${project._id}`}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors border border-slate-700"
                                >
                                    View Project
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {/* Owner Card */}
                                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4 relative group hover:bg-slate-800/50 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                        {project.owner.avatar ? (
                                            <img src={project.owner.avatar} alt={project.owner.name} className="w-full h-full rounded-full object-cover" />
                                        ) : getInitials(project.owner.name)}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium text-sm">{project.owner.name}</h4>
                                        <p className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full w-fit mt-0.5 border border-amber-500/20">Owner</p>
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={`mailto:${project.owner.email}`} className="text-slate-400 hover:text-white p-1" title="Send Email">📧</a>
                                    </div>
                                </div>

                                {/* Members Cards */}
                                {project.members.map(member => (
                                    <div key={member._id} className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4 relative group hover:bg-slate-800/50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                            ) : getInitials(member.name)}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-sm">{member.name}</h4>
                                            <p className="text-xs text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full w-fit mt-0.5 border border-indigo-500/20">Member</p>
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={`mailto:${member.email}`} className="text-slate-400 hover:text-white p-1" title="Send Email">📧</a>
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
                                        className="bg-slate-800/20 p-4 rounded-xl border border-dashed border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-800/40 transition-colors cursor-pointer group text-slate-500 hover:text-primary hover:border-primary/50 w-full"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                            +
                                        </div>
                                        <span className="text-sm font-medium">Add Member</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            {/* Add Member Modal */}
            {
                showAddMemberModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-sm">
                            <h3 className="text-xl font-bold mb-4">Add Project Member</h3>
                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">User Email</label>
                                    <input
                                        type="email"
                                        value={newMemberEmail}
                                        onChange={e => {
                                            setNewMemberEmail(e.target.value);
                                            setAddMemberError('');
                                        }}
                                        className={`w-full bg-slate-800 border ${addMemberError ? 'border-red-500' : 'border-slate-700'} rounded p-2 text-white focus:border-primary focus:outline-none`}
                                        placeholder="friend@example.com"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">User must already be registered.</p>
                                    {addMemberError && (
                                        <p className="text-xs text-red-500 mt-2 font-medium">{addMemberError}</p>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddMemberModal(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary rounded hover:bg-indigo-600 font-semibold"
                                    >
                                        Add Member
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Team;
