# ⚖️ LegalShield AI — Your AI Legal Advocate

> Access to justice for everyone. Powered by Anthropic Claude.

## 🚀 Run Instantly (Zero Setup)

Just **double-click `index.html`** — the app runs in any modern browser with no server required.

The app works in **Demo Mode** out of the box (pre-built smart responses). To enable live AI analysis, see configuration below.

---

## ⚙️ Enable Live AI (1 minute)

LegalShield AI uses the **Anthropic Claude API** directly from the browser.

Open `js/app.js` and the app already calls `https://api.anthropic.com/v1/messages`. The Anthropic API handles authentication automatically when called from Claude.ai artifacts.

For standalone deployment, you'll need to add your API key. In `js/app.js`, find the `callClaudeAPI` function and add your key:

```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'YOUR_ANTHROPIC_API_KEY',    // add this
  'anthropic-version': '2023-06-01',          // add this
}
```

Get your key at: https://console.anthropic.com

---

## 🌐 Deploy to Vercel (2 Steps)

**Step 1:** Push this folder to a GitHub repository

**Step 2:** Go to [vercel.com](https://vercel.com), click "Add New Project", select your repo, and click Deploy.

That's it. No build step. No configuration. Vercel auto-detects it as a static site.

**Or use Vercel CLI:**
```bash
npm i -g vercel
cd legalshield
vercel
```

---

## 🌐 Deploy to Netlify (2 Steps)

**Step 1:** Drag the `legalshield` folder to [netlify.com/drop](https://netlify.com/drop)

**Step 2:** Your site is live instantly.

---

## 📁 File Structure

```
legalshield/
├── index.html          # Complete app shell (all pages)
├── css/
│   └── style.css       # Full premium stylesheet (dark glassmorphism)
├── js/
│   └── app.js          # All app logic + AI integration
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

---

## 🎯 Features

| Feature | Status |
|---------|--------|
| Document Analyzer (paste or upload) | ✅ |
| AI-powered risk detection | ✅ |
| Visual risk score meter | ✅ |
| Key clauses extraction | ✅ |
| Plain English summary | ✅ |
| Legal advice & recommendations | ✅ |
| AI Chat with document context | ✅ |
| Voice input (Chrome) | ✅ |
| Demo mode (no API key needed) | ✅ |
| Dark premium glassmorphism UI | ✅ |
| Mobile responsive | ✅ |
| Loading skeletons | ✅ |
| Keyboard shortcuts (Ctrl+1/2/3) | ✅ |

---

## 🛡️ Disclaimer

LegalShield AI is for informational purposes only. It is not a substitute for professional legal advice. Always consult a qualified lawyer for important legal matters.

---

## 🏗️ Tech Stack

- **Frontend:** Vanilla HTML + CSS + JavaScript (no framework needed)
- **AI:** Anthropic Claude (claude-sonnet)
- **Fonts:** Cabinet Grotesk + Satoshi (Google Fonts)
- **Deployment:** Vercel / Netlify / Any static host
- **Dependencies:** Zero npm packages

---

*Built for the people, not law firms.*
