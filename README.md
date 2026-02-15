# architektenküchen Bielefeld – Webseite & Chatbot

## Entwicklung

### 1. Abhängigkeiten

```bash
npm install
```

### 2. Umgebung (Chatbot / Gemini)

Kopiere `.env.example` nach `.env` und trage deinen Gemini API Key ein:

```bash
cp .env.example .env
```

In `.env`: `GEMINI_API_KEY=dein_key` (Key z. B. unter [Google AI Studio](https://aistudio.google.com/apikey) erstellen.)

### 3. Zwei Prozesse starten

**Terminal 1 – Backend (Chat-API):**

```bash
npm run server
```

Läuft auf `http://localhost:3001`. Der Proxy im Frontend leitet `/api` dorthin weiter.

**Terminal 2 – Frontend:**

```bash
npm run dev
```

Öffne `http://localhost:5173`. Das Chat-Widget erscheint unten rechts mit wechselnder Typing-Nachricht; Klick öffnet den Chat. Der Bot nutzt den Kontext von architektenküchen (Studio, next125, Termin/Calendly) und führt bei Terminwunsch zum Buchungslink bzw. zur Telefonnummer.

### Build

```bash
npm run build
npm run preview
```

Für Production den Server (`node server.js`) separat hosten und `/api` dorthin leiten (oder gleiche Domain mit Reverse-Proxy).

## Chatbot

- **Position:** Fix unten rechts, über dem restlichen Inhalt.
- **CTA:** Rotierende Typing-Texte (z. B. „Hast du Fragen, oder buchst du einen Termin?“).
- **Backend:** `server.js` – Gemini API (API-Key nur serverseitig in `.env`).
- **Calendly:** Im System-Prompt in `server.js` ist ein Platzhalter-Link; durch den echten Calendly-Link ersetzen, sobald vorhanden.
