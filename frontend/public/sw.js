// public/sw.js
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : { title: 'ได้เวลาแล้ว!', body: 'มาทบทวนศัพท์กันเถอะ' };
    
    const options = {
        body: data.body,
        icon: '/logo192.png',
        badge: '/badge.png',
        vibrate: [100, 50, 100],
        data: {
            url: 'http://localhost:3000/practice' // คลิกแล้วให้เปิดไปหน้านี้
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// เมื่อ User คลิกที่การแจ้งเตือน
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});