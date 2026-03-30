//frontend/src/pages/ReviewPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, CheckCircle2, XCircle, Trophy, Loader2 } from 'lucide-react';
import { getDueVocabs, submitReview } from '../services/vocabApi';

const USER_ID = "888f10a9-6345-4a8a-99a1-79984863acf1";

const ReviewPage = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  // Fetch pending review items on component mount
  useEffect(() => {
    const loadCards = async () => {
      try {
        const data = await getDueVocabs();
        const actualItems = data.items || [];
        setCards(actualItems);
      } catch (err) {
        console.error("Failed to load review cards:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, []);

  // Handle SRS rating submission and progress to next card
  const handleReview = async (quality: number) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    try {
      await submitReview({
        learningItemId: currentCard.id,
        rating: quality,
        responseTimeMs: 3500 
      });

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowDefinition(false);
      } else {
        setIsFinished(true);
      }
    } catch (err) {
      alert("Error saving review progress. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-bold">Preparing your session...</p>
      </div>
    );
  }

  // Display completion state when no cards remain
  if (isFinished || cards.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-10 bg-white rounded-[40px] shadow-sm border border-slate-100">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Session Complete!</h2>
        <p className="text-slate-500 mb-8 font-medium">You have reviewed all pending items for today.</p>
        <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 transition-colors font-bold">
        <ChevronLeft size={20} /> Exit Session
      </button>

      {/* Progress Indicator */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-10 overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-500" 
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard Main Area */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 p-12 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden">
        <span className="absolute top-8 right-10 text-slate-300 font-black text-xl">
          {currentIndex + 1} / {cards.length}
        </span>

        <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">
          {currentCard.title || "Unknown Word"}
        </h1>

        {showDefinition ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-2xl font-bold text-indigo-600 mb-2 italic">Definition:</p>
            <p className="text-xl text-slate-600 font-medium leading-relaxed">
              {currentCard.content || "No definition available."}
            </p>
          </div>
        ) : (
          <button 
            onClick={() => setShowDefinition(true)}
            className="flex items-center gap-2 px-8 py-3 bg-slate-50 text-slate-400 rounded-2xl font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
          >
            <Eye size={20} className="group-hover:scale-110 transition-transform" /> Show Definition
          </button>
        )}
      </div>

      {/* Rating Controls */}
      <div className={`grid grid-cols-2 gap-4 mt-8 transition-all duration-500 ${showDefinition ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <button 
          onClick={() => handleReview(0)}
          className="flex flex-col items-center gap-2 p-6 bg-white border-2 border-slate-100 rounded-[32px] hover:border-red-200 hover:bg-red-50 transition-all group"
        >
          <XCircle size={32} className="text-red-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-slate-600">Needs Review</span>
        </button>
        
        <button 
          onClick={() => handleReview(5)}
          className="flex flex-col items-center gap-2 p-6 bg-white border-2 border-slate-100 rounded-[32px] hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
        >
          <CheckCircle2 size={32} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-slate-600">Mastered</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;