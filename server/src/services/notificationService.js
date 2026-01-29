const cron = require('node-cron');
const notifier = require('node-notifier');
const path = require('path');

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
            
            notifier.notify({
                title: 'Work Log Reminder',
                message: `It's time to log your progress! (${timeOfDay} check-in)`,
                sound: true,
                wait: true,
                appID: 'Work Log App' 
            },
            (err, response, metadata) => {
                if (err) console.error('Notification error:', err);
            });
        });
    });

    console.log('Daily notifications scheduled for 1:30 PM, 5:30 PM, and 11:30 PM.');
};

module.exports = { initNotifications };
