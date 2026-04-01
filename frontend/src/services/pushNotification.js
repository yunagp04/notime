// pushNotification.js

function urlBase64ToUint8Array(base64String) {
    if (!base64String) {
        throw new Error("VAPID public key is missing or empty.");
    }
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const setupNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const vapidPublicKey = import.meta.env?.VITE_VAPID_PUBLIC_KEY || process.env.REACT_APP_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error("❌ ไม่พบ VAPID Public Key ใน Environment Variables");
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            };

            const subscription = await registration.pushManager.subscribe(subscribeOptions);

            const response = await fetch('/api/vocab/subscribe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ subscription })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            console.log('🚀 ลงทะเบียนแจ้งเตือนจริงสำเร็จและข้อมูลลง DB แล้ว!');
        } catch (error) {
            console.error('❌ ไม่สามารถลงทะเบียนแจ้งเตือนได้:', error.message);
        }
    }
};