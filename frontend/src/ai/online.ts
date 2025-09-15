import Constants from 'expo-constants';
import { AppState } from '../store/useStore';
import { buildCompactSummary } from './summary';

function getKey() {
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_EMERGENT_LLM_KEY ||
         (typeof process !== 'undefined' ? (process as any).env?.EXPO_PUBLIC_EMERGENT_LLM_KEY : null);
}

async function callChat(messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>, opts?: { maxTokens?: number; temperature?: number; model?: string }) {
  const key = getKey();
  if (!key) throw new Error('Missing Emergent LLM key');
  const body = {
    model: opts?.model || 'gpt-4o-mini',
    messages,
    max_tokens: opts?.maxTokens ?? 300,
    temperature: opts?.temperature ?? 0.4,
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content || '';
  return String(out).trim();
}

function sysPrompt(lang: 'de'|'en'|'pl') {
  if (lang==='de') return 'Du bist Gugi, ein empathischer Gesundheitscoach. Antworte präzise, freundlich, in kurzen Absätzen. Nutze Stichpunkte nur wenn sinnvoll. Sprich Deutsch.';
  if (lang==='pl') return 'Jesteś Gugi, empatycznym trenerem zdrowia. Odpowiadaj precyzyjnie i krótko. Pisz po polsku.';
  return 'You are Gugi, an empathetic health coach. Reply concisely in short paragraphs. Write English.';
}

export async function onlineGreeting(state: AppState) {
  const lang = (state.language || 'de') as 'de'|'en'|'pl';
  const summary = buildCompactSummary(state);
  const messages = [
    { role: 'system' as const, content: sysPrompt(lang) },
    { role: 'user' as const, content: lang==='de'
      ? `Begrüße mich freundlich als Gesundheitscoach basierend auf meinen Daten. Erzeuge 2 kurze Sätze + 2 punktuelle Hinweise. Daten:
${JSON.stringify(summary)}`
      : lang==='pl'
      ? `Przywitaj mnie przyjaźnie jako trener zdrowia, bazując na moich danych. Daj 2 krótkie zdania + 2 punktowe wskazówki. Dane:
${JSON.stringify(summary)}`
      : `Greet me friendly as a health coach based on my data. Provide 2 short sentences + 2 bullet hints. Data:
${JSON.stringify(summary)}` }
  ];
  return await callChat(messages, { maxTokens: 280 });
}

export async function onlineReply(state: AppState, userText: string) {
  const lang = (state.language || 'de') as 'de'|'en'|'pl';
  const summary = buildCompactSummary(state);
  const recent = (state.chat||[]).slice(-8).map(m => ({ role: m.sender==='user'?'user':'assistant', content: m.text })) as any[];
  const messages = [
    { role: 'system' as const, content: sysPrompt(lang) },
    { role: 'user' as const, content: (lang==='de'?
      `Kontext (kondensiert): ${JSON.stringify(summary)}
Nutzerverlauf: ${JSON.stringify(recent)}
Aktuelle Nachricht: ${userText}
Antworte konkret, kurz, hilfreich. Wenn nach Rezepten gefragt wird, gib 5 Vorschläge mit Titel und 1‑Satz‑Beschreibung.`
      : lang==='pl'?
      `Kontekst (skrócony): ${JSON.stringify(summary)}
Historia użytkownika: ${JSON.stringify(recent)}
Aktualna wiadomość: ${userText}
Odpowiadaj krótko i konkretnie. Jeśli są pytania o przepisy, podaj 5 propozycji z tytułem i 1‑zdaniowym opisem.`
      :
      `Context (condensed): ${JSON.stringify(summary)}
User history: ${JSON.stringify(recent)}
Current message: ${userText}
Reply short and helpful. If asking for recipes, provide 5 suggestions with title and 1‑sentence description.`) }
  ];
  return await callChat(messages, { maxTokens: 320 });
}

export async function onlineTopic(state: AppState, topic: 'cycle'|'weight'|'sleep'|'hydration'|'reminders') {
  const lang = (state.language || 'de') as 'de'|'en'|'pl';
  const summary = buildCompactSummary(state);
  const messages = [
    { role: 'system' as const, content: sysPrompt(lang) },
    { role: 'user' as const, content: (lang==='de'?
      `Gib mir eine kurze Erklärung (max. 6 Sätze) und 3 praktische Tipps zum Thema "${topic}". Personalisieren, falls sinnvoll. Daten:
${JSON.stringify(summary)}`
      : lang==='pl'?
      `Daj krótkie wyjaśnienie (max 6 zdań) i 3 praktyczne wskazówki na temat "${topic}". Personalizuj jeśli sensowne. Dane:
${JSON.stringify(summary)}`
      :
      `Give a short explanation (max 6 sentences) and 3 practical tips about "${topic}". Personalize where useful. Data:
${JSON.stringify(summary)}`) }
  ];
  return await callChat(messages, { maxTokens: 320 });
}

export async function onlineAnalysis(state: AppState) {
  const lang = (state.language || 'de') as 'de'|'en'|'pl';
  const summary = buildCompactSummary(state);
  const messages = [
    { role: 'system' as const, content: sysPrompt(lang) },
    { role: 'user' as const, content: (lang==='de'?
      `Analysiere die letzten Einträge und gib: 1) kurze Zusammenfassung (2‑3 Sätze), 2) 4 konkrete Handlungstipps, 3) optional eine Mini‑Prognose. Nutze Zahlen aus den Daten wo sinnvoll.
Daten:
${JSON.stringify(summary)}`
      : lang==='pl'?
      `Przeanalizuj ostatnie wpisy i podaj: 1) krótkie podsumowanie (2‑3 zdania), 2) 4 konkretne wskazówki, 3) opcjonalnie mini prognozę. Użyj liczb z danych gdy ma sens.
Dane:
${JSON.stringify(summary)}`
      :
      `Analyze recent entries and provide: 1) short summary (2‑3 sentences), 2) 4 concrete action tips, 3) optional mini forecast. Use numbers from data where helpful.
Data:
${JSON.stringify(summary)}`) }
  ];
  return await callChat(messages, { maxTokens: 380 });
}