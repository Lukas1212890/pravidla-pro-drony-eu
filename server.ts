import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { DOC_FULL_RAW_TEXT } from './src/data/googleDocData';
import { EU_COUNTRIES_DATA } from './src/data/countries';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Build official countries context for system instruction
const OFFICIAL_LINKS_CONTEXT = EU_COUNTRIES_DATA.map((c) => {
  return `Země: ${c.nameCz} (${c.code})
- Letecký úřad (NAA): ${c.authorityName} (${c.authorityWebsite})
- Oficiální mapa zón: ${c.officialMapApp} (${c.officialMapUrl})
- Registrační portál: ${c.operatorRegPortalUrl || 'N/A'} (Cena: ${c.operatorRegCost})
- Povinné pojištění: ${c.mandatoryInsurance ? 'ANO' : 'NE'} (${c.insuranceNotes})
- Max výška: ${c.maxAltitude} | Min. věk: ${c.pilotMinAge} let
- Speciální národní pravidla: ${c.uniqueNationalRules.join('; ')}
- Pokuty: ${c.penaltiesInfo}`;
}).join('\n\n');

// AI Assistant endpoint for drone regulations Q&A
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { message, countryContext, droneClass } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Chybí zpráva pro asistenta.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY není nakonfigurován. Nastavte klíč v Secrets.',
      });
    }

    const systemInstruction = `Jsi expertní AI právní asistent a znalec legislativy létání s drony v Evropě (EASA 2026 i národní zákony).

ZDROJE ZNALOSTÍ:
- Tvá vlastní expertní znalostní báze evropského i národního leteckého práva.
- Oficiální strukturovaná databáze 27 zemí EU (letecké úřady, registrační portály, mapové aplikace):
---------------------------------------------------------------------
${OFFICIAL_LINKS_CONTEXT}
---------------------------------------------------------------------
- Dokumenty a legislativní směrnice EASA/EU:
---------------------------------------------------------------------
${DOC_FULL_RAW_TEXT.slice(0, 30000)}
---------------------------------------------------------------------

PRAVIDLA PRO ODPOVÍDÁNÍ:
1. Odpovídáš VŽDY jako přímý expertní poradce. ZÁKAZ METAFRÁZÍ: Zásadně NIKDY neříkej fráze jako "V přiloženém průvodci není...", "V dokumentu se neuvádí..." nebo "Podle přiloženého textu...". Pro uživatele vystupuješ jako integrovaný systém.
2. Pokud konkrétní detail (např. přesný historický rok vyhlášky, název zákona či přesný parametr) není v rychlém přehledu, aktivně použij vyhledávač (Google Search Grounding) na oficiálních úředních webech a odpovídej přímo.
3. VŠECHNY NEÚŘEDNÍ ZDROJE (diskusní fóra, Reddit, Facebook skupiny, blogy) ZÁSADNĚ IGNORUJ.
4. Pokud se dotaz týká konkrétní země (${countryContext || 'Libovolná země EU'}), VŽDY přímo v textu i na konci odpovědi uveď přímé funkční odkazy na:
   - Oficiální letecký úřad (NAA)
   - Oficiální interaktivní dronovou mapu zón
   - Registrační portál (je-li k dispozici)
5. Odpověď strukturuj přehledně, věcně a v češtině (používej odrážky a tučné zvýraznění).`;

    const prompt = `Otázka uživatele: ${message}`;

    let replyText = '';
    let webSources: { title: string; url: string }[] = [];

    const MODELS_TO_TRY = ['gemini-3.6-flash', 'gemini-3.1-flash-lite'];
    const forbidden = [
      'reddit.com', 'forum', 'facebook.com', 'twitter.com', 'x.com',
      'youtube.com', 'quora.com', 'medium.com', 'blogspot.com', 'wordpress.com',
      'discord.com', 'instagram.com', 'tiktok.com'
    ];

    for (const modelName of MODELS_TO_TRY) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
            tools: [{ googleSearch: {} }],
          },
        });

        if (response && response.text) {
          replyText = response.text;
          const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          webSources = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri)
            .filter((web: any) => !forbidden.some(f => web.uri.toLowerCase().includes(f.toLowerCase())))
            .map((web: any) => ({ title: web.title || web.uri, url: web.uri }));
          break;
        }
      } catch (errWithTools: any) {
        console.warn(`Model ${modelName} with tools failed (${errWithTools?.message}), trying without tools...`);
        try {
          const responseNoTools = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2,
            },
          });
          if (responseNoTools && responseNoTools.text) {
            replyText = responseNoTools.text;
            break;
          }
        } catch (errNoTools: any) {
          console.warn(`Model ${modelName} without tools failed (${errNoTools?.message}).`);
        }
      }
    }

    // Helper for robust country matching by stem / name
    const findCountryFromText = (text: string) => {
      const lower = text.toLowerCase();
      return EU_COUNTRIES_DATA.find((c) => {
        const czStem = c.nameCz.toLowerCase().replace(/(o|a|e|ie)$/, '');
        if (czStem.length >= 4 && lower.includes(czStem)) return true;
        if (lower.includes(c.nameCz.toLowerCase())) return true;
        if (lower.includes(c.nameEn.toLowerCase())) return true;
        return new RegExp(`\\b${c.code.toLowerCase()}\\b`, 'i').test(lower);
      });
    };

    // Fallback if model calls encounter rate limits
    if (!replyText) {
      const matchedCountry = findCountryFromText(message);

      if (matchedCountry) {
        replyText = `### ${matchedCountry.flagEmoji} ${matchedCountry.nameCz} – Ověřená pravidla a legislativní pojištění:\n\n` +
          `* **Letecký úřad (NAA):** ${matchedCountry.authorityName}\n` +
          `* **Maximální výška letu:** ${matchedCountry.maxAltitude}\n` +
          `* **Minimální věk pilota:** ${matchedCountry.pilotMinAge} let\n` +
          `* **Povinné pojištění:** ${matchedCountry.mandatoryInsurance ? 'ANO (povinné pro všechny drony)' : 'NE (doporučeno pro Open)'} – ${matchedCountry.insuranceNotes}\n` +
          `* **Registrace:** ${matchedCountry.operatorRegCost}\n` +
          `* **Klíčové národní předpisy:**\n` +
          matchedCountry.uniqueNationalRules.map(r => `  - ${r}`).join('\n');
      } else {
        replyText = `### Ověřené legislativní informace EASA (Kategorie Open A1–A3):\n\n` +
          `Podle nařízení EU 2019/947 a pravidel EASA platí v celém Evropském hospodářském prostoru:\n\n` +
          `* **Maximální výška letu:** 120 m AGL (nad povrchem země).\n` +
          `* **Minimální věk:** 16 let (členské státy mohou upravit na 12–16 let).\n` +
          `* **Registrace:** Povinná pro všechny drony nad 250 g nebo drony s kamerou. Registrační číslo vydané v ČR (např. CZE...) platí v celé EU.\n` +
          `* **Pojištění:** V ČR nepovinné pro Open A1/A3; povinné v Rakousku (od r. 2014), Německu a Itálii.\n` +
          `* **Odkazy na úřady:** Naleznete níže pod odpovědí.`;
      }
    }

    // Match country sources
    const combinedSourcesMap = new Map<string, { title: string; url: string }>();
    webSources.forEach(s => combinedSourcesMap.set(s.url, s));

    const searchHaystack = (message + ' ' + replyText).toLowerCase();
    EU_COUNTRIES_DATA.forEach((country) => {
      const isMentioned =
        searchHaystack.includes(country.nameCz.toLowerCase()) ||
        searchHaystack.includes(country.nameEn.toLowerCase()) ||
        searchHaystack.includes(` ${country.code.toLowerCase()} `);

      if (isMentioned) {
        if (country.authorityWebsite) {
          combinedSourcesMap.set(country.authorityWebsite, {
            title: `Letecký úřad ${country.nameCz} (${country.authorityName})`,
            url: country.authorityWebsite,
          });
        }
        if (country.officialMapUrl) {
          combinedSourcesMap.set(country.officialMapUrl, {
            title: `Mapa letových zón (${country.officialMapApp})`,
            url: country.officialMapUrl,
          });
        }
        if (country.operatorRegPortalUrl) {
          combinedSourcesMap.set(country.operatorRegPortalUrl, {
            title: `Registrační portál ${country.nameCz}`,
            url: country.operatorRegPortalUrl,
          });
        }
      }
    });

    if (combinedSourcesMap.size === 0) {
      combinedSourcesMap.set('https://www.easa.europa.eu/en/domains/civil-drones', {
        title: 'Oficiální portál EASA pro drony (EU)',
        url: 'https://www.easa.europa.eu/en/domains/civil-drones',
      });
    }

    return res.json({
      reply: replyText,
      sources: Array.from(combinedSourcesMap.values()),
    });
  } catch (error: any) {
    console.error('Error in /api/ai-assistant:', error);
    return res.json({
      reply: '⚠️ **Služba AI je na okamžik vytížena.** Zkuste prosím zopakovat dotaz za 1 minutu, nebo si prohlédněte pravidla přímo v záložce **Přehled zemí**.',
      sources: [
        { title: 'Evropská agentura EASA (Drony)', url: 'https://www.easa.europa.eu/en/domains/civil-drones' },
        { title: 'Úřad pro civilní letectví ČR (ÚCL)', url: 'https://dron.caa.cz' }
      ]
    });
  }
});

// Analyze uploaded/pasted Word document content
app.post('/api/analyze-doc', async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: 'Chybí text dokumentu.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY není nakonfigurován v Secrets.',
      });
    }

    const systemInstruction = `Jsi specialista na právní normy pro drony v EU. Obdržel jsi text extrahovaný z Word dokumentu s pravidly nebo směrnicemi pro létání s drony.
Analyzuj tento dokument a vytvoř strukturovaný přehled pravidel ve formátu JSON obsahující klíčové body:
- title: Název nebo popis dokumentu
- summary: Stručné shrnutí (2-3 věty)
- categories: Pole kategorií (např. ["Open A1", "Open A2", "Nářadí / Komereční"])
- keyRules: Pole klíčových pravidel (objekty s: title, description, ruleType ['mandatory'|'warning'|'info'], applyTo ['C0'|'C1'|'C2'|'C3'|'All'])
- countryNotes: Poznámky specifické pro jednotlivé země, pokud v dokumentu jsou.
- warnings: Důležitá varování nebo zákazové zóny.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Text k analýze z Word dokumentu:\n\n${documentText.slice(0, 15000)}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      parsedData = { rawText: jsonText };
    }

    return res.json({
      success: true,
      analysis: parsedData,
      rawTextLength: documentText.length,
    });
  } catch (error: any) {
    console.error('Error in /api/analyze-doc:', error);
    return res.status(500).json({
      error: 'Chyba při zpracování dokumentu: ' + (error.message || 'Neznámá chyba'),
    });
  }
});

// Start Express server with Vite in dev, static in prod
async function start() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint nebyl nalezen' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server běžebně nasazen na portu ${PORT}`);
  });
}

start();
