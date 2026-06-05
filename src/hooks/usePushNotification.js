import { useState, useEffect, useCallback } from 'react';
import { customAPI } from '../api/customClient';

// Helper function to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const swSupported = 'serviceWorker' in navigator;
      const pushSupported = 'PushManager' in window;
      const notificationSupported = 'Notification' in window;
      
      const supported = swSupported && pushSupported && notificationSupported;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        
        try {
          // Check if there is an active subscription already
          const registration = await navigator.serviceWorker.ready;
          const activeSub = await registration.pushManager.getSubscription();
          
          setSubscription(activeSub);
          setIsSubscribed(!!activeSub);
        } catch (error) {
          console.error('Error checking active push subscription:', error);
        }
      }
      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Subscribe user to Push Notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push Notifications are not supported in this browser.');
    }

    setIsLoading(true);
    try {
      // 1. Check/Ask for permission (UX-friendly: only requested when user clicks a button)
      let currentPermission = Notification.permission;
      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      }

      if (currentPermission !== 'granted') {
        throw new Error('Quyền thông báo không được cấp.');
      }

      // 2. Register/Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // 3. Get VAPID public key from backend
      const { publicKey } = await customAPI.request('/notifications/vapid-key', {
        method: 'GET'
      });

      if (!publicKey) {
        throw new Error('VAPID public key was not returned by backend.');
      }

      // 4. Subscribe with PushManager
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // 5. Send subscription info to backend
      await customAPI.request('/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify(newSubscription)
      });

      setSubscription(newSubscription);
      setIsSubscribed(true);
      setIsLoading(false);
      return newSubscription;
    } catch (error) {
      console.error('Error during Push Notification subscription:', error);
      setIsLoading(false);
      throw error;
    }
  }, [isSupported]);

  // Unsubscribe user
  const unsubscribe = useCallback(async () => {
    if (!isSubscribed || !subscription) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Notify backend to remove subscription
      await customAPI.request('/notifications/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      // 2. Unsubscribe on browser PushManager
      await subscription.unsubscribe();

      setSubscription(null);
      setIsSubscribed(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error during Push Notification unsubscription:', error);
      setIsLoading(false);
      throw error;
    }
  }, [isSubscribed, subscription]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) {
      throw new Error('Vui lòng bật thông báo trước khi gửi thử.');
    }

    try {
      const result = await customAPI.request('/notifications/test', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          title: 'Chào bạn từ Music Space! 🎵',
          body: 'Đây là thông báo thử nghiệm chạy trên PWA của bạn.',
          url: '/Love' // Open events page when clicked
        })
      });
      return result;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }, [isSubscribed, subscription]);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
}
