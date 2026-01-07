import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api';
import socket from '../socket';
import './CalendarStyles.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiList, FiDownload, FiExternalLink } from 'react-icons/fi';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const CustomToolbar = ({ label, onNavigate, onView, view, date, isGoogleConnected }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-1">
                    <button
                        onClick={() => onNavigate('PREV')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onNavigate('DATE', new Date())}
                        className="px-4 py-1.5 text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => onNavigate('NEXT')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {/* Month Selector */}
                    <div className="relative group">
                        <select
                            value={date.getMonth()}
                            onChange={(e) => {
                                const newDate = new Date(date);
                                newDate.setMonth(parseInt(e.target.value));
                                onNavigate('DATE', newDate);
                            }}
                            className="appearance-none bg-transparent text-2xl font-bold text-slate-900 dark:text-white cursor-pointer pr-6 focus:outline-none hover:text-primary transition-colors"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i} className="text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Year Selector */}
                    <div className="relative group">
                        <select
                            value={date.getFullYear()}
                            onChange={(e) => {
                                const newDate = new Date(date);
                                newDate.setFullYear(parseInt(e.target.value));
                                onNavigate('DATE', newDate);
                            }}
                            className="appearance-none bg-transparent text-2xl font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none hover:text-primary transition-colors"
                        >
                            {Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i; // Range: -2 to +7 years from now
                                return (
                                    <option key={year} value={year} className="text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                        {year}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex bg-white dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                <button
                    onClick={() => {
                        alert("For a full calendar sync, we recommend using the 'Export' feature to get an .ics file you can import into Google/Outlook/Apple Calendar.");
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
                >
                    <FiDownload className="w-4 h-4" />
                    <span className="hidden md:inline">Export .ics</span>
                </button>
                {!isGoogleConnected && (
                    <button
                        onClick={() => window.location.href = "http://localhost:5005/api/auth/google"}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-blue-500 transition-colors"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                        <span className="hidden md:inline">Connect Google</span>
                    </button>
                )}
                <div className="w-[1px] bg-slate-200 dark:bg-white/10 mx-1"></div>
                {['month', 'week', 'day', 'agenda'].map((v) => (
                    <button
                        key={v}
                        onClick={() => onView(v)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${view === v
                            ? 'bg-primary text-white shadow-lg shadow-indigo-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
        </div>
    );
};

const CustomEvent = ({ event }) => {
    const isProject = event.resource.type === 'project';

    const handleAddToGoogle = (e) => {
        e.stopPropagation();
        const start = new Date(event.start).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(event.end).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const details = isProject ? `Project Deadline for ${event.resource.name}\n${event.resource.description || ''}` : event.resource.description || '';
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(event.resource.project?.name || 'Smart Project Manager')}`;
        window.open(url, '_blank');
    };

    return (
        <div className="h-full flex flex-col justify-between" title={event.title}>
            <div className={`font-semibold truncate ${isProject ? 'uppercase tracking-wider text-[10px]' : ''}`}>
                {event.title}
            </div>
            {!isProject && (
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] opacity-75 truncate">{event.resource.project?.name}</span>
                    <button
                        onClick={handleAddToGoogle}
                        className="p-1 hover:bg-white/20 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Add to Google Calendar"
                    >
                        <FiExternalLink size={12} />
                    </button>
                </div>
            )}
            {isProject && (
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] opacity-75 uppercase">Project Deadline</span>
                    <button
                        onClick={handleAddToGoogle}
                        className="p-1 hover:bg-white/20 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <FiExternalLink size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

const Calendar = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const navigate = useNavigate();
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    // Helper functions for strict filtering
    const isMyTask = (t) => {
        if (!user) return false;
        if (!t.assignees || t.assignees.length === 0) return false;
        return t.assignees.some(a => (a._id || a) === user._id);
    };

    const isMyProject = (p) => {
        if (!user) return false;
        const userId = user._id;
        const ownerId = p.owner?._id || p.owner;
        if (ownerId === userId) return true;
        if (p.members && p.members.some(m => (m._id || m) === userId)) return true;
        return false;
    };

    const isValidDate = (d) => {
        if (!d) return false;
        const date = new Date(d);
        return !isNaN(date.getTime());
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const [tasksRes, projectsRes] = await Promise.all([
                    api.get('/tasks/my-tasks'),
                    api.get('/projects')
                ]);

                const taskEvents = tasksRes.data
                    .filter(task => isValidDate(task.dueDate))
                    .map(task => ({
                        id: task._id,
                        title: task.title,
                        start: new Date(task.dueDate),
                        end: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000),
                        resource: { ...task, type: 'task' },
                    }));

                const projectEvents = projectsRes.data
                    .filter(project => isValidDate(project.deadline) && isMyProject(project))
                    .map(project => ({
                        id: project._id,
                        title: `🏁 ${project.name}`,
                        start: new Date(project.deadline),
                        end: new Date(new Date(project.deadline).getTime() + 60 * 60 * 1000), // 1 hour duration for visibility
                        resource: { ...project, type: 'project' },
                        allDay: true
                    }));

                setEvents([...taskEvents, ...projectEvents]);
            } catch (error) {
                console.error("Failed to fetch calendar data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        const fetchGoogleEvents = async () => {
            try {
                const res = await api.get('/integrations/google-calendar/events');
                const googleEvents = res.data.map(gEvent => ({
                    id: gEvent.id,
                    title: gEvent.summary,
                    start: new Date(gEvent.start.dateTime || gEvent.start.date),
                    end: new Date(gEvent.end.dateTime || gEvent.end.date),
                    allDay: !gEvent.start.dateTime,
                    resource: { ...gEvent, type: 'google-event' }
                }));
                setEvents(prev => {
                    // Filter out old google events to avoid duplicates if re-fetching
                    const nonGoogle = prev.filter(e => e.resource.type !== 'google-event');
                    return [...nonGoogle, ...googleEvents];
                });
                setIsGoogleConnected(true);
            } catch (error) {
                console.log("Google Calendar not connected or failed to fetch", error);
                setIsGoogleConnected(false);
            }
        };
        fetchGoogleEvents();

        // Real-time updates with strict ownership and deadline checks


        socket.on("task_created", (newTask) => {
            if (isValidDate(newTask.dueDate) && isMyTask(newTask)) {
                setEvents(prev => [...prev, {
                    id: newTask._id,
                    title: newTask.title,
                    start: new Date(newTask.dueDate),
                    end: new Date(new Date(newTask.dueDate).getTime() + 60 * 60 * 1000),
                    resource: { ...newTask, type: 'task' },
                }]);
            }
        });

        // Add project listeners
        socket.on("project_created", (newProject) => {
            if (isValidDate(newProject.deadline) && isMyProject(newProject)) {
                setEvents(prev => [...prev, {
                    id: newProject._id,
                    title: `🏁 ${newProject.name}`,
                    start: new Date(newProject.deadline),
                    end: new Date(new Date(newProject.deadline).getTime() + 60 * 60 * 1000),
                    resource: { ...newProject, type: 'project' },
                    allDay: true
                }]);
            }
        });

        socket.on("project_updated", (updatedProject) => {
            setEvents(prev => {
                const existing = prev.find(e => e.id === updatedProject._id && e.resource.type === 'project');

                // If strictly filters fail, ensure removal
                if (!isValidDate(updatedProject.deadline) || !isMyProject(updatedProject)) {
                    if (existing) return prev.filter(e => e.id !== updatedProject._id);
                    return prev;
                }

                const newEvent = {
                    id: updatedProject._id,
                    title: `🏁 ${updatedProject.name}`,
                    start: new Date(updatedProject.deadline),
                    end: new Date(new Date(updatedProject.deadline).getTime() + 60 * 60 * 1000),
                    resource: { ...updatedProject, type: 'project' },
                    allDay: true
                };

                if (existing) {
                    return prev.map(e => e.id === updatedProject._id ? newEvent : e);
                } else {
                    return [...prev, newEvent];
                }
            });
        });

        socket.on("project_deleted", (deletedId) => {
            setEvents(prev => prev.filter(e => e.id !== deletedId));
        });

        socket.on("task_updated", (updatedTask) => {
            setEvents(prev => {
                const existing = prev.find(e => e.id === updatedTask._id && e.resource.type === 'task');

                // If it's no longer my task OR no longer has a due date, remove it
                if (!isValidDate(updatedTask.dueDate) || !isMyTask(updatedTask)) {
                    if (existing) return prev.filter(e => e.id !== updatedTask._id);
                    return prev;
                }

                // Otherwise, add or update
                const newEvent = {
                    id: updatedTask._id,
                    title: updatedTask.title,
                    start: new Date(updatedTask.dueDate),
                    end: new Date(new Date(updatedTask.dueDate).getTime() + 60 * 60 * 1000),
                    resource: { ...updatedTask, type: 'task' },
                };

                if (existing) {
                    return prev.map(e => e.id === updatedTask._id ? newEvent : e);
                } else {
                    return [...prev, newEvent];
                }
            });
        });

        socket.on("task_deleted", (deletedId) => {
            setEvents(prev => prev.filter(e => e.id !== deletedId));
        });

        return () => {
            socket.off("task_created");
            socket.off("task_updated");
            socket.off("task_deleted");
            socket.off("project_created");
            socket.off("project_updated");
            socket.off("project_deleted");
        };
    }, []);

    const handleSelectEvent = (event) => {
        if (event.resource.type === 'project') {
            navigate(`/project/${event.resource._id}`);
            return;
        }
        if (event.resource.project && event.resource.project._id) {
            navigate(`/project/${event.resource.project._id}`);
        }
    };

    const eventStyleGetter = (event) => {
        if (event.resource.type === 'project') {
            return {
                style: {
                    backgroundColor: '#7c3aed', // Purple for projects
                    borderColor: '#5b21b6',
                    borderRadius: '8px',
                    opacity: 1,
                    color: 'white',
                    border: '1px solid #5b21b6',
                    display: 'block',
                    fontSize: '0.85em',
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)'
                }
            };
        }

        if (event.resource.type === 'google-event') {
            return {
                style: {
                    backgroundColor: '#4285F4', // Google Blue
                    borderColor: '#3367D6',
                    borderRadius: '8px',
                    opacity: 1,
                    color: 'white',
                    border: '1px solid #3367D6',
                    display: 'block',
                    fontSize: '0.85em',
                    fontWeight: '500',
                    padding: '4px 8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
            };
        }

        const priorityColors = {
            high: { bg: '#ef4444', border: '#b91c1c' },
            medium: { bg: '#f97316', border: '#c2410c' },
            low: { bg: '#3b82f6', border: '#1d4ed8' }
        };
        const color = priorityColors[event.resource.priority || 'low'];

        return {
            style: {
                backgroundColor: color.bg,
                borderColor: color.border,
                borderRadius: '8px',
                opacity: 0.9,
                color: 'white',
                border: '1px solid ' + color.border,
                display: 'block',
                fontSize: '0.85em',
                fontWeight: '600',
                padding: '4px 8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }
        };
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col bg-slate-50 dark:bg-[#0a0f1c] text-slate-900 dark:text-white p-6 overflow-hidden"
        >
            <div className="flex-1 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 flex flex-col relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        views={['month', 'week', 'day', 'agenda']}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={handleNavigate}
                        components={{
                            toolbar: props => <CustomToolbar {...props} date={date} isGoogleConnected={isGoogleConnected} />,
                            event: CustomEvent
                        }}
                        popup
                        onSelectEvent={handleSelectEvent}
                        className="custom-calendar"
                    />
                )}
            </div>
        </motion.div>
    );
};

export default Calendar;
