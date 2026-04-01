// pushNotification.js
export const setupNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            // 🎯 ใช้ REACT_APP_ เท่านั้นสำหรับ Create React App
            const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error("❌ ไม่พบ REACT_APP_VAPID_PUBLIC_KEY ใน Env");
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            };

            const subscription = await registration.pushManager.subscribe(subscribeOptions);

            // ส่ง Subscription ไปที่ Backend
            await fetch('/api/vocab/subscribe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ subscription })
            });

            console.log('🚀 ยินดีด้วยคุณ Paweena! ลงทะเบียนแจ้งเตือนสำเร็จแล้ว');
        } catch (error) {
            console.error('❌ พังตรงนี้:', error.message);
        }
    }
};