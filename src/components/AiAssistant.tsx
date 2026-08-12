import React, { useState } from 'react';
import { Bot, Send, Sparkles, Loader2, User, RefreshCw, MessageSquare, ExternalLink, Globe } from 'lucide-react';

interface AiAssistantProps {
  initialPrompt?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: { title: string; url: string }[];
}

// Simple helper to render text with markdown links [label](url) and raw URLs as clickable <a> tags
const renderFormattedText = (text: string) => {
  // Replace markdown links [title](url) with placeholder token
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mdLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const label = match[1];
    const url = match[2];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-semibold transition bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30 my-0.5"
      >
        <span>{label}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
    lastIndex = mdLinkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};

export const AiAssistant: React.FC<AiAssistantProps> = ({ initialPrompt = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Dobrý den! Jsem Váš specializovaný AI asistent pro drony v EU. Čerpám z kompletní databáze EASA (2019/947), oficiálních odkazů 27 leteckých úřadů (ÚCL, Austro Control, ENAC atd.) i živého vyhladávání Google Search. Na co se chcete zeptat?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>(initialPrompt);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const PRESET_QUESTIONS = [
    'Jaké jsou přesné podmínky pro létání s DJI Mini 4 Pro v Rakousku?',
    'Potřebuji pojištění na dron do 250g v Německu a Itálii?',
    'Jaký je postup pro získání licence A2 v ČR?',
    'Jaké jsou výjimky a pravidla pro létání v noci v EU?',
    'Mohu v Chorvatsku volně natáčet moře a mořské pláže?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Nepodařilo se získat odpověď AI asistenta.');
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'Děkuji za dotaz.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI assistant error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Omlouvám se, došlo k chybě: ' + (err.message || 'Nepodařilo se spojit se serverem.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6 text-slate-100 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                EASA AI Právní Rádce
              </h2>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                <Globe className="h-3 w-3 text-cyan-400" />
                Google Search Live Grounding
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Čerpá z oficiální databáze EASA 2026, 27 leteckých úřadů EU i živého vyhledávání na internetu.
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          title="Vymazat historii konverzace"
          className="p-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700 shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Preset Question Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
          Rychlé dotazy s ověřením z webu:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-xs bg-[#1e293b] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500/50 px-3 py-1.5 rounded-xl transition text-left font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages List */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4 min-h-[400px] max-h-[550px] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0f172a] border border-slate-700 text-cyan-400'
              }`}
            >
              {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div
              className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                  : 'bg-[#0f172a] border border-slate-700 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                {renderFormattedText(msg.text)}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Globe className="h-3 w-3 text-cyan-400" />
                    Oficiální zdroje z webu (Google Grounding):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.slice(0, 4).map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 px-2 py-1 rounded-lg transition truncate max-w-[240px]"
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0 text-cyan-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`text-[10px] ${
                  msg.sender === 'user' ? 'text-blue-300 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3 text-xs text-cyan-400">
            <div className="h-8 w-8 rounded-xl bg-cyan-600/30 flex items-center justify-center animate-pulse">
              <Bot className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="flex items-center space-x-2 bg-[#0f172a] p-3 rounded-2xl border border-slate-700">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              <span>Ověřuji v legislativě EASA 2026 a prohledávám oficiální weby...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center space-x-3 bg-[#1e293b] border border-slate-700 p-2.5 rounded-2xl shadow-lg"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Zadejte váš dotaz na pravidla pro drony..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold p-2.5 rounded-xl transition shadow-md shadow-cyan-500/20 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
};
