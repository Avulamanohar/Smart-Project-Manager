import React from 'react';
import { FiX, FiCalendar } from 'react-icons/fi';

const TaskDetailsModal = ({ task, onClose }) => {
    if (!task) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wide ${(task.priority || 'low').toLowerCase() === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                (task.priority || 'low').toLowerCase() === 'medium' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                }`}>
                                {task.priority || 'Low'}
                            </span>
                            {task.createdAt && (
                                <span className="text-slate-500 text-sm">Created {new Date(task.createdAt).toLocaleDateString()}</span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{task.title}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-700/50">
                            {task.description || "No description provided."}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Assignees</h3>
                            <div className="flex flex-wrap gap-2">
                                {task.assignees && task.assignees.length > 0 ? (
                                    task.assignees.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-2 pr-3 border border-slate-200 dark:border-slate-700">
                                            <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white">
                                                {a.name ? a.name.charAt(0) : '?'}
                                            </div>
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{a.name || 'Unknown'}</span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-slate-500 italic text-sm">No assignees</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Due Date</h3>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/30 p-2 rounded-lg border border-slate-200 dark:border-slate-700/30 w-fit">
                                <FiCalendar className="text-primary" />
                                {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No Due Date'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;
