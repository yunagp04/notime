//frontend/src/pages/VocabList.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, X, Loader2, BookOpen, Trash2, Pencil, Sparkles, Check, Undo2 } from 'lucide-react';
import { 
  getVocabs, 
  saveNewVocab, 
  updateVocab, 
  deleteVocab, 
  generateAIDefinition 
} from '../services/vocabApi';

const VocabList = () => {
  const { id } = useParams<{ id: string }>();
  const [vocabs, setVocabs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for bulk adding and processing
  const [bulkInput, setBulkInput] = useState("");
  const [bulkDefinition, setBulkDefinition] = useState("");
  const [isAutoAI, setIsAutoAI] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ word: '', definition: '' });

  // Modal and new entry states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWord, setNewWord] = useState({ word: '', definition: '' });

  // Fetch vocabulary items from the database
  const loadData = useCallback(async (showSilent = false) => {
    if (!id || id === "undefined") return;
    if (!showSilent) setIsLoading(true);
    try {
      const data = await getVocabs(id);
      const actualData = Array.isArray(data) ? data : (data.items || []);
      console.log("📦 Received Vocabs:", actualData);
      setVocabs(actualData);
    } catch (err) {
      console.error("Failed to fetch vocabulary items:", err);
      setVocabs([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle bulk adding of words/phrases (comma-separated)
  const handleHeaderAdd = async () => {
    if (!bulkInput.trim()) return alert("Please enter a word or phrase.");
    
    setIsProcessing(true);
    const words = bulkInput.split(',').map(w => w.trim()).filter(w => w.length > 0);
    
    try {
      const userId = "888f10a9-6345-4a8a-99a1-79984863acf1";
      for (const word of words) {
        await saveNewVocab({
          word,
          definition: bulkDefinition.trim(),
          listId: id || "",
          userId: userId,
          skipAI: !isAutoAI
        });
      }

      setBulkInput("");
      setBulkDefinition("");
      loadData(true);
    } catch (err) {
      alert("Some items could not be added. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Save a single item via modal
  const handleModalSave = async () => {
    if (!newWord.word.trim()) return;
    setIsProcessing(true);
    try {
      await saveNewVocab({
        word: newWord.word.trim(),
        definition: newWord.definition.trim(),
        listId: id || "",
        skipAI: newWord.definition.trim() !== "" 
      });

      setIsModalOpen(false);
      setNewWord({ word: '', definition: '' });
      // ✅ ใส่ true เพื่อให้โหลดข้อมูลใหม่แบบ "หน้าไม่เด้ง"
      await loadData(true); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete an item from the list
  const handleDelete = async (vocabId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteVocab(vocabId);
      loadData(true);
    } catch (err) {
      alert("Failed to delete the item.");
    }
  };

  // Update specific definition using AI
  const handleRowGenAI = async (vocabId: string, word: string) => {
    try {
      const aiDef = await generateAIDefinition(word);
      if (aiDef) {
        await updateVocab(vocabId, { word, definition: aiDef });
        loadData(true);
      }
    } catch (err) {
      alert("AI could not generate a definition for this word.");
    }
  };

  const startEditing = (v: any) => {
    setEditingId(v.id);
    setEditForm({ word: v.word, definition: v.definition || '' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ word: '', definition: '' });
  };

  // Update existing entry details
  const handleUpdate = async (vocabId: string) => {
    if (!editForm.word.trim()) return alert("Word field cannot be empty.");
    
    try {
      await updateVocab(vocabId, {
        word: editForm.word.trim(),
        definition: editForm.definition.trim()
      });

      setEditingId(null);
      loadData(true);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Could not update the entry.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Quick Add and List Controls */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <BookOpen className="text-indigo-600" size={36} /> My Vocabs
            </h2>
            <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">List ID: {id}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
              <Sparkles size={18} className={isAutoAI ? "text-indigo-600" : "text-slate-300"} />
              <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Auto AI</span>
              <button 
                onClick={() => setIsAutoAI(!isAutoAI)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isAutoAI ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${isAutoAI ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <button 
              onClick={handleHeaderAdd}
              disabled={isProcessing}
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Add Items
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder="Enter words or phrases, separated by commas (e.g. apple, get up)"
            className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-bold text-lg transition-all"
          />
          <textarea 
            value={bulkDefinition}
            onChange={(e) => setBulkDefinition(e.target.value)}
            placeholder="Definition (Leave blank for AI assistance)"
            rows={1}
            className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-medium text-lg transition-all resize-none"
          />
        </div>
      </div>

      {/* Vocabulary Display Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="font-bold text-lg tracking-widest uppercase">Fetching entries...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-12 py-8 text-xs font-black text-slate-400 uppercase tracking-widest">Word / Phrase</th>
                <th className="px-12 py-8 text-xs font-black text-slate-400 uppercase tracking-widest">Definition</th>
                <th className="px-12 py-8 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vocabs.length > 0 ? (
                vocabs.map((v) => (
                  <tr key={v.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                    {editingId === v.id ? (
                      <>
                        <td className="px-12 py-6">
                          <input 
                            value={editForm.word} 
                            onChange={e => setEditForm({...editForm, word: e.target.value})} 
                            className="w-full p-2 border-b-2 border-indigo-500 outline-none font-bold text-xl bg-transparent"
                          />
                        </td>
                        <td className="px-12 py-6">
                          <textarea 
                            value={editForm.definition} 
                            onChange={e => setEditForm({...editForm, definition: e.target.value})} 
                            className="w-full p-2 border-b-2 border-indigo-500 outline-none font-medium text-lg bg-transparent resize-none" 
                            rows={1}
                          />
                        </td>
                        <td className="px-12 py-6 text-right space-x-2">
                          <button onClick={() => handleUpdate(v.id)} className="p-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700">
                            <Check size={20} />
                          </button>
                          <button onClick={cancelEditing} className="p-3 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300">
                            <Undo2 size={20} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-12 py-8 font-black text-2xl text-slate-800">{v.word}</td>
                        <td className="px-12 py-8">
                          {v.definition ? (
                            <div className="flex flex-col"> {/* 👈 เพิ่ม div ครอบเพื่อให้จัดบรรทัดได้ */}
                              <span className="text-slate-600 font-medium text-lg leading-relaxed">
                                {v.definition}
                              </span>
                              
                              {/* ✅ เพิ่มส่วนแสดงวันที่ทบทวนถัดไปตรงนี้ครับ */}
                              <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                <span className="text-slate-400">Next Review:</span>
                                <span className={v.nextReview ? "text-indigo-500" : "text-amber-500"}>
                                  {v.nextReview 
                                    ? new Date(v.nextReview).toLocaleDateString('th-TH', { 
                                        year: 'numeric', month: 'short', day: 'numeric' 
                                      }) 
                                    : "Pending..."}
                                </span>
                              </div>
                            </div>
                            ) : (
                              <button 
                                onClick={() => handleRowGenAI(v.id, v.word)}
                                className="flex items-center gap-2 text-indigo-500 font-bold bg-indigo-50 px-5 py-2 rounded-xl hover:bg-indigo-100 transition-all"
                              >
                                <Sparkles size={16} /> Generate ✨
                              </button>
                            )}
                          </td>
                        <td className="px-12 py-8 text-right">
                          <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => startEditing(v)} className="p-3 bg-white text-slate-600 rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50">
                              <Pencil size={20} />
                            </button>
                            <button onClick={() => handleRowGenAI(v.id, v.word)} className="p-3 bg-white text-indigo-600 rounded-2xl border border-slate-100 shadow-sm hover:bg-indigo-50">
                              <Sparkles size={20} />
                            </button>
                            <button onClick={() => handleDelete(v.id)} className="p-3 bg-white text-red-500 rounded-2xl border border-slate-100 shadow-sm hover:bg-red-50">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-12 py-32 text-center text-slate-300 italic text-xl">
                    No vocabulary items found. Start by adding one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 right-10 z-50"> 
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-5 bg-indigo-600 text-white rounded-[28px] shadow-2xl shadow-indigo-200 hover:bg-slate-900 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group"
        >
          <Plus size={32} />
        </button>
      </div>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl border border-slate-100 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-8 top-8 text-slate-400 hover:text-red-500"><X size={28} /></button>
            <div className="mb-8">
              <h3 className="text-3xl font-black text-slate-900">New Entry ✨</h3>
              <p className="text-slate-500 mt-1">Enter the vocabulary you wish to save.</p>
            </div>
            <div className="space-y-6">
              <input 
                value={newWord.word} 
                onChange={e => setNewWord({...newWord, word: e.target.value})} 
                placeholder="Vocabulary..." 
                className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-bold text-xl transition-all" 
              />
              <textarea 
                value={newWord.definition} 
                onChange={e => setNewWord({...newWord, definition: e.target.value})} 
                placeholder="Definition (Leave blank for AI assistance)..." 
                rows={3}
                className="w-full px-7 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium text-lg transition-all resize-none" 
              />
              <button 
                onClick={handleModalSave} 
                disabled={isProcessing}
                className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? "Saving..." : "Save Entry 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabList;