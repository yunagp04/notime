// src/pages/Settings.jsx
// frontend/src/pages/Settings.tsx
import React, { useState } from 'react';
import { Bell, Globe, Save } from 'lucide-react';
import { setupNotifications } from '../services/pushNotification';

const Settings = () => {
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
        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl">
        <label className="block font-bold text-slate-700">Notification Mode</label>
        <select 
            value={notiMode} 
            onChange={(e) => setNotiMode(e.target.value)} // 🎯 เรียกใช้ setNotiMode ตรงนี้ หายแดงแน่นอน!
            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
        >
            <option value="all">All Words (ทบทวนทั้งหมด)</option>
            <option value="random">Random (สุ่มคำศัพท์)</option>
            <option value="list">By List (ตามลิสต์ที่เลือก)</option>
        </select>
        <p className="text-xs text-slate-400">เลือกรูปแบบการส่งคำศัพท์ไปแจ้งเตือนในแต่ละรอบ</p>
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