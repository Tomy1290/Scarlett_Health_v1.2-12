import { buildCompactSummary } from './summary';
import { apiFetch } from '../utils/api';
import type { AppState } from '../store/useStore';

// Types aligned with backend /api/chat
export type ChatMessage = { role: 'system'|'user'|'assistant'; content: string };
export type ChatMode = 'greeting'|'chat';

async function callBackendChat(req: {
  mode: ChatMode;
  language: 'de'|'en'|'pl';
  model?: string;
  summary?: any;
  messages?: ChatMessage[];
}): Promise<string> {
  const res = await apiFetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`AI backend ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return String(data?.text || data?.response || '').trim();
}

export async function onlineGreeting(state: AppState) {
  const lang = (state.language || 'de') as 'de'|'en'|'pl';
  const summary = buildCompactSummary(state);
  return await callBackendChat({
    mode: 'greeting',
    language: lang,
    model: 'gpt-4o-mini',
    summary,
  });
}

export async function onlineReply(state: AppState, userText: string) {
  const lang = (state.language || 'de') as 'de'|'en'|'pl';
  const summary = buildCompactSummary(state);
  const recent = (state.chat||[]).slice(-8).map(m => ({ role: m.sender==='user'?'user':'assistant', content: m.text })) as ChatMessage[];
  const messages: ChatMessage[] = [...recent, { role: 'user', content: userText }];
  return await callBackendChat({
    mode: 'chat',
    language: lang,
    model: 'gpt-4o-mini',
    summary,
    messages,
  });
}

export async function onlineTopic(state: AppState, topic: 'cycle'|'weight'|'sleep'|'hydration'|'reminders') {
  const lang = (state.language || 'de') as 'de'|'en'|'pl';
  const summary = buildCompactSummary(state);
  const messages: ChatMessage[] = [
    { role: 'user', content: (lang==='de'
      ? `Kurze Erklärung (max 6 Sätze) + 3 praktische Tipps zum Thema "${topic}" – personalisiert nach summary.`
      : lang==='pl'
      ? `Krótkie wyjaśnienie (max 6 zdań) + 3 praktyczne wskazówki o "${topic}" – personalizuj na podstawie podsumowania.`
      : `Short explainer (max 6 sentences) + 3 practical tips about "${topic}" – personalize using summary.`) }
  ];
  return await callBackendChat({ mode: 'chat', language: lang, model: 'gpt-4o-mini', summary, messages });
}

export async function onlineAnalysis(state: AppState) {
  const lang = (state.language || 'de') as 'de'|'en'|'pl';
  const summary = buildCompactSummary(state);
  const prompt = (lang==='de'
    ? `Analysiere die letzten Einträge und gib: 1) kurze Zusammenfassung (2–3 Sätze), 2) 4 konkrete Handlungstipps, 3) optional Mini‑Prognose. Nutze Zahlen aus der summary.`
    : lang==='pl'
    ? `Przeanalizuj ostatnie wpisy i podaj: 1) krótkie podsumowanie (2–3 zdania), 2) 4 konkretne wskazówki, 3) opcjonalnie mini prognozę. Użyj liczb z podsumowania.`
    : `Analyze recent entries and provide: 1) short summary (2–3 sentences), 2) 4 action tips, 3) optional mini forecast. Use numbers from the summary.`);
  return await callBackendChat({
    mode: 'chat',
    language: lang,
    model: 'gpt-4o-mini',
    summary,
    messages: [{ role: 'user', content: prompt }],
  });
}