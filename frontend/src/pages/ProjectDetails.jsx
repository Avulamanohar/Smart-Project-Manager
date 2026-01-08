import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import socket from '../socket';
import { DndContext, closestCenter, DragOverlay, useDroppable, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiArrowLeft, FiArrowRight, FiLayout, FiList, FiClock, FiX, FiCalendar, FiPieChart, FiPlus, FiBriefcase, FiInbox, FiPlay, FiCheckCircle, FiTrash2, FiRotateCcw, FiUser, FiUsers, FiAward } from 'react-icons/fi';
import ProjectAnalytics from '../components/ProjectAnalytics';

const TaskCard = ({ task, onDelete, onUpdateStatus, onViewDetails, style, innerRef, ...props }) => {
    // Priority Colors
    const getPriorityColor = (p) => {
        switch ((p || 'low').toLowerCase()) {
            case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'medium': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'urgent': return 'bg-red-500/20 text-red-600 border-red-500/30 font-bold';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    return (
        <div
            ref={innerRef}
            style={style}
            {...props}
            onClick={() => onViewDetails && onViewDetails(task)}
            className="group bg-white dark:bg-[#18181b] p-5 rounded-2xl border border-slate-200 dark:border-white/5 mb-4 shadow-sm hover:shadow-2xl hover:border-primary/50 cursor-pointer active:cursor-grabbing transform transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
        >
            {/* Gradient Glow effect on hover */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider border ${getPriorityColor(task.priority)} transition-colors`}>
                    {task.priority || 'Low'}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Task"
                    >
                        <FiX size={14} />
                    </button>
                </div>
            </div>

            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug group-hover:text-primary transition-colors">
                {task.title}
            </h4>

            {task.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed font-medium">
                    {task.description}
                </p>
            )}

            {/* Quick Actions (Slide up on hover or always visible but subtle) */}
            <div className="flex flex-wrap gap-2 mb-4">
                {task.status === 'todo' && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(task._id, 'in_progress'); }}
                        className="flex-1 py-1.5 px-3 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                        <FiPlay size={10} /> Start
                    </button>
                )}
                {task.status !== 'done' && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(task._id, 'done'); }}
                        className="flex-1 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                        <FiCheckCircle size={10} /> Complete
                    </button>
                )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center text-slate-400 text-xs font-medium gap-1.5">
                    <FiClock size={12} />
                    <span>
                        {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : 'No Date'
                        }
                    </span>
                </div>

                <div className="flex items-center">
                    {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex -space-x-2 pl-2">
                            {task.assignees.map((a, i) => {
                                if (!a) return null;
                                return (
                                    <div key={i} className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#18181b] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-300" title={a.name}>
                                        {a.name?.charAt(0) || '?'}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 text-[10px] ring-1 ring-slate-200 dark:ring-white/10">
                            +
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SortableTask = (props) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.task._id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TaskCard
            innerRef={setNodeRef}
            style={style}
            onViewDetails={props.onViewDetails}
            {...attributes}
            {...listeners}
            {...props}
        />
    );
};

const DroppableColumn = ({ column, tasks, onUpdateStatus, onDelete, onAddTask, onViewDetails }) => {
    const { setNodeRef } = useDroppable({
        id: `col-${column.id}`,
    });

    const columnTasks = tasks.filter(t => t.status === column.id);

    // Dynamic Status Color
    const statusColor = column.id === 'todo' ? 'bg-slate-400' :
        column.id === 'in_progress' ? 'bg-indigo-500' : 'bg-emerald-500';

    const statusBorder = column.id === 'todo' ? 'border-slate-400' :
        column.id === 'in_progress' ? 'border-indigo-500' : 'border-emerald-500';

    return (
        <div
            ref={setNodeRef}
            className="w-80 flex flex-col h-full bg-slate-100/80 dark:bg-[#121212] rounded-3xl border border-slate-200 dark:border-white/5 shadow-inner overflow-hidden group/col"
        >
            {/* Header */}
            <div className="p-5 pb-3 flex items-center justify-between bg-white/50 dark:bg-white/[0.02] border-b border-slate-200/50 dark:border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${statusColor} ring-4 ring-white dark:ring-[#121212] opacity-80`}></div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">{column.label}</h3>
                    <span className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                        {columnTasks.length}
                    </span>
                </div>
                <div className="w-8 h-8 rounded-full hover:bg-white dark:hover:bg-white/10 flex items-center justify-center text-slate-400 cursor-pointer transition-colors" onClick={onAddTask} title="Quick Add">
                    <FiPlus size={16} />
                </div>
            </div>

            {/* Tasks Area */}
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                <SortableContext
                    items={columnTasks.map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {columnTasks.map(task => (
                        <SortableTask
                            key={task._id}
                            task={task}
                            onUpdateStatus={onUpdateStatus}
                            onDelete={onDelete}
                            onViewDetails={onViewDetails}
                        />
                    ))}
                </SortableContext>

                {columnTasks.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-sm border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] m-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-300 dark:text-slate-600">
                            <FiInbox size={24} strokeWidth={1.5} />
                        </div>
                        <p className="font-medium opacity-70">No tasks in {column.label}</p>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-3 bg-gradient-to-t from-slate-100 to-transparent dark:from-[#121212] dark:to-transparent">
                <button
                    onClick={onAddTask}
                    className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-slate-500 hover:text-primary hover:border-primary/50 hover:bg-white dark:hover:bg-white/5 text-sm font-semibold transition-all flex items-center justify-center gap-2 group/btn"
                >
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs group-hover:bg-primary group-hover:text-white transition-colors">+</span>
                    Add New Task
                </button>
            </div>
        </div>
    );
};

const TaskDetailsModal = ({ task, onClose }) => {
    if (!task) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-dark-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wide ${(task.priority || 'low').toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                (task.priority || 'low').toLowerCase() === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                {task.priority || 'Low'}
                            </span>
                            {task.createdAt && (
                                <span className="text-slate-500 text-sm">Created {new Date(task.createdAt).toLocaleDateString()}</span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-white leading-tight">{task.title}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                        <div className="bg-slate-800/50 rounded-xl p-4 text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-700/50">
                            {task.description || "No description provided."}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Assignees</h3>
                            <div className="flex flex-wrap gap-2">
                                {task.assignees && task.assignees.length > 0 ? (
                                    task.assignees.map((a, i) => {
                                        if (!a) return null;
                                        return (
                                            <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 pr-3 border border-slate-700">
                                                <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                                                    {a.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-sm text-slate-200">{a.name || 'Unknown'}</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <span className="text-slate-500 italic text-sm">No assignees</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Due Date</h3>
                            <div className="flex items-center gap-2 text-slate-300 bg-slate-800/30 p-2 rounded-lg border border-slate-700/30 w-fit">
                                <FiCalendar className="text-primary" />
                                {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No Due Date'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState('board'); // 'board', 'list', 'timeline'

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [showProjectDeleteModal, setShowProjectDeleteModal] = useState(false);

    // Member Management State
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showMembersList, setShowMembersList] = useState(false); // State for viewing members
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);
    const [addMemberError, setAddMemberError] = useState('');
    const [allSystemUsers, setAllSystemUsers] = useState([]); // List of all users to pick from

    useEffect(() => {
        if (showAddMemberModal && allSystemUsers.length === 0) {
            api.get('/auth/users')
                .then(res => setAllSystemUsers(res.data))
                .catch(err => console.error("Failed to fetch users", err));
        }
    }, [showAddMemberModal, allSystemUsers.length]);

    // AI Modal State
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Project Info Modal State
    const [showProjectInfo, setShowProjectInfo] = useState(false);

    // Task Assignees State
    const [selectedAssignees, setSelectedAssignees] = useState([]);

    const fetchProjectData = async () => {
        try {
            const [projRes, tasksRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks/project/${id}`)
            ]);
            setProject(projRes.data);
            // Sort tasks by order
            const sortedTasks = tasksRes.data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setTasks(sortedTasks);
        } catch (error) {
            console.error("Failed to load project data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData();

        // Socket connection
        socket.connect();
        socket.emit("join_project", id);

        socket.on("project_updated", (updatedProject) => {
            if (updatedProject._id === id) {
                setProject(updatedProject);
            }
        });

        socket.on("task_created", (newTask) => {
            if (newTask.project === id) {
                setTasks(prev => {
                    if (prev.some(t => t._id === newTask._id)) return prev;
                    return [...prev, newTask].sort((a, b) => (a.order || 0) - (b.order || 0));
                });
            }
        });

        socket.on("task_updated", (updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        });

        socket.on("task_deleted", (taskId) => {
            setTasks(prev => prev.filter(t => t._id !== taskId));
        });

        socket.on("tasks_reordered", (reorderedUpdates) => {
            // reorderedUpdates is array of { _id, order, status }
            // We need to apply these to local tasks
            setTasks(prev => {
                const newTasks = prev.map(t => {
                    const update = reorderedUpdates.find(u => u._id === t._id);
                    if (update) {
                        return { ...t, order: update.order, status: update.status };
                    }
                    return t;
                });
                return newTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
            });
        });

        return () => {
            socket.off("project_updated");
            socket.off("task_created");
            socket.off("task_updated");
            socket.off("task_deleted");
            socket.off("tasks_reordered");
            socket.disconnect();
        };
    }, [id]);

    const handleUpdateStatus = async (taskId, newStatus) => {
        // Optimistic UI Update
        setTasks(prevTasks => prevTasks.map(t =>
            t._id === taskId ? { ...t, status: newStatus } : t
        ));

        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on error could be implemented here
        }
    };

    const handleDeleteTask = (taskId) => {
        setTaskToDelete(taskId);
        setShowDeleteModal(true);
    };

    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;
        const taskId = taskToDelete;
        setShowDeleteModal(false);
        setTaskToDelete(null);

        // Optimistic UI Update
        setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));

        try {
            await api.delete(`/tasks/${taskId}`);
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    const { user } = useAuth();
    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let combinedDate = undefined;
            if (newTaskDate) {
                const timeString = newTaskTime || '09:00'; // Default to 9 AM if no time picked
                combinedDate = new Date(`${newTaskDate}T${timeString}`);
            }

            const newTask = {
                title: newTaskTitle,
                description: newTaskDesc,
                priority: newTaskPriority,
                status: 'todo',
                project: id,
                order: tasks.filter(t => t.status === 'todo').length,
                assignees: selectedAssignees.length > 0 ? selectedAssignees : (user?._id ? [user._id] : []),
                dueDate: combinedDate
            };
            const { data } = await api.post('/tasks', newTask);

            // Check for duplicates before adding to state (in case socket event handled it first)
            setTasks(prevTasks => {
                if (prevTasks.some(t => t._id === data._id)) return prevTasks;
                return [...prevTasks, data];
            });

            setShowTaskModal(false);
            setNewTaskTitle('');
            setNewTaskDesc('');
            setNewTaskPriority('medium');
            setNewTaskDate('');
            setNewTaskTime('');
            setSelectedAssignees([]);
        } catch (error) {
            console.error("Failed to create task", error);
            alert("Failed to create task. Please check the inputs.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAIAnalyze = async () => {
        if (!newTaskDesc) return;
        setAiLoading(true);
        try {
            const { data } = await api.post('/tasks/analyze', { description: newTaskDesc });
            if (data.insight) {
                setAiInsight(data.insight);
                setShowAIModal(true);
            }
        } catch (error) {
            console.error("AI Analysis Failed", error);
            alert("Failed to get AI insight. Is the AI Service running?");
        } finally {
            setAiLoading(false);
        }
    };

    const handleAcceptAI = () => {
        // Strip markdown bolding from the insight before saving, and ensure no 'AI Insight' header duplication if redundant
        const cleanInsight = aiInsight.replace(/\*\*/g, '');

        // Replace existing description as requested
        setNewTaskDesc(cleanInsight);
        setShowAIModal(false);
    };

    const handleRejectAI = () => {
        // Retry analysis
        handleAIAnalyze();
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (selectedNewMembers.length === 0) return;

        try {
            const { data } = await api.post(`/projects/${id}/members`, { memberIds: selectedNewMembers });
            setProject(data); // Update project with new member list
            setShowAddMemberModal(false);
            setSelectedNewMembers([]);
            alert("Members added successfully!");
        } catch (error) {
            console.error("Failed to add member", error);
            alert(error.response?.data?.message || "Failed to add members");
        }
    };

    const handleUpdateProjectStatus = async (newStatus) => {
        if (newStatus === 'upcoming' && !confirm("Are you sure you want to move this project back to 'Upcoming'?")) return;
        if (newStatus === 'active' && !confirm("Are you sure you want to reactivate this project?")) return;

        try {
            const { data } = await api.put(`/projects/${id}`, { status: newStatus });
            setProject(data);
        } catch (error) {
            console.error("Failed to update project status", error);
            alert("Failed to update project status. " + (error.response?.data?.message || ""));
        }
    };

    const handleDeleteProject = async () => {
        try {
            await api.delete(`/projects/${id}`);
            navigate('/');
        } catch (error) {
            console.error("Failed to delete project", error);
            alert("Failed to delete project. " + (error.response?.data?.message || ""));
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activeTask = tasks.find(t => t._id === activeId);
        const overTask = tasks.find(t => t._id === overId);

        if (!activeTask) return;

        // Dropping over a column
        if (overId.startsWith('col-')) {
            const statusMap = {
                'col-todo': 'todo',
                'col-in_progress': 'in_progress',
                'col-done': 'done'
            };
            const newStatus = statusMap[overId];

            if (activeTask.status !== newStatus) {
                setTasks((items) => {
                    const activeIndex = items.findIndex((t) => t._id === activeId);
                    const newItems = [...items];
                    newItems[activeIndex] = { ...items[activeIndex], status: newStatus };
                    return newItems;
                });
            }
            return;
        }

        // Dropping over another task
        if (overTask && activeTask.status !== overTask.status) {
            setTasks((items) => {
                const activeIndex = items.findIndex((t) => t._id === activeId);
                const overIndex = items.findIndex((t) => t._id === overId);

                // Only if different status
                if (items[activeIndex].status !== items[overIndex].status) {
                    const newItems = [...items];
                    newItems[activeIndex] = { ...items[activeIndex], status: items[overIndex].status };
                    return arrayMove(newItems, activeIndex, overIndex - 1);
                }
                return items;
            });
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = tasks.find(t => t._id === activeId);
        if (!activeTask) return;

        let newStatus = activeTask.status;

        // Calculate new Tasks array
        let newTasks = [...tasks];

        if (overId.startsWith('col-')) {
            const statusMap = {
                'col-todo': 'todo',
                'col-in_progress': 'in_progress',
                'col-done': 'done'
            };
            newStatus = statusMap[overId];
            if (activeTask.status !== newStatus) {
                newTasks = newTasks.map(t => t._id === activeId ? { ...t, status: newStatus } : t);
            }
        } else {
            const overTask = tasks.find(t => t._id === overId);
            if (overTask) {
                newStatus = overTask.status;
                const oldIndex = tasks.findIndex(t => t._id === activeId);
                const newIndexRaw = tasks.findIndex(t => t._id === overId);
                newTasks = arrayMove(tasks, oldIndex, newIndexRaw);
                newTasks = newTasks.map(t => t._id === activeId ? { ...t, status: newStatus } : t);
            }
        }

        const reorderedTasks = newTasks.map((t, index) => ({
            ...t,
            order: index
        }));

        setTasks(reorderedTasks);

        const updates = reorderedTasks.map(t => ({
            _id: t._id,
            status: t.status,
            order: t.order
        }));

        try {
            await api.put('/tasks/reorder', { tasks: updates, projectId: id });
        } catch (error) {
            console.error("Failed to save order", error);
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading Project...</div>;
    if (!project) return <div className="p-10 text-center text-white">Project not found</div>;

    const columns = [
        { id: 'todo', label: 'To Do' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'done', label: 'Done' }
    ];

    const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

    const totalTasksCount = tasks.length;
    const completedTasksCount = tasks.filter(t => t.status === 'done').length;
    const progressPercentage = totalTasksCount === 0 ? 0 : Math.round((completedTasksCount / totalTasksCount) * 100);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white overflow-hidden">
            {/* Sidebar (Collapsed style for focus) */}
            <aside className="w-20 bg-white dark:bg-[#121212] border-r border-slate-200 dark:border-white/5 flex flex-col items-center py-6 z-20">
                <Link to="/" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-8 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm group">
                    <FiArrowLeft className="text-xl group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div className="space-y-6 w-full flex flex-col items-center">
                    <div
                        onClick={() => setViewMode('board')}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${viewMode === 'board' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Board View"
                    >
                        <FiLayout className="w-6 h-6" />
                        <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">Board View</span>
                    </div>
                    <div
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${viewMode === 'list' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="List View"
                    >
                        <FiList className="w-6 h-6" />
                        <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">List View</span>
                    </div>
                    <div
                        onClick={() => setViewMode('timeline')}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${viewMode === 'timeline' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Timeline View"
                    >
                        <FiClock className="w-6 h-6" />
                        <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">Timeline</span>
                    </div>
                    <div
                        onClick={() => setViewMode('analytics')}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${viewMode === 'analytics' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Analytics View"
                    >
                        <FiPieChart className="w-6 h-6" />
                        <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">Analytics</span>
                    </div>

                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0a0f1c] relative transition-colors duration-300">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-white to-transparent dark:from-slate-900 dark:to-transparent pointer-events-none"></div>

                    <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-8 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md z-10 transition-colors duration-300">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 transform hover:rotate-3 transition-transform">
                                <FiBriefcase className="text-white w-6 h-6" />
                            </div>
                            <div
                                className="cursor-pointer group"
                                onClick={() => setShowProjectInfo(true)}
                                title="Click to view full description"
                            >
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{project.name}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                    {project.description || "No description provided"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">

                            <div
                                className="flex -space-x-2 mr-4 items-center cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setShowMembersList(true)}
                                title="View Team Members"
                            >
                                {project.members && project.members.slice(0, 5).map((member) => {
                                    if (!member) return null;
                                    return (
                                        <div key={member._id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-50 dark:border-dark-card flex items-center justify-center text-xs font-bold text-white relative group">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span>{member.name?.charAt(0) || '?'}</span>
                                            )}
                                        </div>
                                    );
                                })}
                                {project.members && project.members.length > 5 && (
                                    <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-50 dark:border-dark-card flex items-center justify-center text-[10px] font-bold text-white relative z-10">
                                        +{project.members.length - 5}
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAddMemberModal(true);
                                    }}
                                    className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary transition-colors z-20 ml-2"
                                    title="Add Member"
                                >
                                    <FiPlus />
                                </button>
                            </div>

                            {/* Project Actions */}
                            <div className="flex items-center gap-2">
                                {project.status === 'active' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateProjectStatus('upcoming')}
                                            className="px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all flex items-center gap-2 font-medium"
                                            title="Move back to Upcoming"
                                        >
                                            <FiArrowLeft className="w-4 h-4" />
                                            <span>Upcoming</span>
                                        </button>

                                        {progressPercentage === 100 && (
                                            <button
                                                onClick={() => handleUpdateProjectStatus('completed')}
                                                className="px-4 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2"
                                                title="Mark as Completed"
                                            >
                                                <FiCheckCircle className="w-4 h-4" />
                                                <span className="font-medium">Complete</span>
                                            </button>
                                        )}
                                    </>
                                )}
                                {project.status === 'completed' && (
                                    <button
                                        onClick={() => handleUpdateProjectStatus('active')}
                                        className="px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center gap-2"
                                        title="Reactivate Project"
                                    >
                                        <FiPlay className="w-4 h-4" />
                                        <span className="font-medium">Activate</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowProjectDeleteModal(true)}
                                    className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Delete Project"
                                >
                                    <FiTrash2 className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => setShowTaskModal(true)}
                                    className="px-5 py-2.5 bg-primary hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ml-2"
                                >
                                    <span>+</span> Add Task
                                </button>
                            </div>
                        </div>
                    </header>

                    {viewMode === 'board' && (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <div className="flex-1 p-8 overflow-x-auto">
                                <div className="flex space-x-8 h-full min-w-max">
                                    {columns.map(col => (
                                        <DroppableColumn
                                            key={col.id}
                                            column={col}
                                            tasks={tasks}
                                            onUpdateStatus={handleUpdateStatus}
                                            onDelete={handleDeleteTask}
                                            onAddTask={() => setShowTaskModal(true)}
                                            onViewDetails={setSelectedTask}
                                        />
                                    ))}
                                </div>
                            </div>
                            <DragOverlay>
                                {activeTask ? (
                                    <TaskCard
                                        task={activeTask}
                                        onDelete={handleDeleteTask}
                                        onUpdateStatus={handleUpdateStatus}
                                        style={{ transform: 'rotate(2deg) scale(1.02)' }}
                                    />
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}

                    {viewMode === 'list' && (
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="bg-dark-card border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Task</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Priority</th>
                                            <th className="px-6 py-4">Assignees</th>
                                            <th className="px-6 py-4">Due Date</th>
                                            <th className="px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {tasks.map(task => (
                                            <tr key={task._id} onClick={() => setSelectedTask(task)} className="hover:bg-slate-800/30 transition-colors cursor-pointer group">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">{task.title}</div>
                                                    <div className="text-xs text-slate-500 truncate max-w-xs">{task.description}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${task.status === 'done' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        task.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                        }`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${(task.priority || 'low').toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        (task.priority || 'low').toLowerCase() === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                        }`}>
                                                        {task.priority || 'Low'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-1.5">
                                                        {task.assignees && task.assignees.map((a, i) => (
                                                            <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-dark-card flex items-center justify-center text-[9px] font-bold text-white shadow-sm" title={a.name}>
                                                                {a.name.charAt(0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400">
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }} className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {tasks.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 italic">No tasks found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {viewMode === 'timeline' && (
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="space-y-8 max-w-4xl mx-auto">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <FiClock className="text-primary" /> Project Timeline
                                </h3>
                                <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pl-8 pb-8">
                                    {tasks
                                        .sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'))
                                        .map((task, idx) => (
                                            <div key={task._id} className="relative group">
                                                <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-dark-bg ${task.status === 'done' ? 'bg-green-500' : 'bg-slate-600'} transition-all group-hover:scale-125`}></div>
                                                <div onClick={() => setSelectedTask(task)} className="bg-dark-card p-5 rounded-xl border border-slate-700 hover:border-primary/50 transition-all shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-sm font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'No Date'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${(task.priority || 'low').toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                            }`}>
                                                            {task.priority || 'Low'}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-lg text-white mb-2">{task.title}</h4>
                                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{task.description}</p>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-slate-500">Assignees:</span>
                                                        <div className="flex -space-x-1.5">
                                                            {task.assignees && task.assignees.map((a, i) => (
                                                                <div key={i} className="w-5 h-5 rounded-full bg-slate-700 border border-dark-card flex items-center justify-center text-[8px] font-bold text-white">
                                                                    {a.name.charAt(0)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    {tasks.length === 0 && (
                                        <div className="text-slate-500 italic pl-2">No tasks to display in timeline.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'analytics' && (
                        <ProjectAnalytics tasks={tasks} project={project} />
                    )}

                    {viewMode === 'team' && (
                        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0a0f1c] p-8">
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                    <span className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><FiUsers size={32} /></span>
                                    Project Team
                                </h3>

                                <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                    {/* Owner */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full ring-4 ring-amber-500/20 p-0.5 bg-white dark:bg-black">
                                                {project.owner && (project.owner.avatar ? (
                                                    <img src={project.owner.avatar} alt={project.owner.name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {project.owner.name?.charAt(0) || '?'}
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{project.owner?.name}</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{project.owner?.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-3 py-1.5 rounded-full">Project Lead</span>
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 ml-2">Team Members ({project.members?.length || 0})</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {project.members && project.members.map(member => {
                                            if (!member) return null;
                                            return (
                                                <div key={member._id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-primary/30 transition-all group">
                                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                        {member.avatar ? (
                                                            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            member.name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{member.name || 'Unknown'}</h4>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{member.email || 'No Email'}</p>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg" title="View Profile">
                                                            <FiArrowRight />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!project.members || project.members.length === 0) && (
                                            <div className="col-span-2 text-center py-8 text-slate-500 italic">
                                                No team members added yet.
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all flex items-center gap-2"
                                        >
                                            <FiPlus /> Invite New Members
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-sm">
                            <h3 className="text-lg font-bold mb-2 text-white">Delete Task?</h3>
                            <p className="text-slate-400 mb-6 text-sm">Are you sure you want to delete this task? This action cannot be undone.</p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteTask}
                                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 rounded text-sm font-semibold transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Task Modal */}
                {showTaskModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <h3 className="text-xl font-bold mb-4">Add New Task</h3>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                                    <div className="relative">
                                        <textarea
                                            value={newTaskDesc}
                                            onChange={e => setNewTaskDesc(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none h-24 resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAIAnalyze}
                                            disabled={aiLoading}
                                            className="absolute bottom-2 right-2 bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 border border-indigo-500/30 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
                                        >
                                            {aiLoading ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                                                    Thinking...
                                                </span>
                                            ) : (
                                                <>
                                                    <span>✨</span> Analyze
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Assignees (Optional)</label>
                                    <div className="bg-slate-800 border border-slate-700 rounded p-2 max-h-32 overflow-y-auto custom-scrollbar">
                                        {project && [project.owner, ...(project.members || [])].filter((v, i, a) => a.findIndex(t => (t?._id === v?._id)) === i).map(member => {
                                            if (!member) return null;
                                            const isSelected = selectedAssignees.includes(member._id);
                                            return (
                                                <div
                                                    key={member._id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedAssignees(prev => prev.filter(id => id !== member._id));
                                                        } else {
                                                            setSelectedAssignees(prev => [...prev, member._id]);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-2 p-1.5 rounded mb-1 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-500/20 border border-indigo-500/50' : 'hover:bg-slate-700 border border-transparent'}`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isSelected ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                                                        {isSelected ? <FiCheckCircle /> : member.name?.charAt(0)}
                                                    </div>
                                                    <span className={`text-sm truncate ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                                                        {member.name}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Due Date & Time</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={newTaskDate}
                                            onChange={e => setNewTaskDate(e.target.value)}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                        />
                                        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded p-1">
                                            {/* Hours */}
                                            <select
                                                className="bg-transparent text-white p-1 focus:outline-none text-center appearance-none w-12"
                                                value={newTaskTime ? (parseInt(newTaskTime.split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '09'}
                                                onChange={(e) => {
                                                    const newHour12 = parseInt(e.target.value);
                                                    const current24 = newTaskTime || '09:00';
                                                    const [h, m] = current24.split(':').map(Number);
                                                    const isPM = h >= 12;

                                                    let newHour24 = newHour12;
                                                    if (isPM && newHour12 !== 12) newHour24 += 12;
                                                    if (!isPM && newHour12 === 12) newHour24 = 0;

                                                    setNewTaskTime(`${newHour24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                                                }}
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                    <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <span className="text-slate-500">:</span>
                                            {/* Minutes */}
                                            <select
                                                className="bg-transparent text-white p-1 focus:outline-none text-center appearance-none w-12"
                                                value={newTaskTime ? newTaskTime.split(':')[1] : '00'}
                                                onChange={(e) => {
                                                    const newMin = e.target.value;
                                                    const current24 = newTaskTime || '09:00';
                                                    const [h] = current24.split(':');
                                                    setNewTaskTime(`${h}:${newMin}`);
                                                }}
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                                                    <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            {/* AM/PM */}
                                            <select
                                                className="bg-slate-700 text-xs text-white p-1.5 rounded ml-1 focus:outline-none"
                                                value={newTaskTime && parseInt(newTaskTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                                onChange={(e) => {
                                                    const newPeriod = e.target.value;
                                                    const current24 = newTaskTime || '09:00';
                                                    let [h, m] = current24.split(':').map(Number);

                                                    if (newPeriod === 'AM' && h >= 12) h -= 12;
                                                    if (newPeriod === 'PM' && h < 12) h += 12;

                                                    setNewTaskTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                                                }}
                                            >
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Priority</label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={e => setNewTaskPriority(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowTaskModal(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-primary rounded hover:bg-indigo-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
                }

                {/* AI Insight Modal */}
                {
                    showAIModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
                            <div className="bg-dark-card rounded-2xl border border-slate-700 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="text-2xl">✨</span> AI Analysis Result
                                    </h3>
                                    <button onClick={() => setShowAIModal(false)} className="text-slate-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800">✕</button>
                                </div>

                                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#0f1623]">
                                    <div className="prose prose-invert max-w-none">
                                        <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-base font-light">
                                            {/* Display cleaned text for viewing */}
                                            {aiInsight.replace(/\*\*/g, '')}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex justify-between items-center backdrop-blur-xl">
                                    <div className="text-xs text-slate-500 italic flex items-center gap-1">
                                        <span>🤖</span> Generated by Llama-3
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleRejectAI}
                                            className="px-5 py-2.5 border border-slate-600 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition-all flex items-center gap-2 hover:border-slate-500"
                                            disabled={aiLoading}
                                        >
                                            {aiLoading ? 'Retrying...' : (
                                                <>
                                                    <span>↻</span> Retry
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleAcceptAI}
                                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                                        >
                                            <span>✓</span> Replace Description
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Task Details Modal */}
                {
                    selectedTask && (
                        <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
                    )
                }

                {/* Project Delete Modal */}
                {
                    showProjectDeleteModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]">
                            <div className="bg-dark-card p-6 rounded-2xl border border-red-500/30 w-full max-w-md shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-16 bg-red-500/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>

                                <h3 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
                                    <span className="text-red-500 bg-red-500/10 p-2 rounded-lg"><FiTrash2 /></span> Delete Project?
                                </h3>
                                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                                    Are you sure you want to delete <span className="text-white font-bold">{project.name}</span>?
                                    <br /><br />
                                    This will permanently delete the project and all its {tasks.length} tasks. This action cannot be undone.
                                </p>

                                <div className="flex justify-end gap-3 relative z-10">
                                    <button
                                        type="button"
                                        onClick={() => setShowProjectDeleteModal(false)}
                                        className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteProject}
                                        className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/20 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        Delete Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Add Member Modal */}
                {
                    showAddMemberModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-sm">
                                <h3 className="text-xl font-bold mb-4 text-white">Add Team Member</h3>
                                <form onSubmit={handleAddMember} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Select User to Add</label>
                                        <div className="bg-slate-800 border border-slate-700 rounded-xl max-h-60 overflow-y-auto custom-scrollbar p-2">
                                            {allSystemUsers
                                                .filter(u =>
                                                    // Exclude owner
                                                    (project.owner?._id !== u._id) &&
                                                    // Exclude existing members
                                                    !project.members?.some(m => m._id === u._id)
                                                )
                                                .map(u => {
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
                                                                : 'hover:bg-slate-700 border-transparent'}`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-colors ${isSelected ? 'bg-primary' : 'bg-slate-600'}`}>
                                                                {isSelected ? <FiCheckCircle /> : u.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-white'}`}>{u.name}</div>
                                                                <div className="text-xs text-slate-400 truncate">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            {allSystemUsers.filter(u => (project.owner?._id !== u._id) && !project.members?.some(m => m._id === u._id)).length === 0 && (
                                                <p className="text-center text-slate-500 text-sm py-4">No new users available to add.</p>
                                            )}
                                        </div>
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
                                            disabled={selectedNewMembers.length === 0}
                                            className="px-4 py-2 bg-primary rounded hover:bg-indigo-600 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Add {selectedNewMembers.length > 0 ? `${selectedNewMembers.length} ` : ''}Member{selectedNewMembers.length !== 1 ? 's' : ''}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* View Members List Modal - REMOVED since we have full view now? No, keep logic for header click if they want, or remove. Let's keep for backward compat but maybe not needed if sidebar is primary. User didn't ask to remove. */}
                {/* View Members List Modal */}
                {showMembersList && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
                        <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FiUser className="text-primary" /> Project Team
                                </h3>
                                <button
                                    onClick={() => setShowMembersList(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {/* Owner */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full ring-2 ring-amber-500/30 p-0.5">
                                            {project.owner && (project.owner.avatar ? (
                                                <img src={project.owner.avatar} alt={project.owner.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                                    {project.owner.name.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{project.owner?.name} <span className="text-xs font-normal text-slate-500">(Owner)</span></h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{project.owner?.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-1 rounded-full">Lead</span>
                                </div>

                                {/* Members */}
                                {project.members && project.members.map(member => {
                                    if (!member) return null;
                                    return (
                                        <div key={member._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-primary/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full">
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                                            {member.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{member.name || 'Unknown User'}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.email || 'No Email'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-full">Member</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowMembersList(false);
                                        setShowAddMemberModal(true);
                                    }}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                                >
                                    <FiPlus /> Add New Member
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Project Info Modal */}
                {showProjectInfo && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[90]" onClick={() => setShowProjectInfo(false)}>
                        <div className="bg-dark-card w-full max-w-lg p-8 rounded-2xl border border-slate-700 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setShowProjectInfo(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <FiX size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
                                    <FiBriefcase className="text-white w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white leading-tight">{project.name}</h2>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        project.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                    <div className="bg-slate-800/50 rounded-xl p-4 text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-700/50 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {project.description || "No description provided for this project."}
                                    </div>
                                </div>

                                {project.deadline && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Deadline</h3>
                                        <div className="flex items-center gap-2 text-slate-300 bg-slate-800/30 p-2 rounded-lg border border-slate-700/30 w-fit">
                                            <FiCalendar className="text-rose-400" />
                                            {new Date(project.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                                <button
                                    onClick={() => setShowProjectInfo(false)}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
