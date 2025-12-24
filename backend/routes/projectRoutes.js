const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createProject, getProjects, getProjectById, getDashboardStats, addProjectMember, handleAICommand } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

const uploadMiddleware = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error("Multer Error:", err);
            return res.status(400).json({
                reply: `File upload error: ${err.message}`,
                intent: 'chat'
            });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error("Unknown Upload Error:", err);
            return res.status(500).json({
                reply: `Upload error: ${err.message}`,
                intent: 'chat'
            });
        }
        // Everything went fine.
        next();
    });
};

router.post('/ai/command', protect, uploadMiddleware, handleAICommand);

router.get('/stats', protect, getDashboardStats);

router.route('/:id')
    .get(protect, getProjectById);

router.post('/:id/members', protect, addProjectMember);

module.exports = router;
