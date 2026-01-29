const Subscription = require('../models/Subscription');
const webpush = require('web-push');

// @desc    Get VAPID Public Key
// @route   GET /api/notifications/vapid-public-key
// @access  Public (or Protected)
exports.getVapidPublicKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
// @access  Private
exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        
        // Remove existing subscription with same endpoint to prevent duplicates
        await Subscription.findOneAndDelete({ endpoint: subscription.endpoint });

        const newSubscription = new Subscription({
            user: req.user._id,
            endpoint: subscription.endpoint,
            keys: subscription.keys
        });

        await newSubscription.save();
        res.status(201).json({ message: 'Subscribed to notifications' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
};

// @desc    Send a test notification to the current user
// @route   POST /api/notifications/test
// @access  Private
exports.sendTestNotification = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ user: req.user._id });
        
        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'No subscriptions found for this user.' });
        }

        const payload = {
            title: 'Test Notification 🔔',
            body: 'This is a test notification from WorkLog AI! If you see this, it works.',
            icon: '/pwa-192x192.png'
        };

        const promises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };
            return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                .catch(err => {
                    console.error(`Error sending to subscription ${sub.endpoint}:`, err);
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        // Optimistically delete expired subscriptions
                        return Subscription.findByIdAndDelete(sub._id);
                    }
                });
        });

        await Promise.all(promises);
        
        res.json({ message: `Sent test notification to ${subscriptions.length} device(s).` });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ message: 'Failed to send test notification' });
    }
};
