const express = require('express');
const router = express.Router();
const { handleSlackWebhook, syncGoogleCalendar, getGoogleCalendarEvents } = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/slack', handleSlackWebhook);
router.post('/google-calendar', protect, syncGoogleCalendar);
router.get('/google-calendar/events', protect, getGoogleCalendarEvents);

module.exports = router;
