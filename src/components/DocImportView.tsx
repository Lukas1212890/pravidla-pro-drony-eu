import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { DocAnalysisResult } from '../types';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Copy, 
  Download, 
  FileCheck, 
  Loader2,
  Trash2,
  BookmarkPlus,
  Search,
  ExternalLink,
  LogOut,
  RefreshCw,
  FolderOpen,
  Link,
  Globe
} from 'lucide-react';
import { initAuth, googleSignIn, logout as googleLogout } from '../lib/firebaseAuth';
import { searchDriveFiles, fetchGoogleDocContent, GoogleDriveFile } from '../lib/googleDriveService';
import { User } from 'firebase/auth';

interface DocImportViewProps {
  onAskAi: (prompt: string) => void;
}

const SAMPLE_WORD_DOC_TEXT = `EASA LEGISLATIVNÍ SMĚRNICE A NÁRODNÍ SPECIFIKA PRO DRONY 2026

1. VŠEOBECNÁ PRAVIDLA PRO KATEGORII OPEN (EASA)
- Provozovatelé dronů vybavených kamerou nebo snímačem osobních údajů podléhají povinné registraci na národním portálu leteckého úřadu (v ČR portál ÚCL, v Austria Dronespace, v Německu LBA).
- Registrační číslo provozovatele (OAR) musí být viditelně vylepeno na konstrukci dronu a zadáno do vysílače Remote ID.
- Maximální výška letu v kategorii Open je stanovena na 120 metrů nad zemí (AGL).
- Lety v noci jsou v EU povoleny za předpokladu, že je dron vybaven zeleným polohovým zábleskovým světlem viditelným ze všech stran.

2. SPECIFICKÁ NÁRODNÍ PRAVIDLA
- RAKOUSKO (Austria): Rakouský letecký zákon (LFG) vyžaduje povinné pojištění odpovědnosti pro VŠECHNY drony bez výjimky (včetně třídy C0 a vah pod 250g). Před každým vzletem je nutné zkontrolovat aplikaci Austro Control Dronespace. Pokuty za neregistrovaný let mohou dosáhnout až 22 000 EUR.
- FRANCIE: Platí přísný plošný zákaz létání v noci pro rekreační kategorii Open. Dále je zakázán přelet nad jakýmikoliv městskými zastavěnými oblastmi (agglomérations) bez povolení DGAC.
- ITÁLIE: Pojištění je povinné pro všechny drony vč. C0 na portálu D-Flight. Zákaz létání nad přeplněnými plážemi v letní sezóně.
- POLSKO: Povinnost udělat Check-in v aplikaci DroneTower před každým vzletem drona.
- CHORVATSKO: Národní parky (Plitvická jezera, Krka) mají plošný zákaz drony bez písemného souhlasu správy parku.

3. DOPORUČENÁ BEZPEČNOSTNÍ OPATŘENÍ
- Vždy udržujte dron v přímém vizuálním dohledu (VLOS). Létání s FPV brýlemi vyžaduje přítomnost poučeného pozorovatele stojícího po boku pilota.
- Při letu v blízkosti letišť ověřte dočasně vyhrazené prostory v oficiální aplikaci státu.`;

export const DocImportView: React.FC<DocImportViewProps> = ({ onAskAi }) => {
  const [docText, setDocText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DocAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedRules, setSavedRules] = useState<boolean>(false);

  // Google OAuth & Drive State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingDrive, setIsSearchingDrive] = useState<boolean>(false);
  const [googleDocUrlInput, setGoogleDocUrlInput] = useState<string>('https://docs.google.com/document/d/1sJNKLIigYouYFGFRSD0kb-jm4PKcEVyy/edit?usp=drive_link');
  const [isFetchingGoogleDoc, setIsFetchingGoogleDoc] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'googleDrive'>('googleDrive');

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        loadDriveFiles(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage('');
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        await loadDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMessage('Nepodařilo se přihlásit k účtu Google: ' + (err.message || 'Chyba přihlášení'));
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Google Sign-out
  const handleGoogleSignOut = async () => {
    await googleLogout();
    setUser(null);
    setAccessToken(null);
    setDriveFiles([]);
  };

  // Load files from Google Drive
  const loadDriveFiles = async (token: string, search: string = '') => {
    setIsSearchingDrive(true);
    setErrorMessage('');
    try {
      const files = await searchDriveFiles(token, search);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error listing Drive files:', err);
      setErrorMessage('Chyba při načítání souborů z Google Disku: ' + err.message);
    } finally {
      setIsSearchingDrive(false);
    }
  };

  // Fetch document from Google Drive or Google Docs URL
  const handleImportGoogleDoc = async (fileIdOrUrl: string, customTitle?: string) => {
    if (!accessToken) {
      setErrorMessage('Pro načtení dokumentu z Google Disku se prosím nejprve přihlaste svým Google účtem.');
      return;
    }

    setIsFetchingGoogleDoc(true);
    setErrorMessage('');

    try {
      const { title, text } = await fetchGoogleDocContent(accessToken, fileIdOrUrl);
      const displayTitle = customTitle || title || 'Google Dokument s pravidly';
      setFileName(displayTitle);
      setDocText(text);

      // Trigger automatic AI analysis for seamless flow
      await triggerAiAnalysis(text, displayTitle);
    } catch (err: any) {
      console.error('Error fetching Google Doc:', err);
      setErrorMessage('Nepodařilo se načíst dokument z Google Disku: ' + err.message);
    } finally {
      setIsFetchingGoogleDoc(false);
    }
  };

  // Helper function for AI Analysis
  const triggerAiAnalysis = async (textToAnalyze: string, docName: string) => {
    if (!textToAnalyze.trim()) {
      setErrorMessage('Dokument je prázdný.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/analyze-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: textToAnalyze }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Chyba při analýze dokumentu.');
      }

      setAnalysisResult({
        ...data.analysis,
        title: data.analysis?.title || docName,
        importedAt: new Date().toLocaleDateString('cs-CZ'),
      });
    } catch (err: any) {
      console.error('Error analyzing document:', err);
      setErrorMessage('Nepodařilo se zpracovat dokument pomocí AI: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle file drop or upload (.docx, .txt)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage('');
    setIsLoadingFile(true);

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setDocText(result.value);
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setDocText(text);
      } else {
        setErrorMessage('Podporovány jsou soubory typu .docx (Microsoft Word) nebo .txt.');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage('Chyba při čtení souboru: ' + (err.message || 'Nepodařilo se přečíst dokument Word.'));
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Load sample document text
  const loadSampleDoc = () => {
    setFileName('EASA_Smernice_Drony_2026.docx');
    setDocText(SAMPLE_WORD_DOC_TEXT);
    setErrorMessage('');
  };

  // Trigger AI document analysis via backend Express API
  const handleAnalyzeDocument = async () => {
    if (!docText.trim()) {
      setErrorMessage('Nejdříve vložte nebo nahrajte text dokumentu.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/analyze-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: docText }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Chyba při analýze dokumentu.');
      }

      setAnalysisResult({
        ...data.analysis,
        importedAt: new Date().toLocaleDateString('cs-CZ'),
      });
    } catch (err: any) {
      console.error('Error analyzing document:', err);
      setErrorMessage('Nepodařilo se zpracovat dokument pomocí AI: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 py-6 text-slate-100">
      
      {/* Hero Banner */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3 uppercase tracking-wider">
          <FileText className="h-3.5 w-3.5" />
          <span>Import a AI Extrakce z Wordu (.docx)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Nahrát vlastní dokument s pravidly
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Máte vlastní Word dokument (.docx) s pravidly pro drony, směrnicí nebo poznámkami? Nahrajte ho nebo vložte text. Naše AI z něj automaticky vytáhne strukturovaný přehled pravidel, povinností a zón.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Import Options (Google Drive / Word File) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Import Method Tabs */}
          <div className="bg-[#1e293b] p-1.5 rounded-2xl border border-slate-700 grid grid-cols-2 gap-2 shadow-lg">
            <button
              onClick={() => setActiveTab('googleDrive')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'googleDrive'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Google Drive / Docs</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Soubor Word (.docx) / Text</span>
            </button>
          </div>

          {/* TAB 1: Google Drive & Google Docs */}
          {activeTab === 'googleDrive' && (
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    Google Drive a Google Docs
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Importujte pravidla z vašeho dokumentu v notebooku Google.
                  </p>
                </div>

                {user && (
                  <button
                    onClick={handleGoogleSignOut}
                    title="Odhlásit z Google"
                    className="text-xs text-slate-400 hover:text-rose-400 p-2 bg-[#0f172a] rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Odhlásit</span>
                  </button>
                )}
              </div>

              {/* Google Authentication Box if not signed in */}
              {!user ? (
                <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Připojit k účtu Google</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      Přihlaste se svým účtem Google pro přístup k vašim dokumentům s pravidly na Google Disku a Google Docs.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSigningIn}
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-3 text-xs disabled:opacity-50"
                  >
                    {isSigningIn ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
                        <span>Přihlašování...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span className="text-slate-800 font-extrabold">Přihlásit se přes Google</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Authenticated Google Section */
                <div className="space-y-5">
                  {/* User Profile Badge */}
                  <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-blue-500" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                          {user.email?.[0].toUpperCase() || 'G'}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-white block">{user.displayName || 'Google Uživatel'}</span>
                        <span className="text-slate-400 text-[11px]">{user.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-2 py-0.5 rounded">
                      Připojeno k Disku
                    </span>
                  </div>

                  {/* Option A: Paste Google Doc Link */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Link className="h-3.5 w-3.5 text-blue-400" />
                      Vložit odkazu na Google Dokument nebo soubor na Disku:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={googleDocUrlInput}
                        onChange={(e) => setGoogleDocUrlInput(e.target.value)}
                        placeholder="https://docs.google.com/document/d/... nebo ID souboru"
                        className="flex-1 bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isFetchingGoogleDoc || !googleDocUrlInput.trim()}
                        onClick={() => handleImportGoogleDoc(googleDocUrlInput)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isFetchingGoogleDoc ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span>Načíst</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Option B: Search Drive Files */}
                  <div className="space-y-3 pt-2 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <FolderOpen className="h-4 w-4 text-blue-400" />
                        Vyhledat v dokumentech na vašem Google Disku:
                      </label>
                      <button
                        type="button"
                        onClick={() => loadDriveFiles(accessToken, searchQuery)}
                        className="text-slate-400 hover:text-white p-1 transition"
                        title="Obnovit seznam"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSearchingDrive ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          loadDriveFiles(accessToken, e.target.value);
                        }}
                        placeholder="Hledat podle názvu (např. pravidla, dron...)"
                        className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Drive File List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {isSearchingDrive ? (
                        <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-400" />
                          <span>Prohledávám váš Google Disk...</span>
                        </div>
                      ) : driveFiles.length > 0 ? (
                        driveFiles.map((file) => (
                          <div
                            key={file.id}
                            className="bg-[#0f172a] hover:bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-3 transition"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                <span className="text-xs font-bold text-white truncate">{file.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Upraveno: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('cs-CZ') : 'Neznámé'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Otevřít v Google Docs"
                                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                disabled={isFetchingGoogleDoc}
                                onClick={() => handleImportGoogleDoc(file.id, file.name)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
                              >
                                Importovat
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400 bg-[#0f172a] rounded-xl border border-slate-800">
                          Žádné dokumenty s tímto názvem na Disku nebyly nalezeny.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: Local Word (.docx) Upload */}
          {activeTab === 'upload' && (
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Nahrát Word dokument (.docx)
                </h3>

                <button
                  type="button"
                  onClick={loadSampleDoc}
                  className="text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl transition font-medium"
                >
                  Ukázkový dokument
                </button>
              </div>

              {/* Dropzone Container */}
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 bg-[#0f172a] rounded-xl p-6 text-center transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".docx,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <FileText className="h-10 w-10 text-blue-400 mx-auto" />
                  <div className="text-sm font-semibold text-white">
                    {fileName ? (
                      <span className="text-blue-300">{fileName}</span>
                    ) : (
                      <span>Přetahněte soubor .docx sem nebo klikněte pro výběr</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Podporované formáty: Microsoft Word (.docx), text (.txt)</p>
                </div>
              </div>

              {isLoadingFile && (
                <div className="flex items-center justify-center space-x-2 text-xs text-blue-400 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Načítám text z Wordu...</span>
                </div>
              )}

              {/* Textarea for Manual Paste / Edit */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Nebo vložte/upravte text dokumentu přímo zde:
                </label>
                <textarea
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  placeholder="Vložte text z vašeho dokumentu..."
                  rows={8}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-950/50 border border-rose-500/50 p-3 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Trigger AI analysis manually if docText is present */}
          {docText && (
            <button
              type="button"
              disabled={isAnalyzing || !docText.trim()}
              onClick={() => triggerAiAnalysis(docText, fileName || 'Importovaný dokument')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI provádí právní analýzu dokumentu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Spustit AI analýzu dokumentu</span>
                </>
              )}
            </button>
          )}

        </div>

        {/* Right Column: AI Analysis Result */}
        <div className="lg:col-span-6">
          {analysisResult ? (
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6">
              
              {/* Document Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded border border-blue-800">
                    Extrahováno z dokumentu
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-2">
                    {analysisResult.title || 'Extrahovaná pravidla dronařství'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{analysisResult.summary}</p>
                </div>

                <button
                  onClick={() => setSavedRules(true)}
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                    savedRules
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  <BookmarkPlus className="h-4 w-4" />
                  <span>{savedRules ? 'Uloženo!' : 'Uložit pravidla'}</span>
                </button>
              </div>

              {/* Extracted Categories Badges */}
              {analysisResult.categories && analysisResult.categories.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dotčené kategorie:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.categories.map((cat, i) => (
                      <span key={i} className="text-xs bg-[#0f172a] text-blue-300 border border-slate-700 px-2.5 py-1 rounded-lg">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Key Rules List */}
              {analysisResult.keyRules && analysisResult.keyRules.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Extrahovaná pravidla ({analysisResult.keyRules.length}):
                  </h4>
                  <div className="space-y-2 text-xs">
                    {analysisResult.keyRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border space-y-1 ${
                          rule.ruleType === 'mandatory'
                            ? 'bg-amber-950/30 border-amber-500/40'
                            : rule.ruleType === 'warning'
                            ? 'bg-rose-950/30 border-rose-500/40'
                            : 'bg-[#0f172a] border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-white">
                          <span className="flex items-center gap-2">
                            {rule.ruleType === 'mandatory' ? (
                              <CheckCircle2 className="h-4 w-4 text-amber-400" />
                            ) : rule.ruleType === 'warning' ? (
                              <AlertTriangle className="h-4 w-4 text-rose-400" />
                            ) : (
                              <Info className="h-4 w-4 text-blue-400" />
                            )}
                            {rule.title}
                          </span>
                          {rule.applyTo && (
                            <span className="text-[10px] bg-[#0f172a] text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                              Platí pro: {rule.applyTo}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed pl-6">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Ask AI for Follow-up */}
              <button
                type="button"
                onClick={() => {
                  const prompt = `Mám následující pravidla z mého dokumentu: ${analysisResult.summary}. Můžeš mi vysvětlit, jak tyto pravidla zohlednit v praxi?`;
                  onAskAi(prompt);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/20 uppercase tracking-wider"
              >
                <Sparkles className="h-4 w-4" />
                <span>Položit AI asistentovi doplňující otázku k tomuto dokumentu</span>
              </button>

            </div>
          ) : (
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 text-center text-slate-400 space-y-3 shadow-xl">
              <FileCheck className="h-12 w-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-200">Zatím nebyly extrahovány žádné údaje</h4>
              <p className="text-xs leading-relaxed max-w-xs mx-auto">
                Nahrajte nebo vložte text dokumentu ve Wordu vlevo a klikněte na "Spustit AI analýzu Word dokumentu".
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
