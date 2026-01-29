import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '../context/CompanyContext'; // Using this just for context if needed, or api directly
import api from '../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

const PushNotificationManager = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                setIsSubscribed(true);
            }
        }
    };

    const subscribeUser = async () => {
        if (!VAPID_PUBLIC_KEY) {
            toast.error('VAPID Public Key not found. Cannot subscribe.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            await api.post('/notifications/subscribe', subscription);
            
            setIsSubscribed(true);
            setPermission('granted');
            toast.success('Successfully subscribed to notifications!');
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error('Failed to subscribe to notifications.');
        }
    };

    const handleToggle = async () => {
        if (permission === 'denied') {
            toast.error('Notifications are blocked. Please enable them in your browser settings.');
            return;
        }

        if (isSubscribed) {
            // Unsubscribe logic could be added here, but usually just clearing SW sub is enough
            // For now, we will just focus on subscribing
             toast.info('You are already subscribed.');
        } else {
            await subscribeUser();
        }
    };

    if (!('Notification' in window)) {
        return null; // Push not supported
    }

    return (
        <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-colors ${
                isSubscribed 
                    ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                    : 'bg-surface text-muted hover:text-accent hover:bg-surface/80'
            }`}
            title={isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
        >
            {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
    );
};

export default PushNotificationManager;
