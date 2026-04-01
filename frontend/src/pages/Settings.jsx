// src/pages/Settings.jsx
// frontend/src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { Bell, Globe, Save, ShieldCheck } from 'lucide-react';
import { setupNotifications } from '../services/pushNotification';

const Settings = () => {
  const [isNotifEnabled, setIsNotifEnabled] = useState(false);
  const [targetLang, setTargetLang] = useState('th');
  const [notiMode, setNotiMode] = useState('all');

  const handleSaveSettings = async () => {
    // 🎯 ส่งค่า mode, targetLang ไปบันทึกที่ /api/vocab/settings/notifications
    try {
        const res = await fetch('/api/vocab/settings/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ mode: notiMode, targetLang: targetLang, maxItems: 10 })
        });
        if (res.ok) alert("Settings saved successfully! 🚀");
        alert("บันทึกการตั้งค่าสำเร็จ!");
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Settings ⚙️</h1>

      {/* Notification Section */}
      <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 text-xl font-bold text-slate-800">
          <Bell className="text-indigo-600" /> Notifications
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
          <div>
            <p className="font-bold text-slate-700">Push Notifications</p>
            <p className="text-sm text-slate-500">รับแจ้งเตือนเมื่อถึงเวลาทบทวน</p>
          </div>
          <button 
            onClick={setupNotifications} 
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
          >
            Enable
          </button>
        </div>
      </section>

      {/* Language Section */}
      <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 text-xl font-bold text-slate-800">
          <Globe className="text-emerald-600" /> Language Preferences
        </div>
        <div className="space-y-4">
          <label className="block font-bold text-slate-700">Target Translation Language</label>
          <select 
            value={targetLang} 
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="th">Thai (ภาษาไทย)</option>
            <option value="jp">Japanese (日本語)</option>
            <option value="cn">Chinese (中文)</option>
          </select>
        </div>
      </section>

      <button 
        onClick={handleSaveSettings}
        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all"
      >
        <Save size={24} /> Save All Changes
      </button>
    </div>
  );
};

export default Settings;