// pushNotification.js

function urlBase64ToUint8Array(base64String) {
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
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
            };

            const subscription = await registration.pushManager.subscribe(subscribeOptions);

            // await fetch('http://localhost:5000/api/vocab/subscribe', {
            await fetch('/api/vocab/subscribe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ subscription })
            });

            console.log('🚀 ลงทะเบียนแจ้งเตือนจริงสำเร็จแล้ว!');
        } catch (error) {
            console.error('❌ ไม่สามารถลงทะเบียนแจ้งเตือนได้:', error);
        }
    }
};