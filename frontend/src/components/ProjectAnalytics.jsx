import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';

const ProjectAnalytics = ({ tasks, project }) => {
    // 1. Calculate Statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // 2. Prepare Data for Charts

    // Priority Distribution
    const priorities = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
        const p = (t.priority || 'low').toLowerCase();
        if (priorities[p] !== undefined) priorities[p]++;
        else priorities.low++; // default
    });

    const priorityData = [
        { name: 'High', value: priorities.high, color: '#ef4444' }, // Red-500
        { name: 'Medium', value: priorities.medium, color: '#f97316' }, // Orange-500
        { name: 'Low', value: priorities.low, color: '#10b981' } // Emerald-500
    ].filter(d => d.value > 0);

    // Status Distribution
    const statuses = { todo: 0, in_progress: 0, done: 0 };
    tasks.forEach(t => {
        if (statuses[t.status] !== undefined) statuses[t.status]++;
    });

    const statusData = [
        { name: 'To Do', value: statuses.todo, color: '#94a3b8' }, // Slate-400
        { name: 'In Progress', value: statuses.in_progress, color: '#6366f1' }, // Indigo-500
        { name: 'Done', value: statuses.done, color: '#22c55e' } // Green-500
    ];

    // Assignee Performance (Top 5)
    const assigneeStats = {};
    tasks.forEach(t => {
        if (t.assignees && t.assignees.length > 0) {
            t.assignees.forEach(a => {
                const name = a.name.split(' ')[0]; // First name
                if (!assigneeStats[name]) assigneeStats[name] = { name, tasks: 0, completed: 0 };
                assigneeStats[name].tasks++;
                if (t.status === 'done') assigneeStats[name].completed++;
            });
        } else {
            if (!assigneeStats['Unassigned']) assigneeStats['Unassigned'] = { name: 'Unassigned', tasks: 0, completed: 0 };
            assigneeStats['Unassigned'].tasks++;
            if (t.status === 'done') assigneeStats['Unassigned'].completed++;
        }
    });

    const assigneeData = Object.values(assigneeStats)
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 5);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-white mb-1">{label || payload[0].name}</p>
                    <p className="text-slate-300">Count: <span className="text-white font-mono">{payload[0].value}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        📊 Project Analytics
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time insights for <span className="font-semibold text-primary">{project?.name}</span></p>
                </header>

                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Total Tasks</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalTasks}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Completed</p>
                        <p className="text-3xl font-bold text-emerald-500">{completedTasks}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Pending</p>
                        <p className="text-3xl font-bold text-orange-500">{statuses.todo + statuses.in_progress}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Team Size</p>
                        <p className="text-3xl font-bold text-blue-500">{project?.members?.length || 0}</p>
                    </motion.div>
                </div>

                {/* Progress Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
                >
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Project Completion Rate</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Overall progress across all tasks</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-primary">{completionRate}%</span>
                            <p className="text-xs text-emerald-500 font-medium">{completionRate >= 100 ? 'Completed' : 'On Track'}</p>
                        </div>
                    </div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionRate}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        ></motion.div>
                    </div>
                </motion.div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Priority Distribution - Pie Chart */}
                    <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                        <h4 className="w-full text-left text-lg font-bold text-slate-900 dark:text-white mb-6">Priority Distribution</h4>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={priorityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Distribution - Bar Chart */}
                    <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tasks by Status</h4>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50} animationDuration={1500}>
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Team Performance - Bar Chart */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Contributors</h4>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assigneeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#94a3b8"
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                    width={80}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="tasks" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: 'rgba(255,255,255,0.02)' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectAnalytics;
