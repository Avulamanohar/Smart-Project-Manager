const Project = require('../models/Project');
const axios = require('axios');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    const { name, description, deadline, members } = req.body;

    const project = await Project.create({
        name,
        description,
        deadline,
        members,
        owner: req.user._id,
    });

    res.status(201).json(project);
};

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    // Find projects where user is owner OR member
    const projects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).populate('owner', 'name email avatar').populate('members', 'name email avatar');

    res.json(projects);
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

const Task = require('../models/Task');

// @desc    Get dashboard statistics
// @route   GET /api/projects/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Total Projects
        const totalProjects = await Project.countDocuments({
            $or: [{ owner: userId }, { members: userId }]
        });

        // Find all projects associated with the user to scope the tasks
        const userProjectsList = await Project.find({
            $or: [{ owner: userId }, { members: userId }]
        }).select('_id');

        const projectIds = userProjectsList.map(p => p._id);

        // 2. Active Tasks (all tasks in user's projects that are not done)
        // This gives a better overview of project workload than just assigned tasks
        const activeTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: { $ne: 'done' }
        });

        // 3. Completed Tasks (all tasks in user's projects that are done)
        const completedTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: 'done'
        });

        // 4. Team Members (unique members across all user's projects)
        // Find all projects user is in
        const userProjects = await Project.find({
            $or: [{ owner: userId }, { members: userId }]
        }).select('members owner');

        const uniqueMembers = new Set();
        userProjects.forEach(p => {
            uniqueMembers.add(p.owner.toString());
            p.members.forEach(m => uniqueMembers.add(m.toString()));
        });

        // Subtract self from team count if desired, but "Team Members" usually implies size including/excluding self.
        // We will include the user to show total team size involved.
        /* if (uniqueMembers.has(userId.toString())) {
            uniqueMembers.delete(userId.toString());
        } */

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

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
const addProjectMember = async (req, res) => {
    const { email } = req.body;
    const projectId = req.params.id;

    try {
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to add members' });
        }

        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already a member
        if (project.members.includes(userToAdd._id)) {
            return res.status(400).json({ message: 'User already a member' });
        }

        // Check if user is the owner (cannot add owner as member)
        if (project.owner.toString() === userToAdd._id.toString()) {
            return res.status(400).json({ message: 'User is the owner of this project' });
        }

        project.members.push(userToAdd._id);
        await project.save();

        const updatedProject = await Project.findById(projectId)
            .populate('owner', 'name email')
            .populate('members', 'name email avatar');

        // Emit event to new member to update their dashboard immediately if they are online
        // We know we can emit to specific rooms or globally. 
        // For real-time dashboard updates, the user might be listening on their own unique ID room or we just emit a generic event?
        // Ideally we emit to the user's personal room, but we don't have user-specific rooms set up in the provided socket.js snippet.
        // However, we can emit to the project room for anyone currently viewing the project.
        try {
            const io = getIO();
            io.to(projectId).emit("project_updated", updatedProject);
        } catch (error) {
            console.error("Socket emit error:", error);
        }

        res.json(updatedProject);
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
            file_content: fileContent
        };

        const aiResponse = await axios.post('http://127.0.0.1:5001/api/chat', aiPayload);
        const { task_data, reply, status, intent, message: errorMessage } = aiResponse.data;

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

        // Handle Task Intent
        // Support batch tasks
        const tasksToCreate = task_data.tasks || (task_data.name ? [task_data] : []);

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
        }

        const finalProject = await Project.findById(targetProjectId);

        res.json({
            reply: `Successfully created ${createdTasks.length} task(s) in ${finalProject ? finalProject.name : 'project'}.`,
            task: createdTasks[0], // Return first task for UI reference
            projectId: targetProjectId,
            intent: 'task'
        });

    } catch (error) {
        console.error("AI Command Error:", error);
        res.status(500).json({
            reply: `I encountered an error: ${error.message}`,
            intent: 'chat'
        });
    }
};

module.exports = { createProject, getProjects, getProjectById, getDashboardStats, addProjectMember, handleAICommand };
