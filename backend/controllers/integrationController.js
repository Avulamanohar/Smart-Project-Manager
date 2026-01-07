// @desc    Handle Slack Webhook
// @route   POST /api/integrations/slack
// @access  Public (Webhook)
const handleSlackWebhook = async (req, res) => {
    // In a real app, verify signature
    const { event } = req.body;

    if (event && event.type === 'message') {
        console.log('Received Slack Message:', event.text);
        // logic to parse message and create task
    }

    res.status(200).send('OK');
};

const { google } = require('googleapis');
const User = require('../models/User');

const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "/api/auth/google/callback"
    );
};

// @desc    Get Google Calendar Events
// @route   GET /api/integrations/google-calendar/events
// @access  Private
const getGoogleCalendarEvents = async (req, res) => {
    try {
        const user = req.user;

        if (!user.googleAccessToken) {
            return res.status(400).json({ message: 'Google account not connected' });
        }

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken
        });

        // Handle token refresh automatically by googleapis if refresh_token is present
        // But we might want to save the new access token if it changes.
        // The library handles refreshing if refresh_token is set.
        // To persist updated tokens, we can listen to 'tokens' event, but that's complex in a request-response cycle.
        // For now, let's rely on the fact that if we have a refresh token, requests will work.

        // If the token is invalid, we might need to manually refresh and save:
        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                user.googleAccessToken = tokens.access_token;
            }
            if (tokens.refresh_token) {
                user.googleRefreshToken = tokens.refresh_token;
            }
            await user.save();
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;
        res.json(events);

    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        if (error.code === 401) {
            return res.status(401).json({ message: 'Google token expired or invalid' });
        }
        res.status(500).json({ message: 'Failed to fetch Google Calendar events' });
    }
};

// @desc    Sync Google Calendar (Placeholder for manual sync trigger)
// @route   POST /api/integrations/google-calendar
// @access  Private
const syncGoogleCalendar = async (req, res) => {
    // This could trigger a background job
    res.json({ message: 'Calendar sync initiated' });
};

module.exports = { handleSlackWebhook, syncGoogleCalendar, getGoogleCalendarEvents };
