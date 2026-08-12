import React, { useState } from 'react';
import { Header } from './components/Header';
import { CountryGrid } from './components/CountryGrid';
import { EasaGuide } from './components/EasaGuide';
import { FlightWizard } from './components/FlightWizard';
import { AiAssistant } from './components/AiAssistant';
import { PreflightChecklist } from './components/PreflightChecklist';
import { Plane } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'countries' | 'easa' | 'wizard' | 'assistant' | 'checklist'>('countries');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [initialAiPrompt, setInitialAiPrompt] = useState<string>('');
  const [wizardCountryCode, setWizardCountryCode] = useState<string>('CZ');

  const handleAskAi = (prompt: string) => {
    setInitialAiPrompt(prompt);
    setActiveTab('assistant');
  };

  const handleOpenWizardForCountry = (countryCode: string) => {
    setWizardCountryCode(countryCode);
    setActiveTab('wizard');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans antialiased flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'countries' && (
          <CountryGrid
            searchQuery={searchQuery}
            onAskAiForCountry={(countryName) => handleAskAi(`Jaká jsou konkrétní legislativní pravidla a omezení pro drony v zemi ${countryName}?`)}
            onOpenWizardForCountry={handleOpenWizardForCountry}
          />
        )}

        {activeTab === 'wizard' && (
          <FlightWizard
            initialCountryCode={wizardCountryCode}
            onAskAi={handleAskAi}
          />
        )}

        {activeTab === 'easa' && <EasaGuide />}

        {activeTab === 'assistant' && (
          <AiAssistant initialPrompt={initialAiPrompt} />
        )}

        {activeTab === 'checklist' && <PreflightChecklist />}
      </main>

      {/* Footer */}
      <footer className="bg-[#1e293b] border-t border-slate-700 text-slate-400 py-8 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Plane className="h-4 w-4 transform -rotate-45" />
            </div>
            <div>
              <p className="font-bold text-white">EU DronLegislativa 2026</p>
              <p className="text-[11px] text-slate-400">Přehled pravidel pro létání s drony dle EASA (Nařízení EU 2019/947 a 2019/945)</p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-[11px] text-slate-400">
              Vždy před každým vzletem ověřte aktuální geofencing zóny v oficiálních leteckých aplikacích příslušného členského státu (DronView, Dronespace, Dipul atd.).
            </p>
            <p className="text-[10px] text-slate-400">
              Upozornění: Aplikace slouží jako informační a vzdělávací průvodce. Závazným právním předpisem jsou oficiální vyhlášky národních leteckých úřadů (ÚCL, Austro Control, LBA atd.).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
