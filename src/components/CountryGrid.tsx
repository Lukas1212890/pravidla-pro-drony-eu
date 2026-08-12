import React, { useState, useMemo } from 'react';
import { CountryRule } from '../types';
import { EU_COUNTRIES_DATA } from '../data/countries';
import { 
  ExternalLink, 
  MapPin, 
  ShieldAlert, 
  Moon, 
  FileCheck, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Scale,
  Sparkles,
  Search,
  SlidersHorizontal,
  Building2,
  X
} from 'lucide-react';

interface CountryGridProps {
  searchQuery: string;
  onAskAiForCountry: (countryName: string) => void;
  onOpenWizardForCountry: (countryCode: string) => void;
}

export const CountryGrid: React.FC<CountryGridProps> = ({
  searchQuery,
  onAskAiForCountry,
  onOpenWizardForCountry,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [filterMandatoryInsurance, setFilterMandatoryInsurance] = useState<boolean>(false);
  const [filterNightAllowed, setFilterNightAllowed] = useState<boolean>(false);
  const [activeCountryModal, setActiveCountryModal] = useState<CountryRule | null>(null);

  // Comparison State
  const [compareCountryCodes, setCompareCountryCodes] = useState<string[]>(['CZ', 'AT']);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Filter countries
  const filteredCountries = useMemo(() => {
    return EU_COUNTRIES_DATA.filter((c) => {
      // Region match
      if (selectedRegion !== 'All' && c.region !== selectedRegion) {
        return false;
      }
      // Mandatory insurance match
      if (filterMandatoryInsurance && !c.mandatoryInsurance) {
        return false;
      }
      // Night flight match
      if (filterNightAllowed && c.nightFlightAllowed !== true) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.nameCz.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q);
        const matchCode = c.code.toLowerCase().includes(q);
        const matchAuth = c.authorityName.toLowerCase().includes(q);
        const matchApp = c.officialMapApp.toLowerCase().includes(q);
        const matchRules = c.uniqueNationalRules.some((r) => r.toLowerCase().includes(q));
        return matchName || matchCode || matchAuth || matchApp || matchRules;
      }
      return true;
    });
  }, [selectedRegion, filterMandatoryInsurance, filterNightAllowed, searchQuery]);

  const toggleCompare = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareCountryCodes.includes(code)) {
      setCompareCountryCodes(compareCountryCodes.filter((c) => c !== code));
    } else {
      if (compareCountryCodes.length >= 3) {
        alert('Můžete porovnávat maximálně 3 země současně.');
        return;
      }
      setCompareCountryCodes([...compareCountryCodes, code]);
    }
  };

  const comparedCountries = useMemo(() => {
    return EU_COUNTRIES_DATA.filter((c) => compareCountryCodes.includes(c.code));
  }, [compareCountryCodes]);

  return (
    <div className="space-y-6 text-slate-100 py-6">
      {/* Top Banner / Hero Info */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Harmonizovaná legislativní databáze EASA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pravidla pro drony v zemích Evropské unie
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Evropská unie používá společný rámec EASA (Nařízení 2019/947), avšak jednotlivé členské státy uplatňují specifické národní předpisy pro pojištění, ochranu přírody, letecké mapy a noční lety.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {compareCountryCodes.length > 0 && (
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 transition text-sm uppercase tracking-wider"
              >
                <Scale className="h-4 w-4" />
                <span>Porovnat vybrané ({compareCountryCodes.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700 text-xs">
          <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Celkem EU států</span>
            <span className="text-2xl font-black text-white mt-1 block">
              27 <span className="text-xs text-blue-400 ml-1 font-normal">zemí EU (+2 CH/NO)</span>
            </span>
          </div>
          <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Povinné pojištění</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {EU_COUNTRIES_DATA.filter((c) => c.mandatoryInsurance).length}<span className="text-xs text-slate-400 ml-1 font-normal">(AT, DE, IT...)</span>
            </span>
          </div>
          <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Max výška letu</span>
            <span className="text-2xl font-black text-white mt-1 block">120<span className="text-xs text-blue-400 ml-1 font-normal">m AGL</span></span>
          </div>
          <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">Dohled na dron</span>
            <span className="text-2xl font-black text-white mt-1 block">VLOS<span className="text-xs text-blue-400 ml-1 font-normal">přímý dohled</span></span>
          </div>
        </div>
      </div>

      {/* Region & Feature Filters Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-[#1e293b] p-4 rounded-2xl border border-slate-700 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Region:
          </span>
          {[
            { id: 'All', label: 'Všechny státy' },
            { id: 'Central', label: 'Střední Evropa' },
            { id: 'Southern', label: 'Jižní Evropa (pláže)' },
            { id: 'Western', label: 'Západní Evropa' },
            { id: 'Northern', label: 'Severní Evropa' },
            { id: 'Non-EU Schengen', label: 'Švýcarsko & Norsko' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                selectedRegion === r.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-[#0f172a] text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Checkbox Toggles */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer bg-[#0f172a] px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition">
            <input
              type="checkbox"
              checked={filterMandatoryInsurance}
              onChange={(e) => setFilterMandatoryInsurance(e.target.checked)}
              className="rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-400 h-4 w-4"
            />
            <span className="text-slate-200 font-medium">Jen povinné pojištění</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-[#0f172a] px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition">
            <input
              type="checkbox"
              checked={filterNightAllowed}
              onChange={(e) => setFilterNightAllowed(e.target.checked)}
              className="rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-400 h-4 w-4"
            />
            <span className="text-slate-200 font-medium">Jen noční lety</span>
          </label>
        </div>
      </div>

      {/* Countries Grid */}
      {filteredCountries.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Search className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Nenalezena žádná země</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Zkuste změnit zadané hledání "{searchQuery}" nebo upravit filtry regionu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCountries.map((country) => {
            const isCompared = compareCountryCodes.includes(country.code);

            return (
              <div
                key={country.code}
                onClick={() => setActiveCountryModal(country)}
                className={`bg-[#1e293b] hover:bg-slate-800 border ${
                  isCompared ? 'border-blue-500/80 ring-1 ring-blue-500/40' : 'border-slate-700 hover:border-blue-500/50'
                } rounded-2xl p-5 transition-all duration-200 cursor-pointer group shadow-lg flex flex-col justify-between relative`}
              >
                <div>
                  {/* Header: Flag, Name, Region & Compare Toggle */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl filter drop-shadow">{country.flagEmoji}</span>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition flex items-center gap-2">
                          <span>{country.nameCz}</span>
                          <span className="text-xs font-mono font-normal text-slate-400 bg-[#0f172a] px-2 py-0.5 rounded border border-slate-700">
                            {country.code}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">{country.nameEn}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleCompare(country.code, e)}
                      title={isCompared ? 'Odebrat z porovnání' : 'Přidat do porovnání'}
                      className={`p-2 rounded-xl text-xs font-semibold transition ${
                        isCompared
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : 'bg-[#0f172a] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <Scale className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Authority Info */}
                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex items-center justify-between text-slate-300 bg-[#0f172a] p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-blue-400" />
                        Úřad:
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[180px]" title={country.authorityName}>
                        {country.authorityName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300 bg-[#0f172a] p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        Aplikace / Mapa:
                      </span>
                      <span className="font-semibold text-emerald-300 truncate max-w-[180px]" title={country.officialMapApp}>
                        {country.officialMapApp}
                      </span>
                    </div>
                  </div>

                  {/* Badges / Key Requirements */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Insurance Badge */}
                    {country.mandatoryInsurance ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                        Povinné pojištění
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#0f172a] text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                        <FileCheck className="h-3.5 w-3.5 text-slate-400" />
                        Pojištění nepovinné pro C0
                      </span>
                    )}

                    {/* Night Flight Badge */}
                    {country.nightFlightAllowed === true ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                        <Moon className="h-3.5 w-3.5 text-indigo-400" />
                        Noc povolena
                      </span>
                    ) : country.nightFlightAllowed === false ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        Zákaz noci v Open
                      </span>
                    ) : null}
                  </div>

                  {/* Unique Rule Teaser */}
                  {country.uniqueNationalRules.length > 0 && (
                    <p className="text-xs text-slate-300 line-clamp-2 bg-[#0f172a] p-3 rounded-xl border border-slate-700/80 mb-4 italic">
                      "{country.uniqueNationalRules[0]}"
                    </p>
                  )}
                </div>

                {/* Footer Action Button */}
                <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300 uppercase tracking-wider">
                  <span>Zobrazit kompletní pravidla</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Country Detail Modal */}
      {activeCountryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative text-slate-100">
            {/* Close Button */}
            <button
              onClick={() => setActiveCountryModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-slate-800">
              <span className="text-5xl">{activeCountryModal.flagEmoji}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-2xl font-extrabold text-white">{activeCountryModal.nameCz}</h3>
                  <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                    {activeCountryModal.code}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{activeCountryModal.nameEn} • Region: {activeCountryModal.region}</p>
              </div>
            </div>

            {/* Main Details Grid */}
            <div className="space-y-6 text-sm">
              
              {/* Section 1: Authority & Registration */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Národní letecký úřad a registrace
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Letecký úřad:</span>
                    <a
                      href={activeCountryModal.authorityWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-white hover:text-cyan-300 flex items-center gap-1 mt-0.5"
                    >
                      <span>{activeCountryModal.authorityName}</span>
                      <ExternalLink className="h-3 w-3 text-cyan-400" />
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Registrační portál provozovatele:</span>
                    <a
                      href={activeCountryModal.operatorRegPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-cyan-300 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>{activeCountryModal.operatorRegCost}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Section 2: Official Geo-Zone Map / App */}
              <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Oficiální aplikace / Mapa vzdušného prostoru
                  </h4>
                  <a
                    href={activeCountryModal.officialMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20"
                  >
                    <span>Otevřít {activeCountryModal.officialMapApp}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-300">
                  Vždy před každým vzletem prověřte místní omezení a geofencing zóny v oficiální aplikaci státu.
                </p>
              </div>

              {/* Section 3: Insurance & Penalties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${
                  activeCountryModal.mandatoryInsurance
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-2">
                    <ShieldAlert className="h-4 w-4" />
                    Pojištění odpovědnosti
                  </h4>
                  <p className="text-xs font-semibold text-white mb-1">
                    {activeCountryModal.mandatoryInsurance ? 'POVINNÉ PRO VŠECHNY DRONY' : 'Nepovinné pro kateg. Open C0'}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeCountryModal.insuranceNotes}
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Pokuty a sankce
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeCountryModal.penaltiesInfo}
                  </p>
                </div>
              </div>

              {/* Section 4: Specific National Rules */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Místní specifičnosti a národní předpisy
                </h4>
                <ul className="space-y-2 text-xs text-slate-200">
                  {activeCountryModal.uniqueNationalRules.map((rule, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <ChevronRight className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                  <li className="flex items-start space-x-2 text-slate-300">
                    <ChevronRight className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Národní parky & Příroda:</strong> {activeCountryModal.natureReserveRules}</span>
                  </li>
                  <li className="flex items-start space-x-2 text-slate-300">
                    <ChevronRight className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Kamera & Soukromí:</strong> {activeCountryModal.privacyCameraRules}</span>
                  </li>
                  <li className="flex items-start space-x-2 text-slate-300">
                    <ChevronRight className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong>FPV lety:</strong> {activeCountryModal.fpvFlightRules}</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => {
                  const countryName = activeCountryModal.nameCz;
                  setActiveCountryModal(null);
                  onAskAiForCountry(countryName);
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/20"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Zeptat se AI asistenta na {activeCountryModal.nameCz}</span>
              </button>

              <button
                onClick={() => {
                  const code = activeCountryModal.code;
                  setActiveCountryModal(null);
                  onOpenWizardForCountry(code);
                }}
                className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-cyan-500/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Ověřit v kalkulátoru letu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Country Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative text-slate-100">
            
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Scale className="h-6 w-6 text-cyan-400" />
                Srovnání legislativních podmínek zemí EU
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Porovnejte klíčové požadavky pro plánování vaší dovolené nebo pracovní cesty.
              </p>
            </div>

            {comparedCountries.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                Vyberte kliknutím na ikonu vah u vámi požadovaných zemí (např. ČR, Rakousko, Chorvatsko).
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80">
                      <th className="p-3 text-slate-400 font-bold uppercase w-1/4">Parametr</th>
                      {comparedCountries.map((c) => (
                        <th key={c.code} className="p-3 text-white font-bold text-sm">
                          <span className="mr-2 text-xl">{c.flagEmoji}</span>
                          {c.nameCz} ({c.code})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="p-3 font-semibold text-slate-400 bg-slate-950/30">Letecký úřad</td>
                      {comparedCountries.map((c) => (
                        <td key={c.code} className="p-3 font-bold text-white">
                          {c.authorityName}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-semibold text-slate-400 bg-slate-950/30">Aplikace / Mapa zón</td>
                      {comparedCountries.map((c) => (
                        <td key={c.code} className="p-3 text-emerald-300 font-semibold">
                          <a href={c.officialMapUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            {c.officialMapApp}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-semibold text-slate-400 bg-slate-950/30">Pojištění odpovědnosti</td>
                      {comparedCountries.map((c) => (
                        <td key={c.code} className="p-3">
                          {c.mandatoryInsurance ? (
                            <span className="inline-flex items-center text-amber-400 font-bold gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                              <ShieldAlert className="h-3 w-3" />
                              POVINNÉ VŠUDE
                            </span>
                          ) : (
                            <span className="text-slate-300">Nepovinné pro C0 (pod 250 g)</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-semibold text-slate-400 bg-slate-950/30">Registrační poplatek</td>
                      {comparedCountries.map((c) => (
                        <td key={c.code} className="p-3">
                          {c.operatorRegCost}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-semibold text-slate-400 bg-slate-950/30">Lety v noci</td>
                      {comparedCountries.map((c) => (
                        <td key={c.code} className="p-3">
                          {c.nightFlightAllowed === true ? (
                            <span className="text-emerald-400 font-semibold">Povoleny (stroboskop)</span>
                          ) : (
                            <span className="text-rose-400 font-semibold">ZÁKAZ v Open</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-semibold text-slate-400 bg-slate-950/30">Minimální věk pilota</td>
                      {comparedCountries.map((c) => (
                        <td key={c.code} className="p-3 font-bold">
                          {c.pilotMinAge} let
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-3 font-semibold text-slate-400 bg-slate-950/30">Hlavní doporučení</td>
                      {comparedCountries.map((c) => (
                        <td key={c.code} className="p-3 text-slate-300 text-[11px] leading-snug">
                          {c.uniqueNationalRules[0] || 'Bez zvláštností'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
