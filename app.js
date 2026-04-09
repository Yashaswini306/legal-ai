/* ═══════════════════════════════════════
   LEGALSHIELD AI — APPLICATION LOGIC
   Full AI integration via Anthropic API
═══════════════════════════════════════ */

'use strict';

// ── STATE ──────────────────────────────
const state = {
  analysisContext: null,
  chatHistory: [],
  isAnalyzing: false,
  isChatting: false,
  recognition: null,
  isChatRecording: false,
};

// ── DEMO DOCUMENT ──────────────────────
const DEMO_DOCUMENT = `EMPLOYMENT CONTRACT

This Employment Agreement ("Agreement") is entered into as of January 1, 2025, between TechCorp Pvt Ltd ("Company") and the undersigned employee ("Employee").

1. POSITION AND DUTIES
Employee is hired as Senior Software Engineer. Employee agrees to devote full time and attention to the Company's business and shall not engage in any other employment, consulting, or business activity without prior written consent.

2. COMPENSATION
Base salary: ₹18,00,000 per annum, payable monthly. Performance bonuses are at the sole discretion of the Company and may be withdrawn at any time without notice.

3. NON-COMPETE CLAUSE
Employee agrees that for a period of 24 months following termination, they shall not directly or indirectly engage in any business that competes with the Company's products or services anywhere in India. Employee may not solicit the Company's clients or employees during this period.

4. INTELLECTUAL PROPERTY
All inventions, software, designs, or creative works developed by Employee — whether during or outside working hours — shall be the exclusive property of the Company. Employee irrevocably assigns all rights to the Company.

5. TERMINATION
The Company may terminate this agreement immediately and without notice or severance for any conduct the Company deems detrimental, at the Company's sole discretion. Employee must provide 90 days written notice before resignation.

6. CONFIDENTIALITY
Employee shall maintain strict confidentiality of all Company information during and indefinitely after employment. Breach shall result in liquidated damages of ₹50,00,000.

7. DISPUTE RESOLUTION
All disputes shall be resolved through binding arbitration in Mumbai under Company-appointed arbitrators. Employee waives the right to jury trial or class action.

8. GOVERNING LAW
This agreement is governed by the laws of India. Any modifications require written consent from the Company's CEO only.`;

// ── NAVIGATION ─────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  const link = document.getElementById('navlink-' + pageId);
  if (page) { page.classList.add('active'); page.scrollTo(0, 0); }
  if (link) link.classList.add('active');

  // Update chat context badge
  if (pageId === 'chat') updateChatSidebar();
}

function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu');
  m.classList.toggle('hidden');
}

// ── LOAD DEMO ──────────────────────────
function loadDemoAndAnalyze() {
  showPage('analyze');
  setTimeout(() => {
    const ta = document.getElementById('legalTextInput');
    ta.value = DEMO_DOCUMENT;
    onTextInput(ta);
    runAnalysis();
  }, 100);
}

// ── TEXT INPUT HANDLER ─────────────────
function onTextInput(el) {
  const len = el.value.length;
  const cc = document.getElementById('charCount');
  if (cc) cc.textContent = `${len.toLocaleString()} / 4,000 chars`;
  if (len > 4000) el.value = el.value.slice(0, 4000);
}

// ── DRAG & DROP ─────────────────────────
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('dragover');
}
function handleDragLeave() {
  document.getElementById('dropzone').classList.remove('dragover');
}
function handleDrop(e) {
  e.preventDefault();
  handleDragLeave();
  const file = e.dataTransfer.files[0];
  if (file) readFileToTextarea(file);
}
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) readFileToTextarea(file);
}
function readFileToTextarea(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const ta = document.getElementById('legalTextInput');
    ta.value = ev.target.result.slice(0, 4000);
    onTextInput(ta);
    // Update dropzone UI
    const dzTitle = document.querySelector('.dz-title');
    if (dzTitle) dzTitle.textContent = `✓ ${file.name}`;
    showToast(`📄 "${file.name}" loaded successfully`);
  };
  reader.onerror = () => showToast('❌ Could not read file. Try a .txt file.');
  reader.readAsText(file);
}

// ── VOICE INPUT ────────────────────────
function toggleVoice() {
  const btn = document.getElementById('voiceBtn');
  const status = document.getElementById('voiceStatus');

  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('🎙️ Voice not supported in this browser. Try Chrome.');
    return;
  }
  if (state.recognition && btn.classList.contains('recording')) {
    state.recognition.stop();
    btn.classList.remove('recording');
    btn.textContent = '🎙️ Voice';
    status.textContent = '';
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.recognition = new SR();
  state.recognition.lang = 'en-IN';
  state.recognition.continuous = false;
  state.recognition.interimResults = true;

  state.recognition.onstart = () => {
    btn.classList.add('recording');
    btn.textContent = '⏹ Stop';
    status.textContent = 'Listening...';
  };
  state.recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('legalTextInput').value = transcript;
    onTextInput(document.getElementById('legalTextInput'));
  };
  state.recognition.onend = () => {
    btn.classList.remove('recording');
    btn.textContent = '🎙️ Voice';
    status.textContent = '';
  };
  state.recognition.onerror = () => {
    btn.classList.remove('recording');
    btn.textContent = '🎙️ Voice';
    status.textContent = '';
    showToast('🎙️ Voice error. Try again.');
  };
  state.recognition.start();
}

function toggleChatVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('🎙️ Voice not supported. Try Chrome.'); return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'en-IN';
  rec.onresult = e => {
    document.getElementById('chatInput').value = e.results[0][0].transcript;
    autoResize(document.getElementById('chatInput'));
  };
  rec.onerror = () => showToast('🎙️ Voice error.');
  rec.start();
  showToast('🎙️ Listening... speak now');
}

// ── ANALYSIS ───────────────────────────
async function runAnalysis() {
  if (state.isAnalyzing) return;
  const text = document.getElementById('legalTextInput').value.trim();
  if (!text) {
    shake(document.getElementById('legalTextInput'));
    showToast('⚠️ Please paste or upload a legal document first.');
    return;
  }

  state.isAnalyzing = true;
  setAnalyzeLoading(true);

  const prompt = buildAnalysisPrompt(text);

  try {
    const data = await callClaudeAPI(prompt, null, 1200);
    state.analysisContext = { text: text.slice(0, 2000), ...data };
    renderResults(data);
    updateChatSidebar();
    showToast('✅ Analysis complete!');
  } catch (err) {
    console.error('Analysis error:', err);
    // Fallback to demo data if API fails
    const fallback = getFallbackAnalysis(text);
    state.analysisContext = { text: text.slice(0, 2000), ...fallback };
    renderResults(fallback);
    updateChatSidebar();
    showToast('⚡ Demo mode — configure API key for live analysis.');
  } finally {
    state.isAnalyzing = false;
    setAnalyzeLoading(false);
  }
}

function buildAnalysisPrompt(text) {
  return `You are a senior legal AI assistant. Analyze the following legal document and return ONLY a valid JSON object with NO markdown, NO backticks, NO explanation — just raw JSON.

Required JSON structure:
{
  "docType": "Type of document (e.g., Employment Contract, NDA, Rental Agreement)",
  "verdict": "Safe | Caution | Risky",
  "riskScore": 45,
  "summary": "2-3 sentence plain-English summary of what this document is and its overall fairness",
  "keyClauses": [
    { "title": "Clause name", "text": "Plain-English explanation of this clause" }
  ],
  "risks": [
    { "level": "high | medium | low", "title": "Risk title", "text": "Why this is risky in plain English" }
  ],
  "obligations": [
    { "party": "Employee/Tenant/Party A etc.", "text": "What they must do" }
  ],
  "advice": [
    "Specific actionable recommendation"
  ]
}

Rules:
- riskScore: 0-100 integer (0=safe, 100=extremely risky)
- verdict: "Safe" if riskScore<35, "Caution" if 35-65, "Risky" if >65
- keyClauses: 4-6 items
- risks: 3-5 items sorted by severity
- obligations: 3-5 items
- advice: 4-5 practical recommendations
- Write everything in plain English a non-lawyer can understand
- Be specific to the actual document content

Legal document to analyze:
${text.slice(0, 3500)}`;
}

function setAnalyzeLoading(loading) {
  const inputSection = document.getElementById('analyzerInput');
  const skeleton = document.getElementById('skeletonLoader');
  const results = document.getElementById('resultsSection');
  const btn = document.getElementById('analyzeBtn');
  const btnText = document.getElementById('analyzeBtnText');
  const btnSpinner = document.getElementById('analyzeBtnSpinner');

  if (loading) {
    inputSection.style.opacity = '0.4';
    inputSection.style.pointerEvents = 'none';
    skeleton.classList.remove('hidden');
    results.classList.add('hidden');
    btn.disabled = true;
    btnText.textContent = 'Analyzing...';
    btnSpinner.classList.remove('hidden');
  } else {
    inputSection.style.opacity = '1';
    inputSection.style.pointerEvents = '';
    skeleton.classList.add('hidden');
    btn.disabled = false;
    btnText.textContent = '⚡ Analyze Now';
    btnSpinner.classList.add('hidden');
  }
}

function renderResults(data) {
  // Risk meter animation
  const score = Math.max(0, Math.min(100, data.riskScore || 0));
  const arc = document.getElementById('meterArc');
  const scoreEl = document.getElementById('meterScore');
  if (arc) {
    const total = 157;
    const offset = total - (total * score / 100);
    setTimeout(() => {
      arc.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)';
      arc.style.strokeDashoffset = offset;
      animateNumber(scoreEl, 0, score, 1200);
    }, 100);
  }

  // Verdict
  const verdictBadge = document.getElementById('verdictBadge');
  const vClass = data.verdict === 'Safe' ? 'safe' : data.verdict === 'Caution' ? 'caution' : 'risky';
  const vIcon = data.verdict === 'Safe' ? '✅' : data.verdict === 'Caution' ? '⚠️' : '🚨';
  verdictBadge.textContent = `${vIcon} ${data.verdict}`;
  verdictBadge.className = `verdict-badge ${vClass}`;

  document.getElementById('resultDocType').textContent = data.docType || 'Legal Document';
  document.getElementById('resultSummary').textContent = data.summary || '';

  // Key clauses
  const clausesEl = document.getElementById('tab-clauses');
  clausesEl.innerHTML = `<div class="result-items-grid">${
    (data.keyClauses || []).map((c, i) => `
      <div class="result-item" style="animation-delay:${i * 0.07}s">
        <div class="result-item-label">${c.title || 'Clause ' + (i+1)}</div>
        <div class="result-item-text">${c.text || ''}</div>
      </div>`).join('')
  }</div>`;

  // Risks
  const risksEl = document.getElementById('tab-risks');
  risksEl.innerHTML = `<div class="result-items-grid">${
    (data.risks || []).map((r, i) => {
      const lvl = (r.level || 'medium').toLowerCase();
      const borderClass = lvl === 'high' ? 'risk-red' : lvl === 'medium' ? 'risk-amber' : 'risk-green';
      const badgeClass = lvl === 'high' ? 'badge-high' : lvl === 'medium' ? 'badge-medium' : 'badge-low';
      const badgeLabel = lvl === 'high' ? 'HIGH RISK' : lvl === 'medium' ? 'MEDIUM' : 'LOW';
      return `
        <div class="result-item ${borderClass}" style="animation-delay:${i * 0.07}s">
          <div class="risk-level-badge ${badgeClass}">${badgeLabel}</div>
          <div class="result-item-label">${r.title || ''}</div>
          <div class="result-item-text">${r.text || ''}</div>
        </div>`;
    }).join('')
  }</div>`;

  // Obligations
  const oblEl = document.getElementById('tab-obligations');
  oblEl.innerHTML = `<div class="result-items-grid">${
    (data.obligations || []).map((o, i) => `
      <div class="result-item" style="animation-delay:${i * 0.07}s">
        <div class="result-item-label">${o.party || 'Obligation'}</div>
        <div class="result-item-text">${o.text || ''}</div>
      </div>`).join('')
  }</div>`;

  // Advice
  const advEl = document.getElementById('tab-advice');
  advEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px">${
    (data.advice || []).map((a, i) => `
      <div class="advice-item" style="animation-delay:${i * 0.08}s">
        <div class="advice-num">${String(i+1).padStart(2,'0')}</div>
        <div class="advice-text">${a}</div>
      </div>`).join('')
  }</div>`;

  // Show results, reset tabs
  document.getElementById('resultsSection').classList.remove('hidden');
  switchTab('clauses', document.querySelector('.tab-btn'));
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function switchTab(tabId, el) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  const tc = document.getElementById('tab-' + tabId);
  if (tc) tc.classList.add('active');
}

function resetAnalyzer() {
  document.getElementById('legalTextInput').value = '';
  onTextInput(document.getElementById('legalTextInput'));
  document.getElementById('resultsSection').classList.add('hidden');
  document.querySelector('.dz-title').textContent = 'Drop your document here';
  const arc = document.getElementById('meterArc');
  if (arc) { arc.style.strokeDashoffset = 157; }
  state.analysisContext = null;
  updateChatSidebar();
  window.scrollTo(0, 0);
}

// ── FALLBACK ANALYSIS (demo mode) ──────
function getFallbackAnalysis(text) {
  const isEmployment = /employ|salary|wage|work|hire/i.test(text);
  const isRental = /rent|lease|tenant|landlord/i.test(text);
  const isNDA = /confidential|nda|non.disclosure/i.test(text);

  let docType = 'Legal Agreement';
  if (isEmployment) docType = 'Employment Contract';
  else if (isRental) docType = 'Rental Agreement';
  else if (isNDA) docType = 'Non-Disclosure Agreement';

  return {
    docType,
    verdict: 'Caution',
    riskScore: 62,
    summary: `This appears to be a ${docType}. Several clauses require careful review before signing. The document contains standard terms alongside some provisions that may be unfavorable. You should negotiate key terms before committing.`,
    keyClauses: [
      { title: 'Non-Compete', text: 'Restricts your ability to work in similar roles for a defined period after leaving.' },
      { title: 'Intellectual Property', text: 'Assigns ownership of work created — even outside work hours — to the other party.' },
      { title: 'Termination', text: 'Allows termination without notice at the other party\'s discretion.' },
      { title: 'Dispute Resolution', text: 'Mandates arbitration, limiting your right to court proceedings.' },
      { title: 'Confidentiality', text: 'Broad indefinite confidentiality obligations with significant financial penalties.' },
    ],
    risks: [
      { level: 'high', title: 'Overbroad IP Assignment', text: 'Claiming ownership of work done outside working hours is legally aggressive and may not be enforceable.' },
      { level: 'high', title: 'At-Will Termination Imbalance', text: 'The company can terminate immediately without notice while you must give 90 days — this is highly asymmetric.' },
      { level: 'medium', title: '24-Month Non-Compete', text: 'A 2-year non-compete covering all of India is likely unenforceable in Indian courts but could still cause problems.' },
      { level: 'medium', title: 'Mandatory Arbitration', text: 'Arbitration with company-appointed arbitrators creates a potential conflict of interest.' },
      { level: 'low', title: 'Bonus Discretion', text: 'Performance bonuses can be withdrawn without notice, making them unreliable as compensation.' },
    ],
    obligations: [
      { party: 'Employee', text: 'Must provide 90 days written notice before resignation.' },
      { party: 'Employee', text: 'Cannot engage in outside employment without written consent.' },
      { party: 'Employee', text: 'Must maintain confidentiality indefinitely after employment ends.' },
      { party: 'Company', text: 'Must pay agreed base salary monthly.' },
    ],
    advice: [
      'Request that the IP assignment be limited to work done during working hours and using company resources only.',
      'Negotiate the non-compete to a shorter period (6 months) and a smaller geographic area relevant to your role.',
      'Push back on the 90-day notice clause — 30 days is standard. The asymmetry (0 days for company vs 90 for you) is unfair.',
      'Ask for "cause" to be defined in the termination clause so you cannot be dismissed arbitrarily.',
      'Seek legal advice from an employment lawyer before signing — especially given the significant financial penalties in the confidentiality clause.',
    ],
  };
}

// ── CHAT ───────────────────────────────
function updateChatSidebar() {
  const ctx = state.analysisContext;
  const sidebarCtx = document.getElementById('sidebarContext');
  const badge = document.getElementById('contextBadge');

  if (ctx) {
    sidebarCtx.innerHTML = `
      <div class="context-loaded">
        <div class="context-loaded-label">📎 Document context</div>
        <div class="context-loaded-type">${ctx.docType || 'Legal Document'}</div>
        <div class="context-loaded-verdict">Risk: ${ctx.verdict || '—'} · Score: ${ctx.riskScore || '—'}/100</div>
      </div>`;
    badge.textContent = `📎 ${ctx.docType || 'Document'} loaded`;
    badge.classList.add('loaded');
  } else {
    sidebarCtx.innerHTML = `
      <div class="context-empty">
        <span>📁</span>
        <p>No document loaded</p>
        <button class="btn-ghost-xs" onclick="showPage('analyze')">Analyze a doc first</button>
      </div>`;
    badge.textContent = 'No document context';
    badge.classList.remove('loaded');
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg || state.isChatting) return;

  input.value = '';
  autoResize(input);
  appendUserMessage(msg);
  state.isChatting = true;
  setChatLoading(true);
  showTypingIndicator();

  const systemPrompt = state.analysisContext
    ? `You are LegalShield AI, an expert legal assistant. The user has already analyzed a document. Here is the analysis context:
Document Type: ${state.analysisContext.docType}
Verdict: ${state.analysisContext.verdict}
Risk Score: ${state.analysisContext.riskScore}/100
Summary: ${state.analysisContext.summary}
Key Risks: ${(state.analysisContext.risks || []).map(r => r.title).join(', ')}
Document excerpt: ${state.analysisContext.text.slice(0, 800)}

Answer all questions in relation to this specific document. Be direct, practical, and write in plain English. You are a helpful legal advocate for the user.`
    : `You are LegalShield AI, an expert legal assistant and advocate. Answer legal questions in plain English. Be practical, direct, and helpful. Always recommend consulting a licensed lawyer for serious matters. Never provide specific legal advice — provide legal information and education.`;

  const messages = [
    ...state.chatHistory.slice(-12),
    { role: 'user', content: msg }
  ];

  try {
    const reply = await callClaudeAPIChat(systemPrompt, messages);
    removeTypingIndicator();
    appendAIMessage(reply);
    state.chatHistory.push({ role: 'user', content: msg }, { role: 'assistant', content: reply });
    updateSuggestions();
  } catch (err) {
    console.error('Chat error:', err);
    removeTypingIndicator();
    const fallback = getFallbackChatReply(msg);
    appendAIMessage(fallback);
    state.chatHistory.push({ role: 'user', content: msg }, { role: 'assistant', content: fallback });
  } finally {
    state.isChatting = false;
    setChatLoading(false);
  }
}

function sendQuickQ(el) {
  const q = el.textContent;
  document.getElementById('chatInput').value = q;
  sendChatMessage();
}

function useSuggestion(el) {
  document.getElementById('chatInput').value = el.textContent;
  sendChatMessage();
}

function appendUserMessage(text) {
  const msgs = document.getElementById('messages');
  const row = document.createElement('div');
  row.className = 'message-row user';
  row.innerHTML = `
    <div class="user-msg-avatar">👤</div>
    <div class="msg-bubble user">${escapeHtml(text)}<div class="msg-time">${getTime()}</div></div>`;
  msgs.appendChild(row);
  scrollToBottom();
}

function appendAIMessage(text) {
  const msgs = document.getElementById('messages');
  const row = document.createElement('div');
  row.className = 'message-row ai';
  row.innerHTML = `
    <div class="msg-avatar">⚖️</div>
    <div class="msg-bubble ai">${formatAIResponse(text)}<div class="msg-time">${getTime()}</div></div>`;
  msgs.appendChild(row);
  scrollToBottom();
}

function showTypingIndicator() {
  const msgs = document.getElementById('messages');
  const row = document.createElement('div');
  row.id = 'typingIndicator';
  row.className = 'message-row ai';
  row.innerHTML = `
    <div class="msg-avatar">⚖️</div>
    <div class="msg-bubble ai typing-bubble"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>`;
  msgs.appendChild(row);
  scrollToBottom();
}

function removeTypingIndicator() {
  const t = document.getElementById('typingIndicator');
  if (t) t.remove();
}

function setChatLoading(loading) {
  const btn = document.getElementById('chatSendBtn');
  const icon = document.getElementById('sendBtnIcon');
  const spinner = document.getElementById('chatSpinner');
  btn.disabled = loading;
  if (loading) { icon.classList.add('hidden'); spinner.classList.remove('hidden'); }
  else { icon.classList.remove('hidden'); spinner.classList.add('hidden'); }
}

function clearChat() {
  const msgs = document.getElementById('messages');
  msgs.innerHTML = `
    <div class="message-row ai">
      <div class="msg-avatar">⚖️</div>
      <div class="msg-bubble ai">
        <p>Chat cleared! How can I help you with your legal questions?</p>
        <div class="msg-time">${getTime()}</div>
      </div>
    </div>`;
  state.chatHistory = [];
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
}

function updateSuggestions() {
  const bar = document.getElementById('suggestionsBar');
  const contextSuggs = state.analysisContext ? [
    'What should I negotiate in this contract?',
    'Which clauses are most dangerous?',
    'Is this agreement legal and fair?',
    'What happens if I breach this?',
    'Can I modify these terms?',
  ] : [
    'What are my rights as an employee?',
    'How do I challenge an unfair clause?',
    'What is force majeure?',
    'Explain indemnification clauses',
    'When should I hire a lawyer?',
  ];
  const sugg = contextSuggs[Math.floor(Math.random() * contextSuggs.length)];
  const chip = document.createElement('div');
  chip.className = 'suggestion-chip';
  chip.textContent = sugg;
  chip.onclick = () => useSuggestion(chip);
  if (bar.children.length > 5) bar.removeChild(bar.children[0]);
  bar.appendChild(chip);
}

function getFallbackChatReply(msg) {
  const m = msg.toLowerCase();
  if (/non.compete|compete/i.test(m))
    return `Non-compete clauses restrict you from working for competitors or starting a competing business after you leave. In India, courts have generally held that post-termination non-competes are unenforceable under Section 27 of the Indian Contract Act, which prohibits restraint of trade. However, this varies by case. Key factors: duration (shorter = more enforceable), geographic scope, and whether the restriction is reasonable for protecting legitimate business interests. If you've been handed a non-compete, I'd recommend getting an employment lawyer to review it before signing.`;
  if (/arbitration/i.test(m))
    return `Arbitration is a private dispute resolution process outside of courts. Instead of going to a judge, a neutral third party (arbitrator) hears both sides and makes a binding decision. Many contracts now include mandatory arbitration clauses because it's faster and cheaper — but it also means you give up your right to a court trial or jury. Watch out for clauses where the company gets to appoint the arbitrator — that's a significant conflict of interest.`;
  if (/nda|confidential/i.test(m))
    return `An NDA (Non-Disclosure Agreement) is a legal contract where one or both parties agree to keep certain information confidential. Key things to check: (1) What exactly is defined as "confidential"? Very broad definitions can be problematic. (2) How long does confidentiality last? Indefinite NDAs are aggressive. (3) What are the exceptions — e.g., info already public, required by law? (4) What are the penalties for breach? Make sure they're proportionate to the risk.`;
  if (/terminate|termination|fire|fired/i.test(m))
    return `Termination clauses define how and when a contract can be ended. Key things to check: Does the company need to provide a reason ("for cause" only) or can they fire you at will? How much notice is required — and is it equal for both parties? Is there a severance provision? In India, employment termination is also governed by labor laws like the Industrial Disputes Act, which provide additional protections beyond what the contract says. If you've been terminated unfairly, document everything and consult a labor lawyer.`;
  if (/salary|pay|compens/i.test(m))
    return `Compensation clauses should clearly state: base salary (in writing, not verbal promises), payment frequency (monthly is standard in India), how bonuses are calculated (discretionary vs formula-based), increment policies, and any deductions. Watch out for "at the Company's discretion" language on bonuses — this means they can legally pay you nothing extra. Try to get any promised bonuses defined in writing with clear metrics.`;
  return `That's an important legal question. ${state.analysisContext ? `Based on the ${state.analysisContext.docType} you analyzed, ` : ''}here's what you should know: legal documents often contain terms that appear standard but can significantly impact your rights. I'd recommend: (1) reading every clause carefully, (2) asking for plain-English explanations of anything unclear, and (3) consulting a licensed lawyer before signing anything significant. Is there a specific clause or concern you'd like me to explain in more detail?`;
}

// ── ANTHROPIC API ──────────────────────
async function callClaudeAPI(prompt, system, maxTokens = 1200) {
  const messages = [{ role: 'user', content: prompt }];
  const body = { model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, messages };
  if (system) body.system = system;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  const raw = await res.json();
  let content = raw.content[0].text.trim();
  // Strip any accidental markdown fences
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(content);
}

async function callClaudeAPIChat(system, messages) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system,
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  const raw = await res.json();
  return raw.content[0].text;
}

// ── HELPERS ────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

function scrollToBottom() {
  const wrap = document.getElementById('messagesWrap');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function formatAIResponse(text) {
  // Convert markdown-like formatting to HTML
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\n\n/g, '</p><p style="margin-top:10px">');
  html = html.replace(/\n/g, '<br>');
  return `<p>${html}</p>`;
}

function shake(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake .4s ease';
  setTimeout(() => el.style.animation = '', 400);
}

function showToast(msg, duration = 3200) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), duration);
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    el.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── KEYBOARD SHORTCUTS ─────────────────
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === '1') { e.preventDefault(); showPage('home'); }
    if (e.key === '2') { e.preventDefault(); showPage('analyze'); }
    if (e.key === '3') { e.preventDefault(); showPage('chat'); }
  }
});

// ── NAVBAR SCROLL EFFECT ───────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 20) {
    nav.style.background = 'rgba(5,7,15,0.95)';
  } else {
    nav.style.background = 'rgba(5,7,15,0.8)';
  }
}, { passive: true });

// ── INJECT SHAKE ANIMATION ─────────────
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%,60%{transform:translateX(-6px)}
    40%,80%{transform:translateX(6px)}
  }
`;
document.head.appendChild(shakeStyle);

// ── INIT ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateChatSidebar();
  console.log('%c⚖️ LegalShield AI', 'font-size:20px;font-weight:900;color:#4f8ef7');
  console.log('%cPowered by Claude · Press Ctrl+1/2/3 to switch tabs', 'color:#8896b3');
});
