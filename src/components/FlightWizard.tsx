import React, { useState } from 'react';
import { WizardAnswers, WizardDiagnostic } from '../types';
import { EU_COUNTRIES_DATA } from '../data/countries';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Compass, 
  Building2, 
  Sparkles,
  RotateCcw,
  Plane
} from 'lucide-react';

interface FlightWizardProps {
  initialCountryCode?: string;
  onAskAi: (prompt: string) => void;
}

export const FlightWizard: React.FC<FlightWizardProps> = ({
  initialCountryCode = 'CZ',
  onAskAi,
}) => {
  const [answers, setAnswers] = useState<WizardAnswers>({
    countryCode: initialCountryCode,
    droneWeight: 'under250g',
    hasClassMarking: 'C0',
    hasCamera: true,
    flyLocation: 'suburbs_park',
    purpose: 'recreational',
  });

  const [diagnostic, setDiagnostic] = useState<WizardDiagnostic | null>(null);

  const calculateFlightStatus = () => {
    const selectedCountry = EU_COUNTRIES_DATA.find((c) => c.code === answers.countryCode) || EU_COUNTRIES_DATA[0];

    let canFly: 'yes' | 'conditional' | 'prohibited' = 'yes';
    let category: WizardDiagnostic['category'] = 'A1';
    let title = '';
    let mainRecommendation = '';
    const checklist: WizardDiagnostic['checklist'] = [];

    // Location prohibitions
    if (answers.flyLocation === 'city_crowd') {
      canFly = 'prohibited';
      title = 'ZÁKAZ LETU NAD SHROMÁŽDĚNÍM LIDÍ';
      mainRecommendation = 'Kategorie Open v celé EU striktně zakazuje přelety nad shromážděními lidí (koncerty, sportoviště, plné pláže, průvody). Pro takový let je nutné povolení v kategorii Specific.';
      checklist.push({
        text: 'Létání nad davem v kategorii Open',
        status: 'fail',
        actionNeeded: 'Změňte místo vzletu mimo shromáždění osob.',
      });
    } else if (answers.flyLocation === 'airport_zone') {
      canFly = 'prohibited';
      title = 'LETOVÝ PROSTOR S OMEZENÍM (CTR / ATZ LETIŠTĚ)';
      mainRecommendation = `Nacházíte se v řízeném okrsku letiště. Přelet drona je možný pouze za přísných podmínek nebo po koordinaci s ŘLP / TWR v aplikaci ${selectedCountry.officialMapApp}.`;
      checklist.push({
        text: 'Bezletová zóna letiště',
        status: 'warn',
        actionNeeded: `Nainstalujte si oficiální aplikaci ${selectedCountry.officialMapApp} a zkontrolujte povolenou výšku.`,
      });
    } else if (answers.flyLocation === 'nature_protected') {
      canFly = 'conditional';
      title = 'CHRÁNĚNÁ PŘÍRODNÍ OBLAST / NÁRODNÍ PARK';
      mainRecommendation = `V zemi ${selectedCountry.nameCz} vyžadují národní parky a rezervace předchozí povolení správy parku. Lety bez souhlasu jsou pokutovány.`;
      checklist.push({
        text: 'Povolení správy parku',
        status: 'warn',
        actionNeeded: selectedCountry.natureReserveRules,
      });
    }

    // Determine Category based on weight & marking
    if (answers.droneWeight === 'under250g') {
      category = 'A1';
    } else if (answers.droneWeight === '250g_to_900g') {
      category = 'A1';
    } else if (answers.droneWeight === '900g_to_4kg') {
      category = answers.hasClassMarking === 'C2' ? 'A2' : 'A3';
    } else {
      category = 'A3';
    }

    // Diagnostic summary
    if (canFly === 'yes' || canFly === 'conditional') {
      if (!title) {
        title = `PROVOZ POVOLEN V KATEGORII OPEN ${category}`;
        mainRecommendation = `V zemi ${selectedCountry.nameCz} můžete s vaším dronem létat do výšky max 120m AGL při dodržení níže uvedených povinností.`;
      }
    }

    // Checklist 1: Operator Reg
    if (answers.hasCamera || answers.droneWeight !== 'under250g') {
      checklist.push({
        text: `Registrace provozovatele (${selectedCountry.nameCz})`,
        status: 'pass',
        actionNeeded: `Vyžadováno číslo OAR na dronu. ${selectedCountry.operatorRegCost}`,
      });
    } else {
      checklist.push({
        text: 'Registrace provozovatele',
        status: 'pass',
        actionNeeded: 'Dron bez kamery pod 250g nevyžaduje registraci.',
      });
    }

    // Checklist 2: Pilot Exam
    if (answers.droneWeight === 'under250g') {
      checklist.push({
        text: 'Zkouška pilota',
        status: 'pass',
        actionNeeded: 'Pro drony do 249g (C0) není zkouška vyžadována.',
      });
    } else if (category === 'A1' || category === 'A3') {
      checklist.push({
        text: 'Online zkouška A1/A3',
        status: 'warn',
        actionNeeded: 'Vyžadováno složení zdarma online testu (40 otázek) u leteckého úřadu.',
      });
    } else if (category === 'A2') {
      checklist.push({
        text: 'Certifikát A2 (teorie + výcvik)',
        status: 'warn',
        actionNeeded: 'Vyžadována teoretická zkouška A2 u ÚCL pro odstup 30m od lidí.',
      });
    }

    // Checklist 3: Insurance
    if (selectedCountry.mandatoryInsurance) {
      checklist.push({
        text: `Povinné pojištění v zemi ${selectedCountry.nameCz}`,
        status: 'warn',
        actionNeeded: `POVINNÉ! ${selectedCountry.insuranceNotes}`,
      });
    } else {
      checklist.push({
        text: `Pojištění v zemi ${selectedCountry.nameCz}`,
        status: 'pass',
        actionNeeded: 'Pro C0 nepovinné, doporučeno soukromé pojištění odpovědnosti.',
      });
    }

    // Checklist 4: Geo-zone app
    checklist.push({
      text: `Zkontrolovat vzdušný prostor v ${selectedCountry.officialMapApp}`,
      status: 'pass',
      actionNeeded: `Otevřít oficiální mapu: ${selectedCountry.officialMapUrl}`,
    });

    setDiagnostic({
      category,
      canFly,
      title,
      mainRecommendation,
      checklist,
      requiredLicense: category === 'A1' && answers.droneWeight === 'under250g' ? 'Žádná' : category === 'A2' ? 'Certifikát A2' : 'Zkouška A1/A3',
      operatorRegistrationNeeded: answers.hasCamera || answers.droneWeight !== 'under250g',
      insuranceNeeded: selectedCountry.mandatoryInsurance,
      localMapToUse: {
        name: selectedCountry.officialMapApp,
        url: selectedCountry.officialMapUrl,
      },
    });
  };

  const selectedCountryObj = EU_COUNTRIES_DATA.find((c) => c.code === answers.countryCode) || EU_COUNTRIES_DATA[0];

  return (
    <div className="space-y-8 py-6 text-slate-100">
      {/* Wizard Banner */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3 uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Interaktivní diagnostický kalkulátor</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          "Mohu zde a teď létat s mojim dronem?"
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Odpovězte na 5 rychlých otázek o vašem dronu, lokaci a zemi letu. Kalkulátor okamžitě vyhodnotí legislativní kategorii EASA a národní požadavky.
        </p>
      </div>

      {/* Main Wizard Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Questions */}
        <div className="lg:col-span-7 bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Question 1: Country Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
              1. Ve které zemi hodláte létat?
            </label>
            <select
              value={answers.countryCode}
              onChange={(e) => setAnswers({ ...answers, countryCode: e.target.value })}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {EU_COUNTRIES_DATA.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flagEmoji} {c.nameCz} ({c.code}) - {c.authorityName}
                </option>
              ))}
            </select>
          </div>

          {/* Question 2: Drone Weight & Class */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
              2. Jaká je hmotnost a štítek drona?
            </label>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { id: 'under250g', marking: 'C0', label: 'Do 249g (C0 / Mini)', desc: 'DJI Mini 4 Pro, Mini 3' },
                { id: '250g_to_900g', marking: 'C1', label: '250g až 899g (C1)', desc: 'DJI Air 3' },
                { id: '900g_to_4kg', marking: 'C2', label: '900g až 4kg (C2)', desc: 'Mavic 3 Pro, Matrice' },
                { id: 'over4kg', marking: 'C3', label: 'Nad 4kg (C3 / C4)', desc: 'Těžké profi drony' },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setAnswers({ ...answers, droneWeight: w.id as any, hasClassMarking: w.marking as any })}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    answers.droneWeight === w.id
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/40'
                      : 'bg-[#0f172a] border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">{w.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{w.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Camera */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
              3. Je dron vybaven kamerou nebo snímačem osobních údajů?
            </label>
            <div className="flex space-x-3 text-xs">
              <button
                type="button"
                onClick={() => setAnswers({ ...answers, hasCamera: true })}
                className={`flex-1 p-3.5 rounded-xl border font-semibold transition ${
                  answers.hasCamera
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                    : 'bg-[#0f172a] border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Ano (Kamera / Fotoaparát / LiDAR)
              </button>
              <button
                type="button"
                onClick={() => setAnswers({ ...answers, hasCamera: false })}
                className={`flex-1 p-3.5 rounded-xl border font-semibold transition ${
                  !answers.hasCamera
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                    : 'bg-[#0f172a] border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Ne (Hračka / Čistý letecký akrobat)
              </button>
            </div>
          </div>

          {/* Question 4: Flight Location Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
              4. Kde přesně plánujete létat?
            </label>
            <div className="space-y-2 text-xs">
              {[
                { id: 'open_field', label: 'Volná příroda / pole mimo zástavbu', desc: 'Žádné budovy ani nezúčastněné osoby' },
                { id: 'suburbs_park', label: 'Městský park / Okraj obce / Zahrada', desc: 'V blízkosti zástavby s dodržením odstupů' },
                { id: 'city_crowd', label: 'Přímý přelet nad davu / shromáždění lidí', desc: 'Koncert, plný festival, přeplněná pláž' },
                { id: 'nature_protected', label: 'Národní park / Chráněná krajinná oblast', desc: 'KRNAP, Šumava, Hohe Tauern, Plitvice atd.' },
                { id: 'airport_zone', label: 'V okruhu letiště (CTR / ATZ zóna)', desc: 'V blízkosti civilního nebo vojenského letiště' },
              ].map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setAnswers({ ...answers, flyLocation: loc.id as any })}
                  className={`w-full p-3.5 rounded-xl border text-left transition ${
                    answers.flyLocation === loc.id
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/40'
                      : 'bg-[#0f172a] border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">{loc.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{loc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Calculate Button */}
          <button
            type="button"
            onClick={calculateFlightStatus}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 text-sm uppercase tracking-wider"
          >
            <ShieldCheck className="h-5 w-5" />
            <span>Vyhodnotit možnost letu</span>
          </button>

        </div>

        {/* Right Column: Diagnostic Result */}
        <div className="lg:col-span-5">
          {diagnostic ? (
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6 sticky top-24">
              
              {/* Status Header Badge */}
              <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                diagnostic.canFly === 'yes'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : diagnostic.canFly === 'conditional'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}>
                {diagnostic.canFly === 'yes' ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : diagnostic.canFly === 'conditional' ? (
                  <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">{diagnostic.title}</h3>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">{diagnostic.mainRecommendation}</p>
                </div>
              </div>

              {/* Required Checklist Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Povinnosti pilota před odletem:
                </h4>
                <div className="space-y-2 text-xs">
                  {diagnostic.checklist.map((item, idx) => (
                    <div key={idx} className="bg-[#0f172a] p-3 rounded-xl border border-slate-700 space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-white">{item.text}</span>
                        {item.status === 'pass' && <span className="text-emerald-400 font-bold">Splněno</span>}
                        {item.status === 'warn' && <span className="text-amber-400 font-bold">Vyžaduje akci</span>}
                        {item.status === 'fail' && <span className="text-rose-400 font-bold">Zákaz</span>}
                      </div>
                      {item.actionNeeded && (
                        <p className="text-[11px] text-slate-300 leading-normal">{item.actionNeeded}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Map Button */}
              <a
                href={diagnostic.localMapToUse.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 uppercase tracking-wider"
              >
                <span>Otevřít oficiální leteckou mapu {diagnostic.localMapToUse.name}</span>
                <ExternalLink className="h-4 w-4" />
              </a>

              {/* AI Help Prompt button */}
              <button
                type="button"
                onClick={() => {
                  const prompt = `Létání v zemi ${selectedCountryObj.nameCz} s dronem ${answers.droneWeight}. Kde mohu získat podrobnosti?`;
                  onAskAi(prompt);
                }}
                className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Zeptat se AI asistenta na detail k této lokaci</span>
              </button>

            </div>
          ) : (
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 text-center text-slate-400 space-y-3 sticky top-24 shadow-xl">
              <Compass className="h-12 w-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-200">Vyplňte dotazník vlevo</h4>
              <p className="text-xs leading-relaxed max-w-xs mx-auto">
                Po kliknutí na tlačítko "Vyhodnotit možnost letu" se zde zobrazí podrobná diagnóza, doporučené aplikace i kontrolní seznam.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
