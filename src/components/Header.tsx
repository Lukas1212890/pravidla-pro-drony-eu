import React, { useState, useRef, useEffect } from 'react';
import { Plane, ShieldCheck, Compass, Bot, CheckSquare, Search, Sparkles, ChevronDown } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'countries', label: 'Přehled zemí', icon: Compass, color: 'text-cyan-400' },
    { id: 'wizard', label: 'Kalkulátor létání', icon: ShieldCheck, color: 'text-emerald-400' },
    { id: 'easa', label: 'Kategorie A1–A3', icon: Plane, color: 'text-blue-400' },
    { id: 'assistant', label: 'AI Rádce', icon: Bot, color: 'text-purple-400', isAi: true },
    { id: 'checklist', label: 'Kontrolní seznam', icon: CheckSquare, color: 'text-amber-400' },
  ];

  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top bar with Logo & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 sm:py-3.5 gap-2.5">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab('countries')}
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 ring-1 ring-white/20 shrink-0">
              <Plane className="h-5 w-5 text-white transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  EU DronLegislativa
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40 px-1.5 py-0.5 rounded-full">
                  EASA 2026
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                Pravidla, registrace a mapy pro 27 zemí EU
              </p>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="relative w-full sm:max-w-xs md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat zemi (např. ČR, Rakousko...)"
              className="w-full pl-8 pr-8 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Navigation Bar - Horizontally scrollable on mobile */}
        <div className="pb-2.5 pt-1.5 border-t border-slate-800/80" ref={dropdownRef}>
          {/* MOBILE VIEW (< lg): "Přehled zemí" + "Další ▾" button side-by-side */}
          <div className="flex lg:hidden items-center gap-2 relative">
            {/* Button 1: Přehled zemí */}
            <button
              onClick={() => {
                setActiveTab('countries');
                setIsDropdownOpen(false);
              }}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                activeTab === 'countries'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:text-white'
              }`}
            >
              <Compass className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Přehled zemí</span>
            </button>

            {/* Button 2: Další / vybraná sekundární záložka */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex-1 flex items-center justify-between space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                activeTab !== 'countries'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1.5 truncate">
                {activeTab !== 'countries' ? (
                  <>
                    <activeItem.icon className={`h-4 w-4 ${activeItem.color} shrink-0`} />
                    <span className="truncate">{activeItem.label}</span>
                  </>
                ) : (
                  <span>Další možnosti</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 shrink-0 text-cyan-400 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Dropdown Panel */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 left-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in duration-150">
                <div className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Ostatní nástroje:
                </div>
                {navItems.filter((item) => item.id !== 'countries').map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`h-4 w-4 ${item.color} shrink-0`} />
                        <span>{item.label}</span>
                      </div>
                      {item.isAi && <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* DESKTOP VIEW (>= lg): Full horizontal row */}
          <nav className="hidden lg:flex lg:items-center lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30 font-bold'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${item.color} shrink-0`} />
                  <span>{item.label}</span>
                  {item.isAi && <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse ml-0.5 shrink-0" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
