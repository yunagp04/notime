// src/pages/Settings.jsx
import React from 'react';
import { setupNotifications } from '../services/pushNotification'; // ✅ Import จากไฟล์ที่โบรสร้างไว้

function Settings() {
    const handleEnableNotif = async () => {
        setIsSubscribing(true);
        await setupNotifications();
        setIsSubscribing(false);
    };

    

    return (
        <div style={{ padding: '20px' }}>
            <h2>การตั้งค่าการแจ้งเตือน</h2>
            <p>รับการแจ้งเตือนเมื่อถึงเวลาทบทวนคำศัพท์ของคุณ</p>
            
            <button 
                onClick={handleEnableNotif} 
                disabled={isSubscribing}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#4A90E2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                {isSubscribing ? 'กำลังตั้งค่า...' : '🔔 เปิดการแจ้งเตือน'}
            </button>
        </div>
    );
}

export default Settings;