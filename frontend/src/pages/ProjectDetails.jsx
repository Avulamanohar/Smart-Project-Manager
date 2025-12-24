import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import socket from '../socket';
import { DndContext, closestCenter, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiArrowLeft, FiLayout, FiList, FiClock } from 'react-icons/fi';

const TaskCard = ({ task, onDelete, onUpdateStatus, style, innerRef, ...props }) => {
    return (
        <div
            ref={innerRef}
            style={style}
            {...props}
            className="group bg-dark-card p-4 rounded-xl border border-slate-700/50 mb-3 shadow-sm hover:shadow-lg hover:border-primary/50 cursor-grab active:cursor-grabbing transform transition-all hover:-translate-y-0.5 relative"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${(task.priority || 'low').toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    (task.priority || 'low').toLowerCase() === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                    {task.priority || 'Low'}
                </span>
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                    className="text-slate-600 hover:text-red-500 transition-colors"
                    title="Abort Task"
                >
                    🗑️
                </button>
            </div>

            <h4 className="font-semibold text-white mb-1.5 leading-tight">{task.title}</h4>
            {task.description && (
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{task.description}</p>
            )}

            <div className="flex gap-2 mb-3">
                {task.status === 'todo' && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(task._id, 'in_progress'); }}
                        className="flex-1 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold rounded border border-indigo-500/30 transition-colors"
                    >
                        ▶ Start
                    </button>
                )}
                {task.status !== 'done' && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(task._id, 'done'); }}
                        className="flex-1 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-semibold rounded border border-green-500/30 transition-colors"
                    >
                        ✓ Complete
                    </button>
                )}
            </div>

            <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-800/50">
                <div className="flex items-center text-slate-500 gap-1">
                    <span>📅</span>
                    <span>
                        {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'No Date'
                        }
                    </span>
                </div>
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-1.5">
                        {task.assignees.map((a, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-dark-card flex items-center justify-center text-[9px] font-bold text-white shadow-sm" title={a.name}>
                                {a.name.charAt(0)}
                            </div>
                        ))}
                    </div>
                )}
                {(!task.assignees || task.assignees.length === 0) && (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-transparent border-dashed flex items-center justify-center text-slate-600 text-[10px]">
                        +
                    </div>
                )}
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
            {...attributes}
            {...listeners}
            {...props}
        />
    );
};

const DroppableColumn = ({ column, tasks, onUpdateStatus, onDelete, onAddTask }) => {
    const { setNodeRef } = useDroppable({
        id: `col-${column.id}`,
    });

    const columnTasks = tasks.filter(t => t.status === column.id);

    return (
        <div ref={setNodeRef} className="w-80 flex flex-col h-full group/col">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.id === 'todo' ? 'bg-slate-400' :
                        column.id === 'in_progress' ? 'bg-indigo-400' : 'bg-green-400'
                        }`}></div>
                    <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">{column.label}</h3>
                    <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {columnTasks.length}
                    </span>
                </div>
                <div className="text-slate-600 hover:text-slate-400 cursor-pointer text-lg">...</div>
            </div>

            <div className="flex-1 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800/50 p-3 overflow-y-auto hover:bg-slate-900/50 hover:border-slate-700/50 transition-colors">
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
                        />
                    ))}
                </SortableContext>

                {columnTasks.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-slate-600 text-sm italic opacity-50">
                        No tasks in {column.label}
                    </div>
                )}

                <button
                    onClick={onAddTask}
                    className="w-full py-2 mt-2 text-slate-500 hover:text-primary hover:bg-slate-800 rounded-lg text-sm transition-colors flex items-center justify-center opacity-0 group-hover/col:opacity-100"
                >
                    + New Task
                </button>
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

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState('board'); // 'board', 'list', 'timeline'

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    // Member Management State
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [addMemberError, setAddMemberError] = useState('');

    // AI Modal State
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

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
                assignees: user?._id ? [user._id] : [],
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
        try {
            const { data } = await api.post(`/projects/${id}/members`, { email: newMemberEmail });
            setProject(data); // Update project with new member list
            setShowAddMemberModal(false);
            setNewMemberEmail('');
            alert("Member added successfully!");
        } catch (error) {
            console.error("Failed to add member", error);
            alert(error.response?.data?.message || "Failed to add member");
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

    return (
        <div className="flex h-screen bg-dark-bg text-white overflow-hidden">
            {/* Sidebar (Collapsed style for focus) */}
            <aside className="w-20 bg-dark-card border-r border-slate-800 flex flex-col items-center py-6 z-20">
                <Link to="/" className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-8 hover:bg-slate-700 hover:text-white text-slate-400 transition-all border border-slate-700 hover:border-slate-600 shadow-sm group">
                    <FiArrowLeft className="text-xl group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div className="space-y-6 w-full flex flex-col items-center">
                    <div
                        onClick={() => setViewMode('board')}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${viewMode === 'board' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        title="Board View"
                    >
                        <FiLayout className="w-6 h-6" />
                        <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">Board View</span>
                    </div>
                    <div
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${viewMode === 'list' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        title="List View"
                    >
                        <FiList className="w-6 h-6" />
                        <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">List View</span>
                    </div>
                    <div
                        onClick={() => setViewMode('timeline')}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${viewMode === 'timeline' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        title="Timeline View"
                    >
                        <FiClock className="w-6 h-6" />
                        <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">Timeline</span>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0f1c] relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none"></div>

                    <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-dark-bg/80 backdrop-blur-md z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                                📝
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{project.name}</h2>
                                <p className="text-xs text-slate-400 max-w-md truncate">{project.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex -space-x-2 mr-4 items-center">
                                {project.members && project.members.map((member) => (
                                    <div key={member._id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-dark-card flex items-center justify-center text-xs font-bold text-white relative group cursor-pointer" title={`${member.name} (${member.email})`}>
                                        {member.avatar ? (
                                            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span>{member.name.charAt(0)}</span>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => setShowAddMemberModal(true)}
                                    className="w-8 h-8 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-400 transition-colors z-10"
                                    title="Add Member"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="px-5 py-2.5 bg-primary hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <span>+</span> Add Task
                            </button>
                        </div>
                    </header>

                    {viewMode === 'board' && (
                        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                                            <tr key={task._id} className="hover:bg-slate-800/30 transition-colors">
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
                                                    <button onClick={() => handleDeleteTask(task._id)} className="text-slate-500 hover:text-red-400 transition-colors">🗑️</button>
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
                                                <div className="bg-dark-card p-5 rounded-xl border border-slate-700 hover:border-primary/50 transition-all shadow-sm">
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
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-md">
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
                )}

                {/* AI Insight Modal */}
                {showAIModal && (
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
                )}

                {/* Add Member Modal */}
                {showAddMemberModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-sm">
                            <h3 className="text-xl font-bold mb-4 text-white">Add Team Member</h3>
                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Member Email</label>
                                    <input
                                        type="email"
                                        value={newMemberEmail}
                                        onChange={e => setNewMemberEmail(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                        placeholder="user@example.com"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">User must already be registered.</p>
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
                                        className="px-4 py-2 bg-primary rounded hover:bg-indigo-600 font-semibold text-white"
                                    >
                                        Add Member
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
