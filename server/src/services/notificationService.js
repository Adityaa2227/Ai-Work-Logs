const cron = require('node-cron');
const notifier = require('node-notifier');
const path = require('path');

const initNotifications = () => {
    // Schedule task for 11:30 PM (23:30) daily
    cron.schedule('30 23 * * *', () => {
        console.log('Triggering daily work log reminder...');
        
        notifier.notify({
            title: 'Work Log Reminder',
            message: 'It\'s 11:30 PM! Don\'t forget to log your work for today.',
            sound: true, // Only Notification Center or Windows Toasters
            wait: true, // Wait with callback, until user action is taken against notification
            appID: 'Work Log App' 
        },
        (err, response, metadata) => {
            if (err) console.error('Notification error:', err);
        });
    });

    console.log('Daily notification scheduled for 23:30.');
};

module.exports = { initNotifications };
