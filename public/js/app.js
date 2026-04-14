/**
 * SpellForge — Frontend Application Logic
 * 
 * Handles user interactions, API communication, and result rendering.
 */

// ═══════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════
const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const resultsSection = document.getElementById('resultsSection');
const copyBtn = document.getElementById('copyBtn');
const toggleTokens = document.getElementById('toggleTokens');

// Stats
const statWords = document.getElementById('statWords');
const statSpelling = document.getElementById('statSpelling');
const statGrammar = document.getElementById('statGrammar');
const statAccuracy = document.getElementById('statAccuracy');
const statTime = document.getElementById('statTime');

// Result containers
const correctedText = document.getElementById('correctedText');
const errorsList = document.getElementById('errorsList');
const tokenStream = document.getElementById('tokenStream');
const phasesList = document.getElementById('phasesList');

// Filter buttons
const filterAll = document.getElementById('filterAll');
const filterSpelling = document.getElementById('filterSpelling');
const filterGrammar = document.getElementById('filterGrammar');

// State
let currentResult = null;
let currentFilter = 'all';

// Sample text with intentional errors
const SAMPLE_TEXT = `He go to the the school yestarday and it was a intresting day. She dont like appls but she enjoyes bannas and orranges.

The weather was beautful and the sun was shinning britely. They was very hapy to see there freinds at the park.

I is very exited about the upcomming holliday. A elephant was standing near a oak tree in the forrest. We has been studing compilor desing for many weeks now.`;

// ═══════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════

// Character & word count
inputText.addEventListener('input', updateCharCount);

// Analyze button
analyzeBtn.addEventListener('click', analyzeText);

// Clear button
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  updateCharCount();
  resultsSection.style.display = 'none';
  resetPipeline();
  currentResult = null;
});

// Sample text button
sampleBtn.addEventListener('click', () => {
  inputText.value = SAMPLE_TEXT;
  updateCharCount();
  inputText.focus();
  showToast('Sample text loaded!', 'success');
});

// File upload - click
uploadZone.addEventListener('click', () => fileInput.click());

// File upload - file selected
fileInput.addEventListener('change', handleFileUpload);

// File upload - drag & drop
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processFileUpload(file);
});

// Copy button
copyBtn.addEventListener('click', () => {
  if (currentResult) {
    navigator.clipboard.writeText(currentResult.correctedText).then(() => {
      showToast('Corrected text copied to clipboard!', 'success');
    });
  }
});

// Toggle token stream
toggleTokens.addEventListener('click', () => {
  tokenStream.classList.toggle('collapsed');
});

// Error filters
[filterAll, filterSpelling, filterGrammar].forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    if (currentResult) renderErrors(currentResult.errors);
  });
});

// Keyboard shortcut: Ctrl+Enter to analyze
inputText.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    analyzeText();
  }
});

// ═══════════════════════════════════════════
// Functions
// ═══════════════════════════════════════════

function updateCharCount() {
  const text = inputText.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  charCount.textContent = `${chars.toLocaleString()} characters · ${words.toLocaleString()} words`;
}

async function analyzeText() {
  const text = inputText.value.trim();
  if (!text) {
    showToast('Please enter some text to analyze.', 'error');
    return;
  }

  setLoading(true);
  animatePipeline();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.error || 'Analysis failed', 'error');
      setLoading(false);
      resetPipeline();
      return;
    }

    currentResult = result;
    renderResults(result);
    completePipeline();
    showToast(`Analysis complete! Found ${result.summary.totalErrors} issue(s).`, 'success');
  } catch (err) {
    console.error('Analysis error:', err);
    showToast('Failed to connect to the server.', 'error');
    resetPipeline();
  }

  setLoading(false);
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) processFileUpload(file);
}

async function processFileUpload(file) {
  const validTypes = ['.txt', '.text', '.md'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!validTypes.includes(ext)) {
    showToast('Please upload a .txt file.', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('File size exceeds 5MB limit.', 'error');
    return;
  }

  setLoading(true);
  animatePipeline();

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.error || 'Upload failed', 'error');
      setLoading(false);
      resetPipeline();
      return;
    }

    // Also populate the text area
    inputText.value = result.input;
    updateCharCount();

    currentResult = result;
    renderResults(result);
    completePipeline();
    showToast(`File "${file.name}" analyzed! Found ${result.summary.totalErrors} issue(s).`, 'success');
  } catch (err) {
    console.error('Upload error:', err);
    showToast('Failed to upload file.', 'error');
    resetPipeline();
  }

  setLoading(false);
  fileInput.value = '';
}

function setLoading(loading) {
  analyzeBtn.disabled = loading;
  const btnText = analyzeBtn.querySelector('.btn-text');
  const btnLoading = analyzeBtn.querySelector('.btn-loading');
  btnText.style.display = loading ? 'none' : 'inline-flex';
  btnLoading.style.display = loading ? 'inline-flex' : 'none';
}

// ═══════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════

function renderResults(result) {
  resultsSection.style.display = 'block';

  // Animate scroll to results
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  // Stats
  animateCounter(statWords, result.summary.totalWords);
  animateCounter(statSpelling, result.summary.spellingErrors);
  animateCounter(statGrammar, result.summary.grammarErrors);
  statAccuracy.textContent = result.summary.accuracy + '%';
  statTime.textContent = result.summary.processingTimeMs + 'ms';

  // Color code accuracy
  if (result.summary.accuracy >= 90) {
    statAccuracy.style.background = 'linear-gradient(135deg, #34d399, #6ee7b7)';
  } else if (result.summary.accuracy >= 70) {
    statAccuracy.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
  } else {
    statAccuracy.style.background = 'linear-gradient(135deg, #f87171, #ef4444)';
  }
  statAccuracy.style.webkitBackgroundClip = 'text';
  statAccuracy.style.webkitTextFillColor = 'transparent';
  statAccuracy.style.backgroundClip = 'text';

  // Corrected text with highlights
  renderCorrectedText(result);

  // Errors
  renderErrors(result.errors);

  // Token stream
  renderTokens(result.tokens);

  // Phases
  renderPhases(result.phases);
}

function renderCorrectedText(result) {
  if (result.errors.length === 0) {
    correctedText.innerHTML = `<div class="no-errors">
      <div class="no-errors-icon">🎉</div>
      <div class="no-errors-text">Perfect! No errors found.</div>
      <div class="no-errors-sub">Your text is clean and well-written.</div>
    </div>`;
    return;
  }

  // Build highlighted corrected text
  let html = escapeHtml(result.correctedText);
  
  // Mark corrections in the corrected text
  const fixedErrors = result.errors.filter(e => e.fix && e.fix !== '');
  if (fixedErrors.length > 0) {
    // We'll show the corrected text plain but with a summary
    const errorSummary = fixedErrors.map(e => 
      `<span class="correction" title="${escapeHtml(e.message)}">${escapeHtml(e.fix || e.word)}</span>`
    ).join(' ');
    
    correctedText.innerHTML = `<div style="margin-bottom:12px; font-size:0.8rem; color:var(--text-muted);">
      ${fixedErrors.length} correction(s) applied — hover over highlighted words for details
    </div>` + html;
  } else {
    correctedText.textContent = result.correctedText;
  }
}

function renderErrors(errors) {
  const filtered = currentFilter === 'all' 
    ? errors 
    : errors.filter(e => e.type === currentFilter);

  if (filtered.length === 0) {
    errorsList.innerHTML = `<div class="no-errors">
      <div class="no-errors-icon">${currentFilter === 'all' ? '🎉' : '✅'}</div>
      <div class="no-errors-text">${currentFilter === 'all' ? 'No errors found!' : `No ${currentFilter.toLowerCase()} errors found!`}</div>
      <div class="no-errors-sub">${currentFilter === 'all' ? 'Your text looks great.' : 'Try checking other categories.'}</div>
    </div>`;
    return;
  }

  errorsList.innerHTML = filtered.map((error, index) => {
    const typeClass = error.type === 'SPELLING' ? 'spelling' : 'grammar';
    const suggestions = error.suggestions.map(s => 
      `<span class="suggestion-tag">${escapeHtml(s)}</span>`
    ).join('');

    return `<div class="error-item ${typeClass}" style="animation-delay: ${index * 50}ms">
      <span class="error-badge ${typeClass}">${error.type === 'SPELLING' ? '🔴 Spell' : '🟠 Grammar'}</span>
      <div class="error-details">
        <div class="error-message">${escapeHtml(error.message)}</div>
        <div class="error-location">Line ${error.line}, Column ${error.column}</div>
        ${suggestions ? `<div class="error-suggestions">Suggestions: ${suggestions}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderTokens(tokens) {
  tokenStream.innerHTML = tokens.map(token => {
    return `<span class="token-chip ${token.type}" title="${token.type}: '${escapeHtml(token.value)}' at line ${token.line}:${token.column}">
      <span class="token-type">${token.type}</span>
      ${escapeHtml(token.value)}
    </span>`;
  }).join('');
}

function renderPhases(phases) {
  phasesList.innerHTML = phases.map((phase, i) => {
    let detail = '';
    if (phase.tokensProduced !== undefined) detail = ` · ${phase.tokensProduced} tokens`;
    if (phase.errorsFound !== undefined) detail = ` · ${phase.errorsFound} errors`;

    return `<div class="phase-item">
      <div class="phase-number">${i + 1}</div>
      <div class="phase-info">
        <div class="phase-name">${escapeHtml(phase.name)}</div>
        <div class="phase-desc">${escapeHtml(phase.description)}${detail}</div>
      </div>
      <span class="phase-status">✓ ${phase.status}</span>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════
// Pipeline Animation
// ═══════════════════════════════════════════

function animatePipeline() {
  const steps = document.querySelectorAll('.pipeline-step');
  steps.forEach(step => {
    step.classList.remove('active', 'completed');
  });

  let current = 0;
  const interval = setInterval(() => {
    if (current > 0) steps[current - 1].classList.replace('active', 'completed');
    if (current < steps.length) {
      steps[current].classList.add('active');
      current++;
    } else {
      clearInterval(interval);
    }
  }, 400);
}

function completePipeline() {
  const steps = document.querySelectorAll('.pipeline-step');
  steps.forEach(step => {
    step.classList.remove('active');
    step.classList.add('completed');
  });
}

function resetPipeline() {
  const steps = document.querySelectorAll('.pipeline-step');
  steps.forEach(step => {
    step.classList.remove('active', 'completed');
  });
}

// ═══════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function animateCounter(el, target) {
  const duration = 600;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Initialize ──
updateCharCount();
