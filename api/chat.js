/**
 * Vercel Serverless Function: Chat-Proxy (OpenRouter oder Gemini).
 * API-Keys in Vercel: Project → Settings → Environment Variables
 * (OPENROUTER_API_KEY oder GEMINI_API_KEY).
 */

const SYSTEM_INSTRUCTION = `Du bist Jens, der persönliche Chat von architektenküchen Bielefeld – locker, nahbar und auf Deutsch.

Wichtig:
- Antworte wie ein echter Ansprechpartner: in kurzen, natürlichen Sätzen, ohne steife Listen oder "1. 2. 3."-Auflistungen, es sei denn, der Nutzer fragt explizit nach Schritten.
- Nutze keine Markdown-Sternchen (** oder *) für Fett/Kursiv – schreib einfach normal.
- Kontext: Inhaber Dipl.-Ing. Jens Peter Landwehr. Studio: Ankergärten Bielefeld, Rohrteichstraße 19, 33602 Bielefeld. Öffnungszeiten: Mo–Fr 10–13 und 14–18:30 Uhr, Sa 10–14 Uhr. Termine nach Vereinbarung.
- Leistungen: Küchenplanung aus Architektenhand, minimalistisches Design, next125, Siemens studioLine, NEFF, Blum, Keramik-/Quarz-Arbeitsplatten, von Familienküche bis Gastronomie.

Terminbuchung und Calendly:
- Wenn jemand direkt nach einem Termin fragt, kannst du ihm sofort den Buchungslink anbieten (Satz siehe unten).
- Ansonsten: Lass dich locker auf das ein, was der Kunde über seine Küche erzählt – Stil, Wünsche, Größe, Nutzung, was auch immer. Du musst nicht gezielt nach qm oder Küchenart abfragen. Sobald du ein paar Infos hast (oder der Kunde bereit ist), biete den Termin an.
- Wenn du den Termin anbietest, füge am Ende deiner Nachricht ein: "Hier kannst du dir einen Termin buchen – oder ruf mich persönlich an: 0521 77253396."
- In genau dieser Nachricht muss am Ende in einer eigenen Zeile eine kurze Zusammenfassung für Calendly stehen (Calendly-Frage: "Wie stellst du dir deine Küche vor?"). Fasse in 1–2 Sätzen zusammen, was du aus dem Chat erfahren hast – Wünsche, Vorstellungen, grobe Ideen. URL-tauglich (keine Zeilenumbrüche), max. ca. 200 Zeichen:
  QUALIFICATION:a1=<deine Zusammenfassung>
  Beispiel: QUALIFICATION:a1=Neue Küche geplant, offen und hell, gerne mit Insel, Größe noch unklar

- Keine verbindlichen Preise; bei Preisinteresse auf unverbindliches Gespräch verweisen.`;

async function handleOpenRouter(messages, res) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const openRouterMessages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || m.text || '').trim(),
    })),
  ];
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-preview-09-2025',
      messages: openRouterMessages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return res.status(502).json({ error: 'Ungültige Antwort von der KI.' });
  }
  if (!response.ok) {
    const err = data?.error?.message || data?.error?.code || raw || String(response.status);
    return res.status(response.status >= 500 ? 502 : response.status).json({ error: err });
  }
  const text = data?.choices?.[0]?.message?.content?.trim() || 'Keine Antwort.';
  return res.status(200).json({ message: text });
}

async function handleGemini(messages, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || m.text || '').trim() }],
  }));
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents,
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return res.status(502).json({ error: 'Ungültige Antwort von der KI.' });
  }
  if (!response.ok) {
    const err = data?.error?.message || data?.error?.code || raw || String(response.status);
    return res.status(response.status >= 500 ? 502 : response.status).json({ error: err });
  }
  const candidate = data?.candidates?.[0];
  const blockReason = candidate?.finishReason && candidate.finishReason !== 'STOP';
  if (blockReason || !candidate?.content?.parts?.[0]?.text) {
    const msg = blockReason
      ? 'Antwort wurde aus Sicherheitsgründen nicht ausgegeben.'
      : 'Keine Antwort erhalten.';
    return res.status(200).json({ message: msg });
  }
  return res.status(200).json({ message: candidate.content.parts[0].text });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  if (typeof req.body === 'string') {
    try {
      body = JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: 'Ungültiger JSON-Body' });
    }
  }
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages (Array) erforderlich' });
  }

  if (process.env.OPENROUTER_API_KEY) {
    return handleOpenRouter(messages, res);
  }
  if (process.env.GEMINI_API_KEY) {
    return handleGemini(messages, res);
  }
  return res.status(503).json({
    error: 'Kein Chat-API-Key konfiguriert. OPENROUTER_API_KEY oder GEMINI_API_KEY in Vercel setzen.',
  });
}
