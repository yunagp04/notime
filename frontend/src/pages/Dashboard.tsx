//frontend/src/pages/Dashboard.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Sparkles, Check, History, Loader2, ChevronRight } from 'lucide-react';
import { getDashboardStats, getDueVocabs } from '../services/vocabApi';

const Dashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, learned: 0, dueToday: 0 });
    const [dueVocabs, setDueVocabs] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);

    // Load dashboard statistics and pending reviews
    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [dashRes, dueRes] = await Promise.all([
                getDashboardStats(),
                getDueVocabs()
            ]);

            console.log("📥 Due Vocabs From API:", dueRes);

            const actualItems = Array.isArray(dueRes) ? dueRes : (dueRes.items || []);
            setDueVocabs(actualItems);
            // const actualItems = dueRes.items || [];
            // setDueVocabs(actualItems);

            if (dashRes && dashRes.summary) {
                const s = dashRes.summary;
                setStats({
                    // ✅ แก้เป็นตัวใหญ่ตามที่ SQL คืนค่ามาครับ
                    total: s.Total || 0,
                    dueToday: actualItems.length || 0, // หรือใช้ s.New ถ้าอยากนับแค่คำใหม่
                    learned: s.Mastered || 0 
              });
            }

            if (dashRes && dashRes.history) {
                setActivities(dashRes.history);
            }
        } catch (err) {
            console.error("Dashboard data fetch failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <p className="text-slate-500 font-bold animate-pulse">Loading dashboard data...</p>
            </div>
        );
    }

    return (
      <div className="p-6 space-y-10 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back! 👋</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">You have some vocabulary to manage today.</p>
          </div>
          <button
            onClick={() => navigate("/review")}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95"
          >
            <Sparkles size={20} /> Start Daily Review ({stats.dueToday})
          </button>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Words" value={stats.total} icon={BookOpen} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard title="Due Today" value={stats.dueToday} icon={Sparkles} color="text-orange-600" bgColor="bg-orange-50" isHighlight />
          <StatCard title="Mastered" value={stats.learned} icon={Check} color="text-emerald-600" bgColor="bg-emerald-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Pending Reviews Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Clock className="text-orange-500" size={28} /> Urgent Reviews ({dueVocabs.length})
            </h2>
            <div className="space-y-4">
              {dueVocabs.length > 0 ? (
                dueVocabs.slice(0, 5).map((v: any) => (
                  <div
                    key={v.id}
                    onClick={() => navigate('/review')}
                    className="bg-white p-6 rounded-[24px] border border-slate-100 flex justify-between items-center group hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div>
                      <div className="text-xl font-bold text-slate-800 group-hover:text-indigo-600">
                        {v.title || v.Word || "Unknown Word"}
                      </div>
                      <div className="text-slate-400 text-sm font-medium">
                        {v.content || v.Definition || v.meaning || 'Click to start review'}
                      </div>
                    </div>
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-slate-400">
                  <Check size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg">All caught up for today! 🎉</p>
                </div>
              )}
            </div>
          </section>

          {/* Review History Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <History className="text-indigo-500" size={28} /> Review History
            </h2>
            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {activities && activities.length > 0 ? (
                    activities.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 font-bold text-slate-700">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="p-6 font-bold text-right text-indigo-600">
                          Reviewed {item.count} words
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="p-10 text-center text-slate-400 font-bold">No recent history found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    );
};

// Reusable card component for metrics
const StatCard = ({ title, value, icon: Icon, color, bgColor, isHighlight = false }: any) => (
  <div className={`${isHighlight ? 'bg-indigo-600 text-white border-transparent shadow-xl shadow-indigo-100' : 'bg-white text-slate-900 border-slate-100 shadow-sm'} p-8 rounded-[32px] border transition-all hover:scale-[1.02]`}>
    <div className={`${isHighlight ? 'bg-white/20 text-white' : `${bgColor} ${color}`} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
      <Icon size={28} />
    </div>
    <div className={`text-5xl font-black mb-1`}>{value}</div>
    <div className={`font-bold uppercase tracking-wider text-sm ${isHighlight ? 'opacity-80' : 'text-slate-400'}`}>{title}</div>
  </div>
);

export default Dashboard;

// import React, { useEffect, useState, useCallback } from 'react';
// import { useNavigate } from "react-router-dom";
// import { BookOpen, Clock, Sparkles, Check, History, Loader2, ChevronRight } from 'lucide-react';
// // 🚩 อย่าลืมเช็คชื่อฟังก์ชัน API ของโบรนะ
// import { getDashboardStats, getDueVocabs } from '../services/vocabApi'; 
// import { ChevronRight as ChevronRightIcon } from 'lucide-react';

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(true);
//   const [stats, setStats] = useState({ total: 0, learned: 0, dueToday: 0 });
//   const [dueVocabs, setDueVocabs] = useState<any[]>([]);

//   const [activities, setActivities] = useState<any[]>([]); // ประวัติการทบทวน
//   // 🚩 รวมฟังก์ชันโหลดข้อมูลไว้ในนี้
//   const loadDashboardData = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const [dashRes, dueRes] = await Promise.all([
//         getDashboardStats(), 
//         getDueVocabs()      
//       ]);
      
//       // 🚩 จุดที่ 2: ดึงรายการคำศัพท์
//       const actualItems = dueRes.items || [];
//       setDueVocabs(actualItems);

//       // 🚩 จุดที่ 1: แก้ชื่อ Property ให้ตรงกับ SQL (ตัวใหญ่ตามหน้า Repo)
//       if (dashRes && dashRes.summary) {
//         const s = dashRes.summary;
//         setStats({
//           total: s.Total || 0,     // 👈 เปลี่ยนเป็น Total (T ตัวใหญ่)
//           dueToday: actualItems.length || 0,    // 👈 เปลี่ยนเป็น New (N ตัวใหญ่)
//           learned: s.Mastered || 0 // 👈 เปลี่ยนเป็น Mastered (M ตัวใหญ่)
//         });
//       }
      

//       if (dashRes && dashRes.history) {
//         setActivities(dashRes.history);
//       }
//     } catch (err) {
//       console.error("โหลดแดชบอร์ดพลาดโบร:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadDashboardData();
//   }, [loadDashboardData]);

//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-32 space-y-4">
//         <Loader2 className="animate-spin text-indigo-600" size={48} />
//         <p className="text-slate-500 font-bold animate-pulse">กำลังเตรียมข้อมูลให้โบร... 🚀</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-10 max-w-7xl mx-auto">
//       {/* Header Section */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tight">ยินดีต้อนรับกลับครับโบร! 👋</h1>
//           <p className="text-slate-500 mt-2 text-lg font-medium">วันนี้มีคำศัพท์ที่ต้องจัดการนิดหน่อยนะ</p>
//         </div>
//         <button
//           onClick={() => navigate("/review")} 
//           className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95"
//         >
//           <Sparkles size={20} /> เริ่มทบทวนวันนี้ ({stats.dueToday})
//         </button>
//       </div>

//       {/* 📊 Stats Cards Area */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <StatCard title="Total Words" value={stats.total} icon={BookOpen} color="text-blue-600" bgColor="bg-blue-50" />
//         <StatCard title="Due Today" value={stats.dueToday} icon={Sparkles} color="text-orange-600" bgColor="bg-orange-50" isHighlight />
//         <StatCard title="Mastery" value={stats.learned} icon={Check} color="text-emerald-600" bgColor="bg-emerald-50" />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
//         {/* 🎯 ฝั่งซ้าย: คำที่ต้องทบทวนวันนี้ */}
//         <section className="space-y-6">
//           <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
//             <Clock className="text-orange-500" size={28} /> ต้องทบทวนด่วน! ({dueVocabs.length})
//           </h2>
//           <div className="space-y-4">
//             {dueVocabs.length > 0 ? (
//               // 🚩 ใช้ v: any และดึงจากไอเทมจริงที่โหลดมาได้
//               dueVocabs.slice(0, 5).map((v: any) => ( 
//                 <div 
//                   key={v.id} 
//                   onClick={() => navigate('/review')} // 🚩 กดที่แถบก็ไปหน้าทบทวนได้เลย
//                   className="bg-white p-6 rounded-[24px] border border-slate-100 flex justify-between items-center group hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
//                 >
//                   <div>
//                     {/* 🚩 เช็คชื่อ Field ให้ครอบคลุม word หรือ Word */}
//                     <div className="text-xl font-bold text-slate-800 group-hover:text-indigo-600">
//                       {v.title || v.Word || "Unknown Word"}
//                     </div>
//                     {/* 🚩 เช็คชื่อ Field ความหมาย */}
//                     <div className="text-slate-400 text-sm font-medium">
//                       {v.content || v.Definition || v.meaning || 'คลิกเพื่อเข้าหน้าทบทวน'}
//                     </div>
//                   </div>
                  
//                   <button 
//                     className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"
//                   >
//                     <ChevronRight size={20} />
//                   </button>
//                 </div>
//               ))
//             ) : (
//               <div className="p-16 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-slate-400">
//                 <Check size={48} className="mx-auto mb-4 opacity-20" />
//                 <p className="font-bold text-lg">วันนี้ทบทวนครบแล้ว เยี่ยมมากโบร! 🎉</p>
//               </div>
//             )}
//           </div>
//         </section>

//         {/* 📜 ฝั่งขวา: ประวัติการทบทวน (เหมือนเดิมแต่เช็คตัวแปรให้ชัวร์) */}
//         <section className="space-y-6">
//           <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
//             <History className="text-indigo-500" size={28} /> ประวัติการทบทวน
//           </h2>
//           <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
//             <table className="w-full text-left">
//               <tbody className="divide-y divide-slate-50">
//                 {activities && activities.length > 0 ? (
//                   activities.map((item: any, index: number) => (
//                     <tr key={index} className="hover:bg-slate-50/50 transition-colors">
//                       <td className="p-6 font-bold text-slate-700">
//                         {new Date(item.date).toLocaleDateString('th-TH', { 
//                           day: 'numeric', month: 'short', year: 'numeric' 
//                         })}
//                       </td>
//                       <td className="p-6 font-bold text-right text-indigo-600">
//                         ทบทวนไป {item.count} คำ
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr><td className="p-10 text-center text-slate-400 font-bold">ยังไม่มีประวัติการทบทวนโบร</td></tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// };

// // Component ย่อยช่วยให้โค้ดสะอาดขึ้นครับ
// const StatCard = ({ title, value, icon: Icon, color, bgColor, isHighlight = false }: any) => (
//   <div className={`${isHighlight ? 'bg-indigo-600 text-white border-transparent shadow-xl shadow-indigo-100' : 'bg-white text-slate-900 border-slate-100 shadow-sm'} p-8 rounded-[32px] border transition-all hover:scale-[1.02]`}>
//     <div className={`${isHighlight ? 'bg-white/20 text-white' : `${bgColor} ${color}`} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
//       <Icon size={28} />
//     </div>
//     <div className={`text-5xl font-black mb-1`}>{value}</div>
//     <div className={`font-bold uppercase tracking-wider text-sm ${isHighlight ? 'opacity-80' : 'text-slate-400'}`}>{title}</div>
//   </div>
// );

// const ActivityRow = ({ word, status, score, color }: any) => (
//   <tr className="hover:bg-slate-50/50 transition-colors">
//     <td className="p-6 font-bold text-slate-700 italic">{word}</td>
//     <td className={`p-6 font-bold text-right ${color}`}>{status} ({score})</td>
//   </tr>
// );

// export default Dashboard;