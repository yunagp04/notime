// src/pages/VocabPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLists } from "../services/vocabApi";

function VocabPage() {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch all vocabulary collections on mount
  useEffect(() => {
    getLists()
      .then(data => setLists(data))
      .catch(err => console.error("Failed to fetch collections:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-xl font-bold text-slate-600 animate-pulse">Loading collections...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Collections 📚</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your personalized vocabulary lists and sets.</p>
      </header>
      
      <div className="grid gap-6">
        {lists.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-lg italic">No collections found. Start by creating a new list.</p>
          </div>
        ) : (
          lists.map((list) => (
            <div 
              key={list.list_id}
              onClick={() => navigate(`/vocab/${list.list_id}`)}
              className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-400 hover:-translate-y-1 transition-all cursor-pointer flex justify-between items-center group"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {list.name}
                </h2>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                  <span>ID:</span>
                  <span className="font-mono">{list.list_id}</span>
                </div>
              </div>
              
              <div className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black text-lg">
                {list.vocab_count} Words
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VocabPage;