/**
 * FELT & FORM — MİNİMALİST JAVASCRIPT ETKİLEŞİM MOTORU
 */

document.addEventListener('DOMContentLoaded', () => {
  initAudioEngine();
  initMascotStudio();
  initMascotQuotes();
  initDockMascot();
  initMinimalLightbox();
});

/* ==========================================================================
   1. MİNİMAL SES DENEYİMİ (WEB AUDIO SİNÜS SESLERİ)
   ========================================================================== */
let audioCtx = null;
let isAudioActive = false;
let ambientTimer = null;

function initAudioEngine() {
  const btn = document.getElementById('audioToggleBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isAudioActive = !isAudioActive;
    if (isAudioActive) {
      btn.classList.add('playing');
      btn.querySelector('.audio-label').textContent = 'Sessize Al';
      playMinimalPing(587.33); // D5
      startMinimalAmbient();
    } else {
      btn.classList.remove('playing');
      btn.querySelector('.audio-label').textContent = 'Ses';
      stopMinimalAmbient();
    }
  });
}

function playMinimalPing(freq = 440) {
  if (!audioCtx || !isAudioActive) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.6);
}

function startMinimalAmbient() {
  if (ambientTimer) clearInterval(ambientTimer);
  const chords = [
    [220.00, 329.63, 440.00], // A min
    [174.61, 261.63, 349.23], // F maj
    [196.00, 293.66, 392.00]  // G maj
  ];
  let step = 0;

  function pulseChord() {
    if (!isAudioActive || !audioCtx) return;
    const now = audioCtx.currentTime;
    const triad = chords[step % chords.length];
    step++;

    triad.forEach(f => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;

      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 4.3);
    });
  }

  pulseChord();
  ambientTimer = setInterval(pulseChord, 5000);
}

function stopMinimalAmbient() {
  if (ambientTimer) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
}

/* ==========================================================================
   2. MASKOT STÜDYOSU (VEKTÖREL KEÇE TASARIMI)
   ========================================================================== */
const studioState = {
  bodyColor: '#24262b',
  eyes: 'curious',
  accessory: 'headphones',
  stitch: '#ffffff'
};

function initMascotStudio() {
  const svg = document.getElementById('mascotSvg');
  if (!svg) return;

  // Renk seçimi
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      studioState.bodyColor = dot.dataset.color;
      renderSvgMascot();
      playMinimalPing(523.25);
    });
  });

  // Göz seçimi
  document.querySelectorAll('.pill[data-eyes]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-eyes]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      studioState.eyes = pill.dataset.eyes;
      renderSvgMascot();
      playMinimalPing(659.25);
    });
  });

  // Aksesuar seçimi
  document.querySelectorAll('.pill[data-acc]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-acc]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      studioState.accessory = pill.dataset.acc;
      renderSvgMascot();
      playMinimalPing(783.99);
    });
  });

  // Dikiş ipi seçimi
  document.querySelectorAll('.pill[data-stitch]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-stitch]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      studioState.stitch = pill.dataset.stitch;
      renderSvgMascot();
      playMinimalPing(880.00);
    });
  });

  // Rastgele buton
  const randBtn = document.getElementById('randomMascotBtn');
  if (randBtn) {
    randBtn.addEventListener('click', () => {
      const colors = ['#24262b', '#4a4d52', '#7a7d84', '#544439', '#2d3d34', '#253244'];
      const eyeList = ['curious', 'wink', 'glasses', 'sleepy'];
      const accList = ['headphones', 'cupcake', 'cake', 'bowtie', 'none'];
      const stitchList = ['#ffffff', '#e6c387', '#111111'];

      studioState.bodyColor = colors[Math.floor(Math.random() * colors.length)];
      studioState.eyes = eyeList[Math.floor(Math.random() * eyeList.length)];
      studioState.accessory = accList[Math.floor(Math.random() * accList.length)];
      studioState.stitch = stitchList[Math.floor(Math.random() * stitchList.length)];

      // UI senkronize et
      syncStudioUi();
      renderSvgMascot();
      playMinimalPing(659.25);
    });
  }

  // İndir butonu
  const downloadBtn = document.getElementById('downloadMascotBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadSvg);
  }

  renderSvgMascot();
}

function syncStudioUi() {
  document.querySelectorAll('.color-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.color === studioState.bodyColor);
  });
  document.querySelectorAll('.pill[data-eyes]').forEach(p => {
    p.classList.toggle('active', p.dataset.eyes === studioState.eyes);
  });
  document.querySelectorAll('.pill[data-acc]').forEach(p => {
    p.classList.toggle('active', p.dataset.acc === studioState.accessory);
  });
  document.querySelectorAll('.pill[data-stitch]').forEach(p => {
    p.classList.toggle('active', p.dataset.stitch === studioState.stitch);
  });
}

function renderSvgMascot() {
  const svg = document.getElementById('mascotSvg');
  if (!svg) return;

  const { bodyColor, eyes, accessory, stitch } = studioState;

  // Göz katmanı
  let eyesMarkup = '';
  if (eyes === 'curious') {
    eyesMarkup = `
      <circle cx="100" cy="115" r="30" fill="#e8e5dc" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
      <circle cx="100" cy="115" r="18" fill="#18181b" />
      <circle cx="104" cy="110" r="5" fill="#ffffff" />

      <circle cx="180" cy="115" r="30" fill="#e8e5dc" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
      <circle cx="180" cy="115" r="18" fill="#18181b" />
      <circle cx="184" cy="110" r="5" fill="#ffffff" />
    `;
  } else if (eyes === 'wink') {
    eyesMarkup = `
      <circle cx="100" cy="115" r="30" fill="#e8e5dc" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
      <circle cx="100" cy="115" r="18" fill="#18181b" />
      <circle cx="104" cy="110" r="5" fill="#ffffff" />

      <circle cx="180" cy="115" r="30" fill="#e8e5dc" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
      <path d="M 165 115 Q 180 130 195 115" fill="none" stroke="#18181b" stroke-width="5" stroke-linecap="round"/>
    `;
  } else if (eyes === 'glasses') {
    eyesMarkup = `
      <circle cx="100" cy="115" r="30" fill="#e8e5dc" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
      <circle cx="100" cy="115" r="16" fill="#18181b" />
      <circle cx="104" cy="111" r="5" fill="#ffffff" />

      <circle cx="180" cy="115" r="30" fill="#e8e5dc" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
      <circle cx="180" cy="115" r="16" fill="#18181b" />
      <circle cx="184" cy="111" r="5" fill="#ffffff" />

      <!-- Minimal Gözlük -->
      <circle cx="100" cy="115" r="34" fill="none" stroke="#71717a" stroke-width="3"/>
      <circle cx="180" cy="115" r="34" fill="none" stroke="#71717a" stroke-width="3"/>
      <line x1="134" y1="115" x2="146" y2="115" stroke="#71717a" stroke-width="3"/>
    `;
  } else if (eyes === 'sleepy') {
    eyesMarkup = `
      <circle cx="100" cy="115" r="30" fill="#e8e5dc" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
      <path d="M 85 117 Q 100 105 115 117" fill="none" stroke="#18181b" stroke-width="4.5" stroke-linecap="round"/>

      <circle cx="180" cy="115" r="30" fill="#e8e5dc" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
      <path d="M 165 117 Q 180 105 195 117" fill="none" stroke="#18181b" stroke-width="4.5" stroke-linecap="round"/>
    `;
  }

  // Aksesuar katmanı
  let accMarkup = '';
  if (accessory === 'headphones') {
    accMarkup = `
      <path d="M 55 115 C 55 35, 225 35, 225 115" fill="none" stroke="#52525b" stroke-width="10" stroke-linecap="round"/>
      <path d="M 55 115 C 55 35, 225 35, 225 115" fill="none" stroke="${stitch}" stroke-width="1.5" stroke-dasharray="3,3"/>
      <rect x="44" y="94" width="18" height="42" rx="9" fill="#27272a" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1.5"/>
      <rect x="218" y="94" width="18" height="42" rx="9" fill="#27272a" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1.5"/>
    `;
  } else if (accessory === 'cupcake') {
    accMarkup = `
      <g transform="translate(195, 175) scale(0.6)">
        <polygon points="15,60 55,60 65,30 5,30" fill="#a8a29e" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1.5"/>
        <path d="M 5 30 Q 35 0 65 30 Z" fill="#ffffff" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1.5"/>
        <circle cx="35" cy="12" r="7" fill="#b91c1c" />
      </g>
    `;
  } else if (accessory === 'cake') {
    accMarkup = `
      <g transform="translate(190, 172) scale(0.6)">
        <polygon points="10,50 65,50 50,15 5,25" fill="#f5f5f4" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1.5"/>
        <polygon points="10,40 65,40 60,30 8,32" fill="#44403c"/>
        <circle cx="35" cy="12" r="6" fill="#b91c1c"/>
      </g>
    `;
  } else if (accessory === 'bowtie') {
    accMarkup = `
      <g transform="translate(140, 155)">
        <polygon points="-18,-10 -18,10 0,0" fill="#3f3f46" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1"/>
        <polygon points="18,-10 18,10 0,0" fill="#3f3f46" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1"/>
        <circle cx="0" cy="0" r="4.5" fill="#18181b"/>
      </g>
    `;
  }

  svg.innerHTML = `
    <!-- Kulak Tüyleri -->
    <polygon points="72,55 95,25 105,65" fill="${bodyColor}" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>
    <polygon points="208,55 185,25 175,65" fill="${bodyColor}" stroke="${stitch}" stroke-dasharray="3,3" stroke-width="2"/>

    <!-- Gövde -->
    <path d="M 72 85 C 45 135, 48 220, 80 240 C 112 258, 168 258, 200 240 C 232 220, 235 135, 208 85 C 190 55, 90 55, 72 85 Z" 
          fill="${bodyColor}" 
          stroke="${stitch}" 
          stroke-dasharray="4,4" 
          stroke-width="2.5" />

    <!-- Karın Keçesi -->
    <path d="M 88 155 C 88 215, 192 215, 192 155 C 170 142, 110 142, 88 155 Z" 
          fill="#f1efe9" 
          stroke="${stitch}" 
          stroke-dasharray="3,3" 
          stroke-width="2" />
    
    <!-- Kanatlar -->
    <path d="M 68 110 C 42 145, 50 195, 76 198 C 80 180, 80 140, 74 110 Z" 
          fill="${bodyColor}" 
          stroke="${stitch}" 
          stroke-dasharray="3,3" 
          stroke-width="2" />

    <path d="M 212 110 C 238 145, 230 195, 204 198 C 200 180, 200 140, 206 110 Z" 
          fill="${bodyColor}" 
          stroke="${stitch}" 
          stroke-dasharray="3,3" 
          stroke-width="2" />

    <!-- Gözler -->
    ${eyesMarkup}

    <!-- Gaga -->
    <polygon points="140,132 132,148 148,148" fill="#52525b" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1.2" />

    <!-- Pençeler -->
    <ellipse cx="112" cy="248" rx="12" ry="6" fill="#52525b" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1"/>
    <ellipse cx="168" cy="248" rx="12" ry="6" fill="#52525b" stroke="${stitch}" stroke-dasharray="2,2" stroke-width="1"/>

    <!-- Aksesuar -->
    ${accMarkup}
  `;
}

function downloadSvg() {
  const svg = document.getElementById('mascotSvg');
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'minimal-maskot-barnaby.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  playMinimalPing(783.99);
}

/* ==========================================================================
   3. MASKOT ALINTILARI
   ========================================================================== */
const quotes = [
  "Her dikiş bir sabır, her doku yeni bir anı taşır.",
  "Sessizlikte yankılanan plak cızırtısı kadar huzurlu çok az şey var.",
  "İyi bir cupcake, en sakin günleri bile bayrama dönüştürür.",
  "Vadide rüzgar keçeleri okşadığında melodiler kendiliğinden doğar.",
  "Sadelik, fazlalıkları ayıklayıp öze dokunmaktır."
];
let qIndex = 0;

function initMascotQuotes() {
  const textEl = document.getElementById('mascotQuote');
  const btn = document.getElementById('mascotQuoteBtn');
  if (!textEl || !btn) return;

  btn.addEventListener('click', () => {
    qIndex = (qIndex + 1) % quotes.length;
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = `"${quotes[qIndex]}"`;
      textEl.style.opacity = '1';
    }, 150);
    playMinimalPing(523.25);
  });
}

/* ==========================================================================
   4. DOCK MASKOT BUTONU
   ========================================================================== */
function initDockMascot() {
  const btn = document.getElementById('dockMascotBtn');
  const speech = document.getElementById('dockSpeechBubble');
  if (!btn || !speech) return;

  btn.addEventListener('click', () => {
    qIndex = (qIndex + 1) % quotes.length;
    speech.textContent = quotes[qIndex];
    speech.classList.add('active');
    playMinimalPing(659.25);

    setTimeout(() => {
      speech.classList.remove('active');
    }, 4500);
  });
}

/* ==========================================================================
   5. MİNİMAL LIGHTBOX
   ========================================================================== */
function initMinimalLightbox() {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImage');
  const caption = document.getElementById('modalCaption');
  const close = document.getElementById('modalCloseBtn');
  if (!modal || !img) return;

  document.querySelectorAll('.zoomable').forEach(item => {
    item.addEventListener('click', () => {
      img.src = item.src;
      caption.textContent = item.dataset.title || item.alt || '';
      modal.classList.add('active');
      playMinimalPing(440);
    });
  });

  close.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}