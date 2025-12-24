const Task = require('../models/Task');
const axios = require('axios');

const { getIO } = require('../socket');

// @desc    Analyze task description using AI Service
// @route   POST /api/tasks/analyze
// @access  Private
const analyzeTask = async (req, res) => {
    const { description } = req.body;

    try {
        // Call Python AI Service
        const response = await axios.post('http://localhost:5001/api/analyze', {
            description
        });

        res.json(response.data);
    } catch (error) {
        console.error("AI Service Error:", error.message);
        res.status(503).json({ message: 'AI Service unavailable' });
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    const { title, description, status, priority, project, assignees, dueDate } = req.body;

    const task = await Task.create({
        title,
        description,
        status,
        priority,
        project,
        assignees,
        dueDate,
    });

    const { addToGoogleCalendar } = require('../services/googleCalendarService');

    const populatedTask = await Task.findById(task._id).populate('assignees', 'name email avatar');

    // Add to Google Calendar if due date exists and user is connected
    if (dueDate) {
        await addToGoogleCalendar(req.user._id, task);
    }

    try {
        const io = getIO();
        io.to(project).emit("task_created", populatedTask);
    } catch (error) {
        console.error("Socket emit error:", error);
    }

    res.status(201).json(populatedTask);
};

// @desc    Get tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res) => {
    const tasks = await Task.find({ project: req.params.projectId })
        .populate('assignees', 'name email avatar');

    res.json(tasks);
};

// @desc    Update task status (drag and drop)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (task) {
        task.status = req.body.status || task.status;
        task.priority = req.body.priority || task.priority;
        task.assignees = req.body.assignees || task.assignees;

        const updatedTask = await task.save();

        // Populate manually or re-fetch if needed, but for status update it might be fine.
        // Better to populate to match frontend expectations if we replace the object.
        // But purely for status update, sending the object is usually enough if frontend merges.
        // Let's re-fetch to be safe and consistent.
        const populatedTask = await Task.findById(updatedTask._id).populate('assignees', 'name email avatar');

        try {
            const io = getIO();
            io.to(task.project.toString()).emit("task_updated", populatedTask);
        } catch (error) {
            console.error("Socket emit error:", error);
        }

        res.json(updatedTask);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (task) {
        const projectId = task.project.toString();
        await task.deleteOne();

        try {
            const io = getIO();
            io.to(projectId).emit("task_deleted", req.params.id);
        } catch (error) {
            console.error("Socket emit error:", error);
        }

        res.json({ message: 'Task removed' });
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
};

const reorderTasks = async (req, res) => {
    const { tasks, projectId } = req.body; // Array of { _id, order, status } and projectId

    if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    try {
        const bulkOps = tasks.map(task => ({
            updateOne: {
                filter: { _id: task._id },
                update: { $set: { order: task.order, status: task.status } }
            }
        }));

        await Task.bulkWrite(bulkOps);

        if (projectId) {
            try {
                const io = getIO();
                // We emit the whole new list? Or just a signal to refetch?
                // Reordering implies many changes. Sending just "tasks_reordered" signal might be best,
                // and let frontend refetch. Or send the `tasks` array (which has partial data).
                // Frontend usually listens to "tasks_reordered" and updates local state if it matches, 
                // or refetches.
                // Let's emit the updates provided.
                io.to(projectId).emit("tasks_reordered", tasks);
            } catch (error) {
                console.error("Socket emit error:", error);
            }
        }

        res.json({ message: 'Tasks reordered' });
    } catch (error) {
        console.error("Reorder failed", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all tasks for the logged in user across all projects
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignees: req.user._id })
            .populate('project', 'name description') // Populate project details
            .populate('assignees', 'name email avatar')
            .sort({ dueDate: 1 }); // Sort by due date ascending
        res.json(tasks);
    } catch (error) {
        console.error("Failed to fetch user tasks", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createTask,
    getTasksByProject,
    getMyTasks,
    updateTaskStatus: updateTask,
    analyzeTask,
    deleteTask,
    reorderTasks
};
