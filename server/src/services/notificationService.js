const cron = require('node-cron');
const webpush = require('web-push');
const Subscription = require('../models/Subscription');

webpush.setVapidDetails(
    'mailto:aditya@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const sendPush = async (payload) => {
    try {
        const subscriptions = await Subscription.find();
        subscriptions.forEach(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };

            webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                .catch(err => {
                    console.error('Error sending push:', err);
                    if (err.statusCode === 410) {
                        // Subscription expired/invalid
                        Subscription.findOneAndDelete({ endpoint: sub.endpoint }).exec();
                    }
                });
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
    }
};

const initNotifications = () => {
    // Schedule task for 1:30 PM, 5:30 PM, and 11:30 PM daily
    // Cron format: Minute Hour * * *
    const schedules = ['30 13 * * *', '30 17 * * *', '30 23 * * *'];

    schedules.forEach(schedule => {
        cron.schedule(schedule, () => {
            const currentHour = new Date().getHours();
            let timeOfDay = 'now';
            if (currentHour === 13) timeOfDay = 'afternoon';
            if (currentHour === 17) timeOfDay = 'evening';
            if (currentHour === 23) timeOfDay = 'night';

            console.log(`Triggering ${timeOfDay} work log reminder...`);
            
            const payload = {
                title: 'Work Log Reminder',
                body: `It's time to log your progress! (${timeOfDay} check-in)`,
                icon: '/pwa-192x192.png'
            };

            sendPush(payload);
        });
    });

    console.log('Push notifications scheduled for 1:30 PM, 5:30 PM, and 11:30 PM.');
};

module.exports = { initNotifications };
