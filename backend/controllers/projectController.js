const Project = require('../models/Project');
const Task = require('../models/Task');
const axios = require('axios');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    const { name, description, deadline, members, status } = req.body;

    const project = await Project.create({
        name,
        description,
        deadline,
        members,
        status: status || 'active',
        owner: req.body.owner || req.user._id,
    });

    const populatedProject = await Project.findById(project._id)
        .populate('owner', 'name email')
        .populate('members', 'name email avatar');

    // Global Broadast for Dashboard
    try {
        const io = getIO();
        io.emit("project_created", { ...populatedProject.toObject(), progress: 0, totalTasks: 0, completedTasks: 0 });
    } catch (e) {
        console.error("Socket emit error", e);
    }

    res.status(201).json(project);
};

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    // Get ALL projects (Public Workspace Mode)
    console.log("Fetching ALL projects (Public Workspace Mode)");
    const projects = await Project.find({})
        .sort({ updatedAt: -1 })
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar');

    // Calculate progress for each project
    const projectsWithProgress = await Promise.all(projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const completedTasks = await Task.countDocuments({ project: project._id, status: 'done' });
        const inProgressTasks = await Task.countDocuments({ project: project._id, status: 'in_progress' });

        // Calculate progress: Done = 100%, In_Progress = 50%
        const weightedProgress = completedTasks + (inProgressTasks * 0.5);
        const progress = totalTasks === 0 ? 0 : Math.round((weightedProgress / totalTasks) * 100);

        console.log(`Project: ${project.name} (${project._id})`);
        console.log(`Total: ${totalTasks}, Done: ${completedTasks}, InProgress: ${inProgressTasks}`);
        console.log(`Weighted: ${weightedProgress}, Progress: ${progress}%`);

        // Self-Healing: If progress < 100% and status is "completed", it should be "active".
        // We DO NOT force strict "100% = completed" here to allow manual reopening of projects.
        // But we DO enforce "Not 100% = Not Completed".
        let status = project.status;
        let corrected = false;

        if (totalTasks > 0) {
            // Only auto-revert to active if tasks are undone.
            // WE DO NOT AUTO-COMPLETE. User must click "Complete".
            if (progress < 100 && status === 'completed') {
                status = 'active';
                corrected = true;
            }
        }

        if (corrected) {
            // Update the DB asynchronously without blocking response
            Project.findByIdAndUpdate(project._id, { status }).catch(err => console.error("Self-healing update error:", err));
        }

        return {
            ...project.toObject(),
            status, // Return corrected status immediately
            progress,
            totalTasks,
            completedTasks,
            inProgressTasks
        };
    }));

    res.json(projectsWithProgress);
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
    try {
        const { name, description, deadline, status } = req.body;
        console.log(`Updating project ${req.params.id} with status: ${status}`);

        const project = await Project.findById(req.params.id);

        if (project) {
            // PUBLIC WORKSPACE: Auth check removed
            /*if (project.owner.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }*/

            const updatedDoc = await Project.findByIdAndUpdate(
                req.params.id,
                {
                    $set: {
                        ...(name && { name }),
                        ...(description && { description }),
                        ...(deadline && { deadline }),
                        ...(status && { status })
                    }
                },
                { new: true, runValidators: true }
            );

            const populated = await Project.findById(updatedDoc._id)
                .populate('owner', 'name email')
                .populate('members', 'name email avatar');

            const totalTasks = await Task.countDocuments({ project: populated._id });
            const completedTasks = await Task.countDocuments({ project: populated._id, status: 'done' });
            const inProgressTasks = await Task.countDocuments({ project: populated._id, status: 'in_progress' });

            const weightedProgress = completedTasks + (inProgressTasks * 0.5);
            const progress = totalTasks === 0 ? 0 : Math.round((weightedProgress / totalTasks) * 100);

            const finalProjectData = {
                ...populated.toObject(),
                progress,
                totalTasks,
                completedTasks,
                inProgressTasks
            };

            // Broadcast Update Globally
            try {
                const io = getIO();
                io.emit("project_updated", finalProjectData);
            } catch (e) {
                console.error("Socket emit error", e);
            }

            res.json(finalProjectData);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        console.error("Update Project Error:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate('owner', 'name email')
        .populate('members', 'name email avatar');

    if (project) {
        res.json(project);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
};

// Removed duplicate Task import from here


// @desc    Get dashboard statistics
// @route   GET /api/projects/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        // PUBLIC WORKSPACE MODE: Stats are global
        // 1. Total Projects (Global)
        const totalProjects = await Project.countDocuments({});

        // 2. Active Tasks (Global)
        const activeTasks = await Task.countDocuments({
            status: { $ne: 'done' }
        });

        // 3. Completed Tasks (Global)
        const completedTasks = await Task.countDocuments({
            status: 'done'
        });

        // 4. Team Members (Global unique users involved in projects)
        const allProjects = await Project.find({}).select('members owner');
        const uniqueMembers = new Set();
        allProjects.forEach(p => {
            if (p.owner) uniqueMembers.add(p.owner.toString());
            p.members.forEach(m => uniqueMembers.add(m.toString()));
        });

        res.json({
            totalProjects,
            activeTasks,
            completedTasks,
            teamMembers: uniqueMembers.size
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const User = require('../models/User');
const { getIO } = require('../socket');

// @desc    Add member(s) to project
// @route   POST /api/projects/:id/members
// @access  Private
const addProjectMember = async (req, res) => {
    const { email, memberIds } = req.body; // memberIds: array of user IDs
    const projectId = req.params.id;

    try {
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // PUBLIC WORKSPACE: Auth check removed
        /* if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to add members' });
        } */

        let usersToAddIds = [];

        // Scenario 1: Bulk add by IDs
        if (memberIds && Array.isArray(memberIds)) {
            // Validate users exist
            const validUsers = await User.find({ _id: { $in: memberIds } });
            usersToAddIds = validUsers.map(u => u._id.toString());
        }
        // Scenario 2: Single add by Email (Legacy support)
        else if (email) {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            usersToAddIds.push(user._id.toString());
        } else {
            return res.status(400).json({ message: 'Please provide memberIds array or email' });
        }

        let addedCount = 0;
        for (const userId of usersToAddIds) {
            // Check if user exists (if passed by ID)
            // We can skip this database check if we trust the IDs or want speed, but safer to check if using raw IDs
            // However, for bulk ops, let's assume IDs are valid or filter duplicates.

            // Check if already a member
            if (project.members.includes(userId)) {
                continue;
            }
            // Check if owner
            if (project.owner.toString() === userId.toString()) {
                continue;
            }

            project.members.push(userId);
            addedCount++;
        }

        if (addedCount > 0) {
            await project.save();
        }

        const updatedProject = await Project.findById(projectId)
            .populate('owner', 'name email')
            .populate('members', 'name email avatar');

        // Global Broadcast
        try {
            const io = getIO();
            io.emit("project_updated", updatedProject);
        } catch (e) {
            console.error("Socket emit error", e);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // PUBLIC WORKSPACE: Auth check removed
        /* if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        } */

        // Delete all tasks associated with the project
        await Task.deleteMany({ project: req.params.id });

        await project.deleteOne();

        // Broadcast deletion globally
        try {
            const io = getIO();
            io.emit("project_deleted", req.params.id);
        } catch (e) {
            console.error("Socket emit error", e);
        }

        res.json({ message: 'Project removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Handle AI Command (with File Support)
// @route   POST /api/projects/ai/command
// @access  Private
const handleAICommand = async (req, res) => {
    // Multer middleware puts file in req.file, fields in req.body
    const { message, projectId } = req.body;
    const history = req.body.history ? JSON.parse(req.body.history) : [];
    const file = req.file;
    const userId = req.user._id;

    if (!message && !file) {
        return res.status(400).json({ message: 'Message or file is required' });
    }

    try {
        let fileContent = "";

        // Extract text from file if present
        if (file) {
            console.log(`Processing file: ${file.originalname}, type: ${file.mimetype}, size: ${file.size}`);
            if (file.mimetype === 'application/pdf') {
                try {
                    // Use legacy build for Node.js environment to avoid DOMMatrix/canvas errors
                    // Dynamic import is needed because it is an .mjs file (ESM)
                    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

                    // Convert Buffer to Uint8Array
                    const uint8Array = new Uint8Array(file.buffer);

                    const loadingTask = pdfjsLib.getDocument({
                        data: uint8Array,
                        useSystemFonts: true,
                        disableFontFace: true
                    });

                    const doc = await loadingTask.promise;
                    let fullText = "";

                    for (let i = 1; i <= doc.numPages; i++) {
                        const page = await doc.getPage(i);
                        const textContent = await page.getTextContent();

                        // Join text items with space
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + "\n";
                    }

                    fileContent = fullText;
                    console.log(`PDF parsed successfully with pdfjs-dist. Text length: ${fileContent.length}`);

                } catch (pdfErr) {
                    console.error("PDF Parse Error:", pdfErr);
                    throw new Error("Failed to read PDF file. It might be corrupted or password protected.");
                }
            } else if (file.mimetype === 'text/plain' || file.mimetype === 'application/json' || file.mimetype === 'text/markdown') {
                fileContent = file.buffer.toString('utf8');
            } else {
                console.log("Unsupported file type:", file.mimetype);
                throw new Error("Unsupported file type. Please upload PDF, Text, Markdown, or JSON.");
            }
        }

        // 1. Call AI Service
        const aiPayload = {
            message: message || "Analyze the attached file.",
            file_content: fileContent,
            history: history // Pass history to AI
        };

        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
        const aiResponse = await axios.post(`${aiServiceUrl}/api/chat`, aiPayload);
        const { task_data, project_data, reply, status, intent, message: errorMessage } = aiResponse.data;

        if (status === 'error') {
            return res.status(500).json({ reply: `AI Error: ${errorMessage}`, intent: 'chat' });
        }

        // Handle Chat Intent
        if (intent === 'chat') {
            return res.json({
                reply: reply,
                intent: 'chat'
            });
        }

        // Handle Project Intent
        if (intent === 'project' && project_data) {
            const newProject = await Project.create({
                name: project_data.name || "AI Created Project",
                description: project_data.description || "Created by AI Assistant",
                deadline: project_data.deadline ? new Date(project_data.deadline) : undefined,
                members: [], // Initially empty or could add user
                status: 'active',
                owner: userId,
            });

            // Broadcast
            try {
                const io = getIO();
                io.emit("project_created", { ...newProject.toObject(), progress: 0, totalTasks: 0, completedTasks: 0 });
            } catch (e) {
                console.error("Socket emit error", e);
            }

            return res.json({
                reply: `I've created the project "${newProject.name}" for you!`,
                project: newProject,
                intent: 'project'
            });
        }

        // Handle Task Intent
        // Support batch tasks
        const tasksToCreate = task_data?.tasks || (task_data?.name ? [task_data] : []) || [];

        if (tasksToCreate.length === 0) {
            return res.json({ reply: "I understood the task intent, but couldn't verify the details. Please try again with more specifics.", intent: 'chat' });
        }

        // 2. Determine Project (Global or Per-Task)
        // We will try to find a project for the FIRST task and apply to all if not specified, 
        // OR handle per-task project if complex. For simplicity, we use one target project for the batch.

        let targetProjectId = projectId;
        if (targetProjectId === 'null' || targetProjectId === 'undefined') targetProjectId = null;

        // Try to infer project from the first task if not set
        if (!targetProjectId && tasksToCreate[0].project_name) {
            const pName = tasksToCreate[0].project_name;
            const projects = await Project.find({
                $or: [{ owner: userId }, { members: userId }]
            });
            const match = projects.find(p => p.name.toLowerCase().includes(pName.toLowerCase()));
            if (match) {
                targetProjectId = match._id;
            }
        }

        if (!targetProjectId) {
            return res.json({ reply: "I can create the tasks, but I need to know which project to add them to. Please mention the project name or navigate to a project board.", intent: 'chat' });
        }

        // 3. Create Tasks (Batch)
        const createdTasks = [];

        for (const taskDetails of tasksToCreate) {
            const newTask = await Task.create({
                title: taskDetails.name,
                description: taskDetails.description || '',
                project: targetProjectId,
                priority: (taskDetails.priority && ['low', 'medium', 'high', 'urgent'].includes(taskDetails.priority.toLowerCase())) ? taskDetails.priority.toLowerCase() : 'medium',
                deadline: taskDetails.deadline ? new Date(taskDetails.deadline) : undefined,
                status: 'todo',
                assignees: []
            });
            createdTasks.push(newTask);

            // Broadcast Task Creation
            try {
                const io = getIO();
                io.emit("task_created", { ...newTask.toObject(), assigneeDetails: [] });
            } catch (e) { console.error(e) }
        }

        const finalProject = await Project.findById(targetProjectId);

        res.json({
            reply: `Successfully created ${createdTasks.length} task(s) in ${finalProject ? finalProject.name : 'project'}.`,
            task: createdTasks[0], // Return first task for UI reference
            projectId: targetProjectId,
            intent: 'task'
        });

    } catch (error) {
        console.error("AI Command Error:", error.message);
        if (error.response) {
            console.error("AI Service Response Data:", error.response.data);
            return res.status(error.response.status).json({
                reply: `AI Service Error: ${error.response.data.message || error.response.data.reply || error.response.statusText}`,
                intent: 'chat'
            });
        }
        res.status(500).json({
            reply: `I encountered an error: ${error.message}`,
            intent: 'chat'
        });
    }
};

module.exports = { createProject, getProjects, getProjectById, getDashboardStats, addProjectMember, handleAICommand, updateProject, deleteProject };
