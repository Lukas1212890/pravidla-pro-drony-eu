import React, { useState, useEffect } from 'react';
import { PREFLIGHT_CHECKLIST_ITEMS } from '../data/categories';
import { DOC_CHECKLIST_ITEMS } from '../data/googleDocData';
import { CheckSquare, RotateCcw, ShieldCheck, AlertCircle, CheckCircle2, Plane } from 'lucide-react';

export const PreflightChecklist: React.FC = () => {
  const [mode, setMode] = useState<'standard' | 'travelDoc'>('travelDoc');

  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eu_drone_checklist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [docCheckedIndexes, setDocCheckedIndexes] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('eu_drone_doc_checklist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eu_drone_checklist', JSON.stringify(checkedIds));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }, [checkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem('eu_drone_doc_checklist', JSON.stringify(docCheckedIndexes));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }, [docCheckedIndexes]);

  const toggleCheck = (id: string) => {
    if (checkedIds.includes(id)) {
      setCheckedIds(checkedIds.filter((item) => item !== id));
    } else {
      setCheckedIds([...checkedIds, id]);
    }
  };

  const toggleDocCheck = (index: number) => {
    if (docCheckedIndexes.includes(index)) {
      setDocCheckedIndexes(docCheckedIndexes.filter((i) => i !== index));
    } else {
      setDocCheckedIndexes([...docCheckedIndexes, index]);
    }
  };

  const resetChecklist = () => {
    if (mode === 'standard') {
      setCheckedIds([]);
    } else {
      setDocCheckedIndexes([]);
    }
  };

  const currentCount = mode === 'standard' ? checkedIds.length : docCheckedIndexes.length;
  const totalCount = mode === 'standard' ? PREFLIGHT_CHECKLIST_ITEMS.length : DOC_CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((currentCount / totalCount) * 100);

  return (
    <div className="space-y-8 py-6 text-slate-100 max-w-4xl mx-auto">
      
      {/* Mode Switcher */}
      <div className="flex bg-[#1e293b] p-1.5 rounded-2xl border border-slate-700 max-w-md mx-auto">
        <button
          onClick={() => setMode('travelDoc')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            mode === 'travelDoc'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plane className="h-4 w-4" />
          <span>Univerzální checklist na cestu (z Vašeho doku)</span>
        </button>
        <button
          onClick={() => setMode('standard')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            mode === 'standard'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Technická kontroly dronu</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Předletová bezpečnostní kontrola EASA</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {mode === 'travelDoc' ? 'Univerzální checklist na cestu po EU' : 'Technický předletový kontrolní seznam'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {mode === 'travelDoc'
              ? 'Předpisové kroky vyžadované při přejezdu hranic a létání v jiných státech EU podle Vašeho oficiálního dokumentu.'
              : 'Projděte tyto technické body před zapnutím motorů k eliminaci rizik a dodržení EASA legislativy.'}
          </p>
        </div>

        <button
          onClick={resetChecklist}
          className="self-start sm:self-auto bg-[#0f172a] hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Vynulovat seznam</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 shadow-lg space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300">Stav připravenosti k odletu:</span>
          <span className={progressPercent === 100 ? 'text-emerald-400 font-extrabold' : 'text-blue-400'}>
            {currentCount} z {totalCount} splněno ({progressPercent} %)
          </span>
        </div>

        <div className="w-full h-3 bg-[#0f172a] rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercent === 100
                ? 'bg-emerald-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {progressPercent === 100 && (
          <div className="bg-emerald-950/40 border border-emerald-500/50 p-3 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 mt-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span className="font-bold">Všechny položky ověřeny. Šťastný a bezpečný let!</span>
          </div>
        )}
      </div>

      {/* Checklist Items */}
      {mode === 'travelDoc' ? (
        <div className="space-y-3">
          {DOC_CHECKLIST_ITEMS.map((itemText, idx) => {
            const isDone = docCheckedIndexes.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => toggleDocCheck(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
                  isDone
                    ? 'bg-[#0f172a]/80 border-emerald-500/40 opacity-80'
                    : 'bg-[#1e293b] border-slate-700 hover:border-blue-500/50 shadow-md'
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold'
                      : 'bg-[#0f172a] border-slate-600'
                  }`}
                >
                  {isDone && <CheckCircle2 className="h-4 w-4" />}
                </div>

                <div className="flex-1">
                  <p className={`text-sm font-medium leading-relaxed ${isDone ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                    {itemText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {PREFLIGHT_CHECKLIST_ITEMS.map((item) => {
            const isDone = checkedIds.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
                  isDone
                    ? 'bg-[#0f172a]/80 border-emerald-500/40 opacity-80'
                    : 'bg-[#1e293b] border-slate-700 hover:border-blue-500/50 shadow-md'
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold'
                      : 'bg-[#0f172a] border-slate-600'
                  }`}
                >
                  {isDone && <CheckCircle2 className="h-4 w-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold ${isDone ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-[#0f172a] px-2.5 py-0.5 rounded border border-slate-700">
                      {item.category}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${isDone ? 'text-slate-500' : 'text-slate-300'}`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
