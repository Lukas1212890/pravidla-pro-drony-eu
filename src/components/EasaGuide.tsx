import React, { useState } from 'react';
import { EASA_CATEGORIES_INFO, DRONE_CLASSES_DATA } from '../data/categories';
import { DroneClassId, EasaCategory } from '../types';
import { Plane, ShieldCheck, Tag, Info, AlertTriangle, Radio, Users, CheckCircle, ArrowRight } from 'lucide-react';

export const EasaGuide: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<EasaCategory>('A1');
  const [selectedClass, setSelectedClass] = useState<DroneClassId>('C0');

  const currentCatInfo = EASA_CATEGORIES_INFO[selectedCategory];
  const currentClassInfo = DRONE_CLASSES_DATA.find((c) => c.id === selectedClass)!;

  return (
    <div className="space-y-8 py-6 text-slate-100">
      {/* Intro Hero Section */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3 uppercase tracking-wider">
          <Plane className="h-3.5 w-3.5" />
          <span>EASA Rámec (Nařízení EU 2019/947 & 2019/945)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Jak fungují evropské kategorie a štítky tříd C0 až C4?
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Od roku 2024 platí v celé EU jednotná pravidla pro bezpilotní systémy. Drony jsou rozděleny podle hmotnosti a bezpečnostního rizika do 3 hlavních provozních kategorií (Open, Specific, Certified) a označené štítky C0, C1, C2, C3, C4.
        </p>
      </div>

      {/* Interactive Tabs for Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          1. Provozní kategorie podle rizika
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {(['A1', 'A2', 'A3', 'Specific', 'Certified'] as EasaCategory[]).map((catKey) => {
            const cat = EASA_CATEGORIES_INFO[catKey];
            const isActive = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/50'
                    : 'bg-[#0f172a] border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">{catKey}</span>
                  {isActive && <CheckCircle className="h-4 w-4 text-white" />}
                </div>
                <span className="text-[11px] block text-slate-300 mt-1 truncate font-medium">
                  {catKey === 'A1' ? 'Přelet nad lidmi' : catKey === 'A2' ? 'Blízko lidí' : catKey === 'A3' ? 'Otevřená krajina' : catKey}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Detailed Card */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-700">
            <div>
              <h4 className="text-xl font-bold text-white">{currentCatInfo.title}</h4>
              <p className="text-xs text-blue-400 font-semibold mt-0.5">{currentCatInfo.subtitle}</p>
            </div>
            <span className="self-start md:self-auto text-xs font-bold uppercase tracking-wider bg-[#0f172a] px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-300">
              Kategorie: {selectedCategory}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {currentCatInfo.description}
          </p>

          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Klíčové požadavky a omezení:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {currentCatInfo.requirements.map((req, idx) => (
              <div key={idx} className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-700 flex items-start space-x-2.5">
                <ArrowRight className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-200 font-medium">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Markings C0 - C4 Grid */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Tag className="h-5 w-5 text-amber-400" />
          2. Označení tříd drona (Štítky C0 až C4)
        </h3>
        <p className="text-xs text-slate-400">
          Při nákupu nového drona zkontrolujte oficiální štítek třídy C0, C1, C2, C3 nebo C4 vyražený na těle zařízení.
        </p>

        {/* Class Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {DRONE_CLASSES_DATA.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                selectedClass === cls.id
                  ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20'
                  : 'bg-[#0f172a] text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              {cls.label}
            </button>
          ))}
        </div>

        {/* Class Info Box */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-700">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-500/20 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-500/40">
                  {currentClassInfo.id.toUpperCase()}
                </span>
                <h4 className="text-lg font-bold text-white">{currentClassInfo.label}</h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentClassInfo.description}</p>
            </div>

            <div className="bg-[#0f172a] px-4 py-2 rounded-xl border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Váhový limit</span>
              <span className="text-sm font-extrabold text-blue-400">{currentClassInfo.weightLimit}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 block font-semibold mb-1">Požadovaná zkouška / certifikát pilota:</span>
              <span className="text-white font-medium">{currentClassInfo.examRequired}</span>
            </div>

            <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 block font-semibold mb-1">Odolenost / Pravidlo odstupů od lidí:</span>
              <span className="text-white font-medium">{currentClassInfo.flyingOverPeopleRule}</span>
            </div>

            <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-700 flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Remote ID (Vzdálená identifikace):</span>
              {currentClassInfo.remoteIdRequired ? (
                <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  POVINNÉ
                </span>
              ) : (
                <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Nepovinné</span>
              )}
            </div>

            <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-700 flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Geo-awareness (Povědomí o prostoru):</span>
              {currentClassInfo.geoAwarenessRequired ? (
                <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  POVINNÉ
                </span>
              ) : (
                <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Nepovinné</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Operator Registration vs Pilot Certificate Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700 text-xs">
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">1. Registrace Provozovatele (Operator ID / OAR)</h4>
              <p className="text-slate-400">Vztahuje se k majiteli drona (osobě nebo firmě)</p>
            </div>
          </div>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Kdy je povinná:</strong> Pro VŠECHNY drony s kamerou nebo senzorem osobnictví (i pod 250g, např. DJI Mini), vyjma hraček dle směrnice 2009/48/ES.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Výsledek:</strong> Unikátní číslo provozovatele (např. CZE123456789abc), které vylepíte na VŠECHNY své drony a zadáte do vysílače Remote ID.</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">2. Certifikát Pilota (Pilot Certificate)</h4>
              <p className="text-slate-400">Vztahuje se na osobu, která dron fyzicky řídí</p>
            </div>
          </div>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Kdy je povinný:</strong> Pro drony těžší než 250g (C1, C2, C3, C4). Pro C0 (pod 250g) není vyžadován.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Průběh zkoušky A1/A3:</strong> Zdarma online test se 40 otázkami s výběrem odpovědí na portálu ÚCL / národního úřadu. Platnost 5 let v celé EU.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
