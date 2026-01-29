const Subscription = require('../models/Subscription');

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
