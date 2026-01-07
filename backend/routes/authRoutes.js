const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/users', protect, getAllUsers);

const passport = require('passport');
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};
// Needed for callback to use generateToken functionality if not exported from controller
// Actually controller has logic. Let's redirect logic into controller or inline here.
// Inline for simplicity with passport callback.
const jwt = require('jsonwebtoken');

// Request offline access to get a Refresh Token
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
    accessType: 'offline',
    prompt: 'consent', // Forces consent screen to ensure we get a refresh token
    session: false
}));

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
        session: false
    }),
    (req, res) => {
        // Successful authentication, redirect home.
        const token = generateToken(req.user._id);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/login?token=${token}`);
    }
);

module.exports = router;
