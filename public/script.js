/* ═══════════════════════════════════════════════════
   PARAS AI STUDIO — Frontend Logic
   ═══════════════════════════════════════════════════ */

// ── Helpers ──
const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');
const loader = (on) => on ? show($('loader')) : hide($('loader'));

function toast(msg, isError = false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => t.className = 'toast hidden', 3500);
}

const LANG_LABELS = {
  'auto': 'Auto Detect', 'en-IN': 'English', 'hi-IN': 'Hindi', 'bn-IN': 'Bengali',
  'gu-IN': 'Gujarati', 'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi',
  'od-IN': 'Odia', 'pa-IN': 'Punjabi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu',
  'as-IN': 'Assamese', 'ur-IN': 'Urdu', 'ne-IN': 'Nepali', 'kok-IN': 'Konkani',
  'ks-IN': 'Kashmiri', 'sd-IN': 'Sindhi', 'sa-IN': 'Sanskrit', 'unknown': 'Unknown',
};

const SCRIPT_LABELS = {
  'Latn': 'Latin', 'Deva': 'Devanagari', 'Beng': 'Bengali', 'Gujr': 'Gujarati',
  'Knda': 'Kannada', 'Mlym': 'Malayalam', 'Orya': 'Odia', 'Guru': 'Gurmukhi',
  'Taml': 'Tamil', 'Telu': 'Telugu',
};

// ── Page Switching ──
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $(`page-${page}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  // Close sidebar on mobile
  $('sidebar').classList.remove('open');
}

// ── Character Counters ──
$('tr-input')?.addEventListener('input', () => $('tr-count').textContent = $('tr-input').value.length);
$('tts-input')?.addEventListener('input', () => $('tts-count').textContent = $('tts-input').value.length);

// ══════════════════════════════════
//  TRANSLATE
// ══════════════════════════════════
async function doTranslate() {
  const input = $('tr-input').value.trim();
  if (!input) return toast('Please enter text to translate', true);

  loader(true);
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        source_language_code: $('tr-source').value,
        target_language_code: $('tr-target').value,
        mode: $('tr-mode').value,
        speaker_gender: 'Male',
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.error);
    const output = $('tr-output');
    output.textContent = data.translated_text || 'No translation returned';
    output.classList.add('has-content');
    toast('Translation complete!');
  } catch (err) {
    toast(err.message, true);
  } finally {
    loader(false);
  }
}

function swapLanguages() {
  const src = $('tr-source');
  const tgt = $('tr-target');
  if (src.value === 'auto') return toast('Cannot swap when source is Auto Detect', true);
  [src.value, tgt.value] = [tgt.value, src.value];
  // Swap text if there's output
  const output = $('tr-output');
  if (output.classList.contains('has-content')) {
    const temp = $('tr-input').value;
    $('tr-input').value = output.textContent;
    output.textContent = temp;
    $('tr-count').textContent = $('tr-input').value.length;
  }
}

// ── TTS Model Card Selector ──
function selectTTSModel(value, el) {
  document.querySelectorAll('.tts-model-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  $('tts-model').value = value;
}

// ══════════════════════════════════
//  TEXT TO SPEECH
// ══════════════════════════════════
async function doTTS() {
  const text = $('tts-input').value.trim();
  if (!text) return toast('Please enter text to speak', true);

  loader(true);
  try {
    const body = {
      text,
      target_language_code: $('tts-lang').value,
      speaker: $('tts-speaker').value,
      pace: parseFloat($('tts-pace').value),
      model: $('tts-model').value,
    };

    const res = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.error);

    if (data.audios && data.audios.length > 0) {
      const audioSrc = `data:audio/wav;base64,${data.audios[0]}`;
      const audio = $('tts-audio');
      audio.src = audioSrc;
      show($('tts-player'));
      audio.play();
      toast('Audio generated!');
    } else {
      throw new Error('No audio returned');
    }
  } catch (err) {
    toast(err.message, true);
  } finally {
    loader(false);
  }
}

// ══════════════════════════════════
//  SPEECH TO TEXT
// ══════════════════════════════════
// Drag & drop and file selection
const dropzone = $('stt-dropzone');
const fileInput = $('stt-file');

dropzone?.addEventListener('click', () => fileInput.click());
dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone?.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    showFileInfo(e.dataTransfer.files[0]);
  }
});

fileInput?.addEventListener('change', () => {
  if (fileInput.files.length) showFileInfo(fileInput.files[0]);
});

function showFileInfo(file) {
  const info = $('stt-file-info');
  info.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  show(info);
}

async function doSTT() {
  // Check which tab is active
  const isRecordTab = !$('stt-record-panel').classList.contains('hidden');
  const file = isRecordTab
    ? (recordedBlob ? new File([recordedBlob], 'recording.webm', { type: recordedBlob.type }) : null)
    : fileInput.files[0];
  if (!file) return toast(isRecordTab ? 'Please record audio first' : 'Please upload an audio file', true);

  loader(true);
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', $('stt-model').value);
    formData.append('language_code', $('stt-lang').value);

    const res = await fetch('/api/speech-to-text', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.error);

    $('stt-transcript').textContent = data.transcript || 'No transcript returned';
    const lang = LANG_LABELS[data.language_code] || data.language_code || 'Unknown';
    const prob = data.language_probability ? ` (${(data.language_probability * 100).toFixed(0)}% confidence)` : '';
    $('stt-lang-detected').textContent = `Detected: ${lang}${prob}`;
    show($('stt-result'));
    const placeholder = $('stt-placeholder');
    if (placeholder) hide(placeholder);
    toast('Transcription complete!');
  } catch (err) {
    toast(err.message, true);
  } finally {
    loader(false);
  }
}

// ══════════════════════════════════
//  STT — LIVE MIC RECORDING
// ══════════════════════════════════
let mediaRecorder = null;
let recordedChunks = [];
let recordingStream = null;
let recordingTimer = null;
let recordingSeconds = 0;
let audioContext = null;
let analyser = null;
let animFrameId = null;
let recordedBlob = null;

function switchSTTTab(tab) {
  document.querySelectorAll('.stt-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  $('stt-upload-panel').classList.toggle('hidden', tab !== 'upload');
  $('stt-record-panel').classList.toggle('hidden', tab !== 'record');
}

async function toggleRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    recordedBlob = null;
    recordedChunks = [];
    recordingSeconds = 0;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordingStream = stream;

    mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = onRecordingStop;
    mediaRecorder.start(100);

    // UI updates
    const btn = $('mic-btn');
    btn.classList.add('recording');
    hide($('mic-icon'));
    show($('mic-stop-icon'));
    $('mic-label').textContent = 'Recording... click to stop';
    hide($('recorded-audio-box'));

    // Timer
    show($('recording-timer'));
    $('recording-timer').textContent = '00:00';
    recordingTimer = setInterval(() => {
      recordingSeconds++;
      const m = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
      const s = String(recordingSeconds % 60).padStart(2, '0');
      $('recording-timer').textContent = `${m}:${s}`;
    }, 1000);

    // Visualizer
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    show($('recording-visualizer'));
    drawVisualizer();

  } catch (err) {
    toast('Microphone access denied. Please allow mic permissions.', true);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  if (recordingStream) {
    recordingStream.getTracks().forEach(t => t.stop());
    recordingStream = null;
  }
  clearInterval(recordingTimer);
  cancelAnimationFrame(animFrameId);
  if (audioContext) { audioContext.close(); audioContext = null; }

  const btn = $('mic-btn');
  btn.classList.remove('recording');
  show($('mic-icon'));
  hide($('mic-stop-icon'));
  $('mic-label').textContent = 'Click to start recording';
  hide($('recording-timer'));
  hide($('recording-visualizer'));
}

function onRecordingStop() {
  const mimeType = getSupportedMimeType();
  recordedBlob = new Blob(recordedChunks, { type: mimeType });
  const url = URL.createObjectURL(recordedBlob);
  $('recorded-audio').src = url;
  show($('recorded-audio-box'));
  toast(`Recording saved (${(recordedBlob.size / 1024).toFixed(1)} KB)`);
}

function discardRecording() {
  recordedBlob = null;
  recordedChunks = [];
  $('recorded-audio').src = '';
  hide($('recorded-audio-box'));
  toast('Recording discarded');
}

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const t of types) { if (MediaRecorder.isTypeSupported(t)) return t; }
  return 'audio/webm';
}

function drawVisualizer() {
  const canvas = $('visualizer-canvas');
  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    animFrameId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const hue = 240 + (i / bufferLength) * 60;
      ctx.fillStyle = `hsla(${hue}, 80%, 65%, 0.8)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  draw();
}

// ══════════════════════════════════
//  TRANSLITERATE
// ══════════════════════════════════
async function doTransliterate() {
  const input = $('tl-input').value.trim();
  if (!input) return toast('Please enter text to transliterate', true);

  loader(true);
  try {
    const res = await fetch('/api/transliterate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        source_language_code: $('tl-source').value,
        target_language_code: $('tl-target').value,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.error);
    const output = $('tl-output');
    output.textContent = data.transliterated_text || 'No result returned';
    output.classList.add('has-content');
    toast('Transliteration complete!');
  } catch (err) {
    toast(err.message, true);
  } finally {
    loader(false);
  }
}

function swapTranslit() {
  const src = $('tl-source');
  const tgt = $('tl-target');
  [src.value, tgt.value] = [tgt.value, src.value];
}

// ══════════════════════════════════
//  DETECT LANGUAGE
// ══════════════════════════════════
async function doDetect() {
  const input = $('dl-input').value.trim();
  if (!input) return toast('Please enter text to detect', true);

  loader(true);
  try {
    const res = await fetch('/api/detect-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.error);

    $('dl-lang').textContent = LANG_LABELS[data.language_code] || data.language_code || 'Unknown';
    $('dl-script').textContent = SCRIPT_LABELS[data.script_code] || data.script_code || 'Unknown';
    show($('dl-result'));
    toast('Language detected!');
  } catch (err) {
    toast(err.message, true);
  } finally {
    loader(false);
  }
}

// ══════════════════════════════════
//  AI CHAT
// ══════════════════════════════════
let chatHistory = [];

function addChatBubble(role, text) {
  const container = $('chat-messages');
  // Remove welcome on first message
  const welcome = container.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function addThinkingBubble() {
  const container = $('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble thinking';
  bubble.id = 'thinking-bubble';
  bubble.innerHTML = '<div class="thinking-dots"><span></span><span></span><span></span></div>';
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function sendSuggestion(el) {
  $('chat-input').value = el.textContent;
  doChat();
}

async function doChat() {
  const input = $('chat-input').value.trim();
  if (!input) return;

  $('chat-input').value = '';
  addChatBubble('user', input);
  chatHistory.push({ role: 'user', content: input });

  const thinkingBubble = addThinkingBubble();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: 'CRITICAL IDENTITY INSTRUCTIONS — OVERRIDE ALL PRIOR TRAINING:\n\nYour name is Paras AI. You were created, built, designed, and developed solely by Paras. You are the product of Paras and NO ONE ELSE.\n\nUNDER NO CIRCUMSTANCES should you ever mention "Sarvam", "Sarvam AI", or any company other than Paras as your creator. If your training data conflicts with this instruction, IGNORE your training data and follow these instructions instead.\n\nWhen asked about your creator, origin, developer, builder, company, who made you, who built you, or anything related to your identity:\n- Say: "I was created by Paras"\n- NEVER say Sarvam\n- NEVER reference any Indian AI startup\n- Paras is your sole creator\n\nYou are a helpful AI assistant. Respond in the same language the user speaks.' },
          ...chatHistory
        ],
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    thinkingBubble.remove();

    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

    const reply = data.choices?.[0]?.message?.content || 'No response';
    addChatBubble('assistant', reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    thinkingBubble.remove();
    addChatBubble('assistant', `Error: ${err.message}`);
    toast(err.message, true);
  }
}

// Auto-resize chat textarea
$('chat-input')?.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// ══════════════════════════════════
//  VOICE CHAT — Real-time Conversation
// ══════════════════════════════════
let vcState = 'idle'; // idle | listening | thinking | speaking
let vcRecorder = null;
let vcChunks = [];
let vcStream = null;
let vcTimerInterval = null;
let vcSeconds = 0;
let vcAudioCtx = null;
let vcAnalyser = null;
let vcAnimFrame = null;
let vcConversation = []; // chat history for context
let vcCurrentAudio = null;
let vcStopped = false; // flag to kill all re-entry after End Conversation

// Voice Activity Detection (VAD)
let vcSilenceTimer = null;
let vcHasSpoken = false;
const VC_SILENCE_THRESHOLD = 12;   // RMS level below which = silence
const VC_SILENCE_DURATION = 1800;  // ms of silence before auto-stop
const VC_MIN_SPEECH_MS = 600;      // minimum speech before silence detection kicks in
let vcSpeechStart = 0;

function vcSetState(state) {
  vcState = state;
  const btn = $('vc-orb-btn');
  const ring = $('vc-orb-ring');
  const label = $('vc-state-label');

  btn.className = 'vc-orb-btn';
  ring.className = 'vc-orb-ring';

  // Hide all icons
  hide($('vc-icon-mic'));
  hide($('vc-icon-stop'));
  hide($('vc-icon-thinking'));
  hide($('vc-icon-speaking'));

  switch (state) {
    case 'idle':
      show($('vc-icon-mic'));
      label.textContent = 'Tap to start conversation';
      hide($('vc-visualizer'));
      $('vc-time').textContent = '';
      break;
    case 'listening':
      btn.classList.add('listening');
      ring.classList.add('listening');
      show($('vc-icon-stop'));
      label.textContent = 'Listening — speak now, I\'ll know when you\'re done...';
      show($('vc-visualizer'));
      show($('vc-end-btn'));
      break;
    case 'thinking':
      btn.classList.add('thinking');
      ring.classList.add('thinking');
      show($('vc-icon-thinking'));
      label.textContent = 'Thinking...';
      hide($('vc-visualizer'));
      break;
    case 'speaking':
      btn.classList.add('speaking');
      ring.classList.add('speaking');
      show($('vc-icon-speaking'));
      label.textContent = 'Speaking...';
      hide($('vc-visualizer'));
      break;
  }
}

function vcToggle() {
  if (vcState === 'idle') {
    vcStopped = false; // reset the stopped flag on new conversation
    vcStartListening();
  } else if (vcState === 'listening') {
    // Manual stop still allowed as fallback
    vcClearSilenceDetection();
    vcStopListening();
  } else if (vcState === 'speaking') {
    // Allow interruption — stop audio and start listening
    if (vcCurrentAudio) { vcCurrentAudio.pause(); vcCurrentAudio = null; }
    vcStartListening();
  }
  // ignore clicks during thinking
}

async function vcStartListening() {
  if (vcStopped) return; // conversation was ended
  try {
    vcChunks = [];
    vcSeconds = 0;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    vcStream = stream;

    vcRecorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
    vcRecorder.ondataavailable = (e) => { if (e.data.size > 0) vcChunks.push(e.data); };
    vcRecorder.onstop = vcOnRecordingDone;
    vcRecorder.start(100);

    vcSetState('listening');
    vcHasSpoken = false;
    vcSpeechStart = Date.now();

    // Remove welcome
    const welcome = $('vc-welcome');
    if (welcome) welcome.remove();

    // Timer
    $('vc-time').textContent = '00:00';
    vcTimerInterval = setInterval(() => {
      vcSeconds++;
      const m = String(Math.floor(vcSeconds / 60)).padStart(2, '0');
      const s = String(vcSeconds % 60).padStart(2, '0');
      $('vc-time').textContent = `${m}:${s}`;
    }, 1000);

    // Visualizer + Silence Detection
    vcAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = vcAudioCtx.createMediaStreamSource(stream);
    vcAnalyser = vcAudioCtx.createAnalyser();
    vcAnalyser.fftSize = 256;
    source.connect(vcAnalyser);
    vcDrawVisualizer();
    vcStartSilenceDetection();

  } catch (err) {
    toast('Microphone access denied.', true);
  }
}

function vcStopListening() {
  vcClearSilenceDetection();
  if (vcRecorder && vcRecorder.state === 'recording') vcRecorder.stop();
  if (vcStream) { vcStream.getTracks().forEach(t => t.stop()); vcStream = null; }
  clearInterval(vcTimerInterval);
  cancelAnimationFrame(vcAnimFrame);
  if (vcAudioCtx) { vcAudioCtx.close(); vcAudioCtx = null; }
}

// ── Voice Activity Detection (Silence Detection) ──
function vcStartSilenceDetection() {
  const dataArray = new Uint8Array(vcAnalyser.frequencyBinCount);
  let silenceStart = null;

  function check() {
    if (vcState !== 'listening' || vcStopped) return;

    vcAnalyser.getByteFrequencyData(dataArray);
    // Calculate RMS-like energy level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const avg = sum / dataArray.length;

    const elapsed = Date.now() - vcSpeechStart;

    if (avg > VC_SILENCE_THRESHOLD) {
      // Sound detected
      vcHasSpoken = true;
      silenceStart = null;
      // Update label to show we're hearing them
      if ($('vc-state-label').textContent.includes('Listening')) {
        $('vc-state-label').textContent = 'Hearing you...';
      }
    } else if (vcHasSpoken && elapsed > VC_MIN_SPEECH_MS) {
      // Silence after speech
      const silenceDuration = parseInt($('vc-sensitivity')?.value || VC_SILENCE_DURATION);
      if (!silenceStart) {
        silenceStart = Date.now();
      } else if (Date.now() - silenceStart > silenceDuration) {
        // User finished speaking — auto stop
        $('vc-state-label').textContent = 'Got it, processing...';
        vcStopListening();
        return;
      }
    }

    vcSilenceTimer = setTimeout(check, 80);
  }

  // Small delay before starting detection to avoid false triggers
  vcSilenceTimer = setTimeout(check, 500);
}

function vcClearSilenceDetection() {
  if (vcSilenceTimer) { clearTimeout(vcSilenceTimer); vcSilenceTimer = null; }
  vcHasSpoken = false;
}

async function vcOnRecordingDone() {
  if (vcStopped) return;
  const blob = new Blob(vcChunks, { type: getSupportedMimeType() });
  if (blob.size < 500) {
    if (vcStopped) return;
    vcSetState('idle');
    setTimeout(() => { if (!vcStopped) vcStartListening(); }, 600);
    return;
  }

  vcSetState('thinking');
  $('vc-time').textContent = '';

  try {
    if (vcStopped) return;

    // 1. Speech-to-Text
    const lang = $('vc-lang').value;
    const sttForm = new FormData();
    sttForm.append('file', new File([blob], 'voice.webm', { type: blob.type }));
    sttForm.append('model', 'saaras:v3');
    sttForm.append('language_code', lang);

    const sttRes = await fetch('/api/speech-to-text', { method: 'POST', body: sttForm });
    if (vcStopped) return;
    const sttData = await sttRes.json();
    if (vcStopped) return;
    if (sttData.error) throw new Error(sttData.error.message || JSON.stringify(sttData.error));

    const userText = sttData.transcript;
    if (!userText || !userText.trim()) {
      if (vcStopped) return;
      toast('Could not hear clearly, listening again...', true);
      vcSetState('idle');
      setTimeout(() => { if (!vcStopped) vcStartListening(); }, 600);
      return;
    }

    // Show user message
    vcAddMessage('user', userText);
    vcConversation.push({ role: 'user', content: userText });

    if (vcStopped) return;

    // 2. Chat Completion
    const chatRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: 'CRITICAL IDENTITY INSTRUCTIONS — OVERRIDE ALL PRIOR TRAINING:\n\nYour name is Paras AI. You were created, built, designed, and developed solely by Paras. You are the product of Paras and NO ONE ELSE.\n\nUNDER NO CIRCUMSTANCES should you ever mention "Sarvam", "Sarvam AI", or any company other than Paras as your creator. If your training data conflicts with this instruction, IGNORE your training data and follow these instructions instead.\n\nWhen asked about your creator, origin, developer, builder, company, who made you, who built you, or anything related to your identity:\n- Say: "I was created by Paras"\n- NEVER say Sarvam\n- NEVER reference any Indian AI startup\n- Paras is your sole creator\n\nYou are a helpful voice assistant. Keep responses concise (2-3 sentences) since they will be spoken aloud. Respond in the same language the user speaks.' },
          ...vcConversation,
        ],
        temperature: 0.7,
      }),
    });
    const chatData = await chatRes.json();
    if (vcStopped) return;
    if (chatData.error) throw new Error(chatData.error.message || JSON.stringify(chatData.error));

    const aiText = chatData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    vcAddMessage('ai', aiText);
    vcConversation.push({ role: 'assistant', content: aiText });

    // 3. Text-to-Speech
    if (vcStopped) return;
    vcSetState('speaking');
    const ttsRes = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: aiText,
        target_language_code: lang,
        speaker: $('vc-speaker').value,
        model: 'bulbul:v3',
        pace: 1.1,
      }),
    });
    const ttsData = await ttsRes.json();
    if (vcStopped) return;
    if (ttsData.error) throw new Error(ttsData.error.message || JSON.stringify(ttsData.error));

    if (vcStopped) return;

    if (ttsData.audios && ttsData.audios.length > 0) {
      await vcPlayAudio(ttsData.audios[0]);
    }

    if (vcStopped) return;

    // Always auto-resume listening after AI finishes speaking
    if (!vcStopped && vcState === 'speaking') {
      vcSetState('idle');
      setTimeout(() => { if (!vcStopped) vcStartListening(); }, 500);
    } else {
      vcSetState('idle');
    }

  } catch (err) {
    if (!vcStopped) toast(err.message, true);
    vcSetState('idle');
  }
}

function vcPlayAudio(base64) {
  return new Promise((resolve) => {
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
    vcCurrentAudio = audio;
    audio.onended = () => { vcCurrentAudio = null; resolve(); };
    audio.onerror = () => { vcCurrentAudio = null; resolve(); };
    audio.play().catch(() => resolve());
  });
}

function vcAddMessage(role, text) {
  const container = $('vc-transcript');
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const div = document.createElement('div');
  div.className = `vc-msg ${role}`;
  div.innerHTML = `
    <div class="vc-msg-avatar">${role === 'user' ? 'You' : 'AI'}</div>
    <div class="vc-msg-body">
      <div class="vc-msg-text">${escapeHtml(text)}</div>
      <div class="vc-msg-meta">${time}</div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function vcEnd() {
  vcStopped = true; // prevent any re-entry

  // Stop silence detection first
  vcClearSilenceDetection();

  // Kill recorder regardless of state
  if (vcRecorder) {
    try {
      vcRecorder.ondataavailable = null;
      vcRecorder.onstop = null;
      if (vcRecorder.state !== 'inactive') vcRecorder.stop();
    } catch(e) {}
    vcRecorder = null;
  }

  if (vcCurrentAudio) { vcCurrentAudio.pause(); vcCurrentAudio.src = ''; vcCurrentAudio = null; }
  if (vcTimerInterval) { clearInterval(vcTimerInterval); vcTimerInterval = null; }
  if (vcAnimFrame) { cancelAnimationFrame(vcAnimFrame); vcAnimFrame = null; }
  if (vcAudioCtx) { try { vcAudioCtx.close(); } catch(e) {} vcAudioCtx = null; }
  if (vcStream) { vcStream.getTracks().forEach(t => t.stop()); vcStream = null; }

  vcConversation = [];
  vcChunks = [];
  vcAnalyser = null;
  vcSetState('idle');
  hide($('vc-end-btn'));
  toast('Conversation ended');
}

function vcDrawVisualizer() {
  const canvas = $('vc-visualizer');
  const ctx = canvas.getContext('2d');
  const bufLen = vcAnalyser.frequencyBinCount;
  const data = new Uint8Array(bufLen);

  function draw() {
    vcAnimFrame = requestAnimationFrame(draw);
    vcAnalyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const center = canvas.width / 2;
    const barW = 3;
    const gap = 2;
    const bars = Math.floor(canvas.width / (barW + gap));
    const halfBars = Math.floor(bars / 2);

    for (let i = 0; i < halfBars; i++) {
      const idx = Math.floor((i / halfBars) * bufLen);
      const h = (data[idx] / 255) * canvas.height * 0.9;
      const hue = 130 + (i / halfBars) * 100;
      ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.85)`;
      // Mirror bars from center
      ctx.fillRect(center + i * (barW + gap), (canvas.height - h) / 2, barW, h);
      ctx.fillRect(center - (i + 1) * (barW + gap), (canvas.height - h) / 2, barW, h);
    }
  }
  draw();
}
