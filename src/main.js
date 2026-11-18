import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { timelineData, phasesData, DOOMSDAY_BRANCHES } from './data/timeline.js';
import { charactersData } from './data/characters.js';
import { networkGraphData } from './data/network.js';
import { stonesData } from './data/stones.js';
import { STUDIO_ASSETS, STONE_MEDIA } from './data/mediaRegistry.js';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL STATE & STORAGE
═══════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'mcu-multiverse-watched-v2';
const LEGACY_STORAGE_KEY = 'mcu_watched_v2';
const DISCOVERED_STONES_KEY = 'mcu-discovered-stones-v1';

// Merge any existing watched items from either storage key
const initialWatched = [
  ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map(String),
  ...JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '[]').map(String)
];
let watchedSet = new Set(initialWatched);
let discoveredStones = new Set(JSON.parse(localStorage.getItem(DISCOVERED_STONES_KEY) || '[]'));

let activeArchiveOrder = 'chronological'; // 'release' | 'chronological'
let activeArchiveFilter = 'all'; // 'all' | 'movie' | 'series' | 'special' | 'doomsday' | 'watched' | 'unwatched'
let archiveSearchQuery = '';
let activeDoomsdayTab = 'all';

let activeCharCategory = 'all';
let charSearchQuery = '';

let activeMultiversePhase = 'all'; // 'all' | 4 | 5 | 6

let activeNetworkMetric = 'degree'; // 'degree' | 'eigenvector' | 'betweenness'
let activeNetworkFaction = 'all';
let selectedNetworkNode = 'captain-america';

let activeStoneId = 'space';
let audioMuted = true;
let audioContext = null;

/* ═══════════════════════════════════════════════════════════════════
   FALLBACK / SAFE IMAGE HANDLER (TWO-STAGE VERIFIED FALLBACK)
═══════════════════════════════════════════════════════════════════ */
window.handleImageError = function(img, title, fallbackColor = '#1a233a', secondaryUrl = '') {
  if (secondaryUrl && !img.dataset.triedSecondary) {
    img.dataset.triedSecondary = 'true';
    img.src = secondaryUrl;
    return;
  }
  if (img.dataset.failed) return;
  img.dataset.failed = 'true';
  const cleanTitle = (title || 'Marvel Title').replace(/[^\w\s-]/gi, '').slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#05070c"/>
        <stop offset="100%" stop-color="${fallbackColor}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="150" cy="180" r="45" fill="none" stroke="#e23636" stroke-width="2" opacity="0.6"/>
    <text x="150" y="188" font-family="'Bebas Neue', sans-serif" font-size="28" fill="#e23636" text-anchor="middle">MCU</text>
    <text x="150" y="270" font-family="'Outfit', sans-serif" font-size="16" font-weight="600" fill="#f5f5f7" text-anchor="middle">${cleanTitle}</text>
    <text x="150" y="295" font-family="'Outfit', sans-serif" font-size="11" fill="#718096" text-anchor="middle">CLASSIFIED ARCHIVE</text>
  </svg>`;
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/* ═══════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
═══════════════════════════════════════════════════════════════════ */
export function showToast(message, icon = '✦') {
  let toastEl = document.getElementById('multiverse-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'multiverse-toast';
    toastEl.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(16, 23, 37, 0.95);
      border: 1px solid rgba(60, 141, 255, 0.4);
      color: #fff;
      padding: 12px 22px;
      border-radius: 30px;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(60, 141, 255, 0.3);
      backdrop-filter: blur(12px);
      z-index: 9999999;
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    `;
    document.body.appendChild(toastEl);
  }
  toastEl.innerHTML = `<span style="color: #3C8DFF; font-size: 1.1rem;">${icon}</span> <span>${message}</span>`;
  toastEl.style.transform = 'translateY(0)';
  toastEl.style.opacity = '1';
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => {
    toastEl.style.transform = 'translateY(100px)';
    toastEl.style.opacity = '0';
  }, 3200);
}

/* ═══════════════════════════════════════════════════════════════════
   AUDIO ATMOSPHERE (SYNTHESIZED WEB AUDIO API CHORD)
═══════════════════════════════════════════════════════════════════ */
function initCosmicAudio() {
  const toggleBtn = document.getElementById('audio-toggle-btn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (audioMuted) {
      playCosmicTone();
      audioMuted = false;
      toggleBtn.classList.add('active');
      toggleBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        <span>Cosmic Audio: ON</span>
      `;
      showToast('Multiverse Resonance Soundscape Initialized');
    } else {
      stopCosmicTone();
      audioMuted = true;
      toggleBtn.classList.remove('active');
      toggleBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        <span>Cosmic Audio: OFF</span>
      `;
    }
  });
}

let osc1, osc2, gainNode;
function playCosmicTone() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 3);

    // Deep cosmic drone: 55Hz (A1) and 82.4Hz (E2 fifth)
    osc1 = audioContext.createOscillator();
    osc2 = audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, audioContext.currentTime);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(82.4, audioContext.currentTime);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc1.start();
    osc2.start();
  } catch (e) {
    console.warn('Audio API warning:', e);
  }
}

function stopCosmicTone() {
  if (gainNode && audioContext) {
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1);
    setTimeout(() => {
      try {
        if (osc1) osc1.stop();
        if (osc2) osc2.stop();
      } catch (e) {}
    }, 1000);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   HERO PARTICLE CANVAS (YGGDRASIL MULTIVERSE TREE SYSTEM)
═══════════════════════════════════════════════════════════════════ */
function initHeroParticleCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 90;

  function resize() {
    width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
    height = canvas.height = canvas.parentElement.offsetHeight || 800;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const colors = ['#3C8DFF', '#00E676', '#8257FF', '#E84B4B', '#FF8A00', '#00F0FF'];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.5,
      radius: Math.random() * 2 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.7 + 0.3,
      branchAngle: (Math.random() * Math.PI) - Math.PI / 2,
    });
  }

  let animFrame;
  function render() {
    ctx.clearRect(0, 0, width, height);

    // Draw central Yggdrasil energy trunk & subtle multidimensional rays
    const cx = width / 2;
    const cy = height * 0.65;

    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, width * 0.55);
    grad.addColorStop(0, 'rgba(0, 230, 118, 0.08)');
    grad.addColorStop(0.3, 'rgba(60, 141, 255, 0.05)');
    grad.addColorStop(0.7, 'rgba(130, 87, 255, 0.03)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Floating particles with cosmic upward drift
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.y < 0) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();
    }

    animFrame = requestAnimationFrame(render);
  }
  render();
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 1: HERO DYNAMIC STATS & CTA BINDING
═══════════════════════════════════════════════════════════════════ */
function initHeroStats() {
  const titlesCount = timelineData.length;
  const hoursCount = 331; // Verified MCU & Series canonical runtime aggregate
  const charCount = charactersData.length;
  const phasesCount = phasesData.length;

  const elTitles = document.getElementById('stat-total-titles');
  const elHours = document.getElementById('stat-total-hours');
  const elChars = document.getElementById('stat-total-characters');
  const elPhases = document.getElementById('stat-total-phases');

  if (elTitles) elTitles.textContent = titlesCount;
  if (elHours) elHours.textContent = `${hoursCount}h+`;
  if (elChars) elChars.textContent = charCount;
  if (elPhases) elPhases.textContent = phasesCount;
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 2: STICKY MULTIVERSE NAV & PROGRESS BAR
═══════════════════════════════════════════════════════════════════ */
function initMultiverseNav() {
  const nav = document.getElementById('multiverse-nav');
  const progressLine = document.getElementById('scroll-progress-line');
  const navLinks = document.querySelectorAll('.nav-link');
  const stoneDots = document.querySelectorAll('.nav-stone-dot');

  // Sync discovered stones with visual dots
  function updateStoneDots() {
    stoneDots.forEach(dot => {
      const stone = dot.dataset.stone;
      if (discoveredStones.has(stone)) {
        dot.classList.add('active');
      }
    });
  }
  updateStoneDots();

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    if (progressLine) progressLine.style.width = `${progress}%`;

    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    // Active link highlighting
    const sections = ['multiverse-nexus', 'infinity-saga-section', 'multiverse-saga-section', 'doomsday-fast-track-section', 'characters-section', 'marvel-network-section', 'stones-altar-section', 'archive-section'];
    let current = '';

    for (const secId of sections) {
      const sec = document.getElementById(secId);
      if (sec) {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 200) {
          current = secId;
          break;
        }
      }
    }

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 3: ENTER THE MULTIVERSE (BRANCH REALITIES MATRIX)
═══════════════════════════════════════════════════════════════════ */
function renderBranchRealities() {
  const container = document.getElementById('branch-realities-grid');
  if (!container) return;

  const branchPhases = phasesData.filter(p => p.phase > 0);

  container.innerHTML = branchPhases.map(p => {
    return `
      <div class="branch-card" style="--branch-color: ${p.color}; --branch-glow: ${p.glow}" data-phase="${p.phase}">
        <div class="branch-card-bg"></div>
        <div class="branch-card-content">
          <div class="branch-card-badge">Phase 0${p.phase} • ${p.years}</div>
          <h3 class="branch-card-title">${p.title}</h3>
          <p class="branch-card-theme">${p.theme}</p>
          <p class="branch-card-desc">${p.description}</p>
          <div class="branch-card-foot">
            <span class="branch-stone-tag">Anchor: ${p.anchorStone}</span>
            <span class="branch-count-pill">${p.titlesCount} Titles</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click to filter archive
  container.querySelectorAll('.branch-card').forEach(card => {
    card.addEventListener('click', () => {
      const ph = card.dataset.phase;
      const targetSec = parseInt(ph, 10) <= 3 ? '#infinity-saga-section' : '#multiverse-saga-section';
      document.querySelector(targetSec)?.scrollIntoView({ behavior: 'smooth' });
      showToast(`Navigated to Phase ${ph}: ${card.querySelector('.branch-card-title').textContent}`);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 4: THE INFINITY SAGA (HORIZONTAL PINNED TIMELINE)
═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   SECTION 4: 3D COVERFLOW SLIDESHOW GALLERY (INFINITY SAGA)
   Faithful to Originkit / Framer 3D Smooth Perspective Slideshow
═══════════════════════════════════════════════════════════════════ */
let infinityActiveIndex = 0;
let infinityAutoplayTimer = null;
let infinityIsAutoplay = false;
let infinityLock = false;

function renderInfinitySaga() {
  const stage = document.getElementById('infinity-saga-track');
  if (!stage) return;

  const infinityTitles = timelineData.filter(t => t.saga === 'Infinity Saga');
  const n = infinityTitles.length;
  if (n === 0) return;

  if (infinityActiveIndex >= n) infinityActiveIndex = 0;

  // Render cards with full-bleed poster and elegant overlay matching Image 2
  stage.innerHTML = `
    <div class="coverflow-3d-track" id="infinity-coverflow-track">
      ${infinityTitles.map((t, idx) => {
        const isWatched = watchedSet.has(t.id);
        const isCrossover = t.isCrossover;
        return `
          <div class="coverflow-3d-card ${isWatched ? 'watched' : ''}" data-id="${t.id}" data-index="${idx}" role="button" aria-label="${t.title}" tabindex="0">
            <img src="${t.poster}" alt="${t.title}" class="coverflow-card-poster-img" loading="lazy" draggable="false" onerror="handleImageError(this, '${t.title.replace(/'/g, "\\'")}')" />
            <div class="coverflow-card-gradient" aria-hidden="true"></div>
            <div class="coverflow-card-info-overlay">
              <div class="coverflow-badge-row">
                <span class="coverflow-phase-tag">Phase ${t.phase}</span>
                ${isCrossover ? `<span class="coverflow-crossover-tag">✦ Crossover</span>` : ''}
                <span class="coverflow-order-tag">#${t.releaseOrder}</span>
              </div>
              <h3 class="coverflow-card-title ${t.franchiseFont || ''}">${t.title}</h3>
              <div class="coverflow-card-meta">
                <span class="meta-timeline">🕐 ${t.inUniverseYear || t.year}</span>
                <span class="meta-dot">•</span>
                <span class="meta-year">${t.year}</span>
                ${isWatched ? '<span class="meta-watched-badge">✓ WATCHED</span>' : ''}
              </div>
            </div>
            <div class="coverflow-card-dim" aria-hidden="true"></div>
            <div class="coverflow-card-spotlight" aria-hidden="true"></div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  const track = document.getElementById('infinity-coverflow-track');
  if (!track) return;
  const cards = track.querySelectorAll('.coverflow-3d-card');

  function updateCoverflow() {
    const counter = document.getElementById('infinity-coverflow-counter');
    if (counter) {
      const curNum = String(infinityActiveIndex + 1).padStart(2, '0');
      const totNum = String(n).padStart(2, '0');
      counter.textContent = `TITLE ${curNum} / ${totNum}`;
    }

    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    
    // Exact Originkit constants matching Image 2:
    // MAX_VISIBLE = 2 (exactly 5 cards in view: -2, -1, 0, +1, +2)
    // tilt = 14, sideTilt = 7, depth = 240, scaleStep = 0.16
    const gap = isMobile ? 5.2 : isTablet ? 6.8 : 7.6;
    const stepX = gap * 30; // 228px on desktop, exactly spacing cards next to each other
    const depth = isMobile ? 180 : 240;
    const tilt = isMobile ? 10 : 14; // Y tilt inwards
    const sideTilt = isMobile ? 4 : 7; // Z tilt banking
    const scaleStep = 0.16;
    const maxVisible = 2; // Exact match to Image 2: 2 cards left, 1 center, 2 cards right

    cards.forEach((card, i) => {
      let rel = i - infinityActiveIndex;
      // Seamless infinite looping wrap
      if (rel > n / 2) rel -= n;
      if (rel < -n / 2) rel += n;

      const ax = Math.abs(rel);
      const visible = ax <= maxVisible;
      const isActive = rel === 0;

      const sc = Math.max(0.4, 1 - ax * scaleStep);
      const tx = rel * stepX;
      const tz = -ax * depth;
      const ry = -rel * tilt; // -rel * tilt tilts inwards towards center
      const rz = rel * sideTilt;

      card.style.transform = `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`;
      card.style.zIndex = Math.round(100 - ax * 10);
      card.style.opacity = visible ? 1 : 0;
      card.style.pointerEvents = visible ? 'auto' : 'none';
      card.setAttribute('aria-hidden', !visible);
      card.classList.toggle('active', isActive);

      // Inactive card dim overlay opacity: 0 for active, 0.45 for ±1, 0.65 for ±2
      const dimOverlay = card.querySelector('.coverflow-card-dim');
      if (dimOverlay) {
        dimOverlay.style.opacity = isActive ? '0' : (ax === 1 ? '0.45' : '0.65');
      }
    });
  }

  function stepCoverflow(dir) {
    if (infinityLock) return;
    infinityLock = true;
    setTimeout(() => { infinityLock = false; }, 420);

    infinityActiveIndex = (((infinityActiveIndex + dir) % n) + n) % n;
    updateCoverflow();
  }

  // Card click behavior:
  // If clicking on an inactive card, smoothly slide it to center.
  // If clicking on the active center card, open the movie detail dossier modal!
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index, 10);
      if (idx !== infinityActiveIndex) {
        if (infinityLock) return;
        infinityLock = true;
        setTimeout(() => { infinityLock = false; }, 420);
        infinityActiveIndex = idx;
        updateCoverflow();
      } else {
        const id = card.dataset.id;
        const item = timelineData.find(t => t.id === id);
        if (item) openMovieModal(item);
      }
    });
  });

  // Track button controls
  const prevBtn = document.getElementById('infinity-track-prev');
  const nextBtn = document.getElementById('infinity-track-next');
  if (prevBtn) {
    prevBtn.onclick = () => stepCoverflow(-1);
  }
  if (nextBtn) {
    nextBtn.onclick = () => stepCoverflow(1);
  }

  // Autoplay button control
  const autoBtn = document.getElementById('infinity-coverflow-autoplay');
  if (autoBtn) {
    autoBtn.onclick = () => {
      infinityIsAutoplay = !infinityIsAutoplay;
      autoBtn.classList.toggle('playing', infinityIsAutoplay);
      autoBtn.textContent = infinityIsAutoplay ? '⏸ PAUSE' : '▶ AUTO';
      if (infinityIsAutoplay) {
        startInfinityAutoplay();
      } else {
        stopInfinityAutoplay();
      }
    };
  }

  function startInfinityAutoplay() {
    stopInfinityAutoplay();
    infinityAutoplayTimer = setInterval(() => {
      stepCoverflow(1);
    }, 2800);
  }

  function stopInfinityAutoplay() {
    if (infinityAutoplayTimer) {
      clearInterval(infinityAutoplayTimer);
      infinityAutoplayTimer = null;
    }
  }

  // Pause on hover over stage
  stage.onmouseenter = () => {
    if (infinityIsAutoplay) stopInfinityAutoplay();
  };
  stage.onmouseleave = () => {
    if (infinityIsAutoplay) startInfinityAutoplay();
  };

  // Keyboard navigation when stage is focused
  stage.onkeydown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepCoverflow(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepCoverflow(-1);
    } else if (e.key === 'Enter') {
      const item = infinityTitles[infinityActiveIndex];
      if (item) openMovieModal(item);
    }
  };

  // Pointer drag / swipe support
  let pointerStartX = 0;
  let isPointerDown = false;
  stage.onpointerdown = (e) => {
    pointerStartX = e.clientX;
    isPointerDown = true;
  };
  stage.onpointerup = (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    const diff = e.clientX - pointerStartX;
    if (Math.abs(diff) > 40) {
      stepCoverflow(diff > 0 ? -1 : 1);
    }
  };
  stage.onpointercancel = () => { isPointerDown = false; };

  // Horizontal wheel / trackpad swipe
  let wheelLock = false;
  stage.onwheel = (e) => {
    if (Math.abs(e.deltaX) > 25 || (e.shiftKey && Math.abs(e.deltaY) > 25)) {
      e.preventDefault();
      if (!wheelLock) {
        wheelLock = true;
        stepCoverflow((e.deltaX > 0 || e.deltaY > 0) ? 1 : -1);
        setTimeout(() => { wheelLock = false; }, 360);
      }
    }
  };

  // Window resize recalculates geometry dynamically
  window.addEventListener('resize', () => {
    updateCoverflow();
  }, { passive: true });

  // Initial layout calculation
  updateCoverflow();
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 5: THE MULTIVERSE SAGA (PHASES 4, 5, 6 & INCURSIONS)
═══════════════════════════════════════════════════════════════════ */
function renderMultiverseSaga() {
  const container = document.getElementById('multiverse-saga-cards');
  if (!container) return;

  let multiverseTitles = timelineData.filter(t => t.saga === 'Multiverse Saga');
  if (activeMultiversePhase !== 'all') {
    multiverseTitles = multiverseTitles.filter(t => t.phase === parseInt(activeMultiversePhase, 10));
  }

  container.innerHTML = multiverseTitles.map(t => {
    const isWatched = watchedSet.has(t.id);
    const isUpcoming = t.status === 'upcoming';
    const dimBadge = t.dimension || 'Earth-616';

    return `
      <div class="multiverse-item-card ${isWatched ? 'watched' : ''} ${isUpcoming ? 'upcoming' : ''}" data-id="${t.id}">
        <div class="multiverse-card-poster">
          <img src="${t.poster}" alt="${t.title}" loading="lazy" onerror="handleImageError(this, '${t.title.replace(/'/g, "\\'")}')" />
          <div class="dim-badge">${dimBadge}</div>
          <div class="status-badge ${isUpcoming ? 'upcoming-badge' : 'released-badge'}">
            ${isUpcoming ? '⏳ Upcoming' : '✓ Released'}
          </div>
        </div>
        <div class="multiverse-card-details">
          <div class="multiverse-card-meta">
            <span class="m-phase">Phase ${t.phase} • ${t.inUniverseYear || t.year}</span>
            <span class="m-year">${t.year}</span>
          </div>
          <h4 class="multiverse-card-title ${t.franchiseFont || ''}">${t.title}</h4>
          <p class="multiverse-card-desc">${t.synopsis || t.hook || ''}</p>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.multiverse-item-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const item = timelineData.find(t => t.id === id);
      if (item) openMovieModal(item);
    });
  });
}

function initMultiverseTabs() {
  const tabs = document.querySelectorAll('.phase-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeMultiversePhase = tab.dataset.phase;
      renderMultiverseSaga();
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 6: CHARACTER UNIVERSE (AUDITED 49 CHARACTERS)
═══════════════════════════════════════════════════════════════════ */
function renderCharacterGallery() {
  const grid = document.getElementById('characters-grid');
  if (!grid) return;

  let list = charactersData;

  // Filter by category
  if (activeCharCategory !== 'all') {
    list = list.filter(c => c.category === activeCharCategory || (c.affiliations && c.affiliations.includes(activeCharCategory)));
  }

  // Filter by search query
  if (charSearchQuery.trim()) {
    const q = charSearchQuery.toLowerCase();
    list = list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.realName.toLowerCase().includes(q) ||
      (c.identity && c.identity.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">No characters match "${charSearchQuery}" in this category.</div>`;
    return;
  }

  grid.innerHTML = list.map(c => {
    const rawAnomalies = c.rawAudit && c.rawAudit.anomaliesFound ? '⚠ Audited' : '✓ Verified';
    const safeName = c.name.replace(/'/g, "\\'");
    const fbPoster = (c.fallbackPoster || '').replace(/'/g, "\\'");
    return `
      <div class="character-card" data-id="${c.id}" style="--char-accent: ${c.accentColor || '#3C8DFF'}">
        <div class="char-card-media">
          <img src="${c.image}" alt="${c.name}" loading="lazy" onerror="handleImageError(this, '${safeName}', '${c.accentColor || '#1a233a'}', '${fbPoster}')" />
          <div class="char-universe-pill">${c.universe}</div>
          <div class="char-audit-status">${rawAnomalies}</div>
        </div>
        <div class="char-card-info">
          <h3 class="char-name ${c.franchiseFont || ''}">${c.name}</h3>
          <div class="char-real-name">${c.realName}</div>
          <div class="char-role-badge">${c.identity} • ${c.category}</div>
          
          <div class="char-power-strip">
            <span class="power-label">${typeof c.powerLevel === 'string' ? c.powerLevel : 'Power & Centrality Index'}</span>
            <div class="power-bar-wrap">
              <div class="power-bar-fill" style="width: ${c.powerLevel?.combat || 85}%;"></div>
            </div>
          </div>
          
          <button class="char-dossier-btn" data-id="${c.id}">Classified Dossier →</button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.character-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = card.dataset.id;
      const charObj = charactersData.find(c => c.id === id);
      if (charObj) openCharacterDossier(charObj);
    });
  });
}

function initCharacterFilters() {
  const pills = document.querySelectorAll('.char-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCharCategory = pill.dataset.category;
      renderCharacterGallery();
    });
  });

  const searchInput = document.getElementById('char-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      charSearchQuery = e.target.value;
      renderCharacterGallery();
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 7: THE MARVEL NETWORK (INTERACTIVE GRAPH & CENTRALITIES)
═══════════════════════════════════════════════════════════════════ */
function initMarvelNetwork() {
  const svg = document.getElementById('network-svg');
  if (!svg) return;

  const width = 800;
  const height = 550;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Filter nodes by faction if needed
  let nodes = networkGraphData.nodes;
  let edges = networkGraphData.edges;

  if (activeNetworkFaction !== 'all') {
    nodes = nodes.filter(n => n.faction === activeNetworkFaction);
    const nodeIds = new Set(nodes.map(n => n.id));
    edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
  }

  // Calculate dynamic radius based on active metric
  function getNodeRadius(node) {
    if (activeNetworkMetric === 'degree') {
      return 14 + (node.degreeCentrality / 0.30) * 18;
    } else if (activeNetworkMetric === 'eigenvector') {
      return 14 + (node.eigenvectorCentrality / 0.12) * 18;
    } else { // betweenness
      return 14 + (node.betweennessCentrality / 0.08) * 18;
    }
  }

  // Draw Edges
  const edgeElements = edges.map(edge => {
    const sNode = nodes.find(n => n.id === edge.source);
    const tNode = nodes.find(n => n.id === edge.target);
    if (!sNode || !tNode) return '';

    const isConnectedToSelected = selectedNetworkNode && (edge.source === selectedNetworkNode || edge.target === selectedNetworkNode);

    return `
      <line 
        x1="${sNode.x}" y1="${sNode.y}" 
        x2="${tNode.x}" y2="${tNode.y}" 
        stroke="${isConnectedToSelected ? '#00E676' : 'rgba(255, 255, 255, 0.12)'}" 
        stroke-width="${isConnectedToSelected ? 2.5 : 1}" 
        stroke-dasharray="${edge.type === 'rivalry' ? '4,4' : 'none'}"
        opacity="${isConnectedToSelected ? 0.9 : 0.35}"
        class="network-edge"
        data-source="${edge.source}"
        data-target="${edge.target}"
      />
    `;
  }).join('');

  // Draw Nodes
  const nodeElements = nodes.map(node => {
    const r = getNodeRadius(node);
    const isSelected = selectedNetworkNode === node.id;
    const isConnected = edges.some(e => 
      (e.source === selectedNetworkNode && e.target === node.id) ||
      (e.target === selectedNetworkNode && e.source === node.id)
    );
    const highlight = isSelected || isConnected;

    return `
      <g class="network-node-group" data-id="${node.id}" style="cursor: pointer;">
        <circle 
          cx="${node.x}" cy="${node.y}" r="${r}" 
          fill="${node.color}" 
          stroke="${isSelected ? '#fff' : 'rgba(255, 255, 255, 0.3)'}" 
          stroke-width="${isSelected ? 3 : 1.5}"
          opacity="${highlight ? 1 : 0.4}"
          class="network-node-circle"
          filter="drop-shadow(0 0 ${isSelected ? 16 : 8}px ${node.color})"
        />
        <text 
          x="${node.x}" y="${node.y + r + 13}" 
          text-anchor="middle" 
          fill="${highlight ? '#fff' : 'rgba(255, 255, 255, 0.5)'}" 
          font-family="'Outfit', sans-serif" 
          font-size="${isSelected ? 12 : 10}px" 
          font-weight="${isSelected ? 700 : 500}"
        >${node.label}</text>
      </g>
    `;
  }).join('');

  svg.innerHTML = `
    <defs>
      <radialGradient id="net-bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0a101d"/>
        <stop offset="100%" stop-color="#04060a"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#net-bg)" rx="14"/>
    <g class="edges-layer">${edgeElements}</g>
    <g class="nodes-layer">${nodeElements}</g>
  `;

  // Bind node click interactions
  svg.querySelectorAll('.network-node-group').forEach(group => {
    group.addEventListener('click', () => {
      const id = group.dataset.id;
      selectedNetworkNode = id;
      initMarvelNetwork();
      updateNetworkMetricsPanel(id);
    });
  });

  updateNetworkMetricsPanel(selectedNetworkNode);
}

function updateNetworkMetricsPanel(nodeId) {
  const panel = document.getElementById('network-metrics-display');
  if (!panel) return;

  const node = networkGraphData.nodes.find(n => n.id === nodeId);
  if (!node) return;

  // Find connections
  const connectedEdges = networkGraphData.edges.filter(e => e.source === nodeId || e.target === nodeId);
  const connectedNeighbors = connectedEdges.map(e => e.source === nodeId ? e.target : e.source);

  panel.innerHTML = `
    <div class="metric-card" style="border-left: 4px solid ${node.color}">
      <div class="metric-card-header">
        <span class="metric-title">${node.label}</span>
        <span class="metric-badge">${node.faction.toUpperCase()}</span>
      </div>
      <p class="metric-desc">${node.lore}</p>
      
      <div class="metric-leaders-list" style="margin-top: 1rem;">
        <div class="metric-row">
          <span class="metric-row-name">Degree Centrality (Direct Allies)</span>
          <span class="metric-row-val">${node.degreeCentrality.toFixed(2)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-row-name">Eigenvector Centrality (Network Power)</span>
          <span class="metric-row-val">${node.eigenvectorCentrality.toFixed(4)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-row-name">Betweenness Centrality (Multiverse Bridge)</span>
          <span class="metric-row-val">${node.betweennessCentrality.toFixed(4)}</span>
        </div>
      </div>

      <div style="margin-top: 1.2rem; font-size: 0.72rem; color: var(--text-secondary);">
        <strong style="color: #fff;">Direct Co-Occurrences (${connectedNeighbors.length}):</strong><br/>
        ${connectedNeighbors.join(' • ')}
      </div>
    </div>
  `;
}

function initNetworkControls() {
  const factionSelect = document.getElementById('network-faction-select');
  if (factionSelect) {
    factionSelect.addEventListener('change', (e) => {
      activeNetworkFaction = e.target.value;
      initMarvelNetwork();
    });
  }

  const metricTabs = document.querySelectorAll('.network-metric-btn');
  metricTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      metricTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeNetworkMetric = btn.dataset.metric;
      initMarvelNetwork();
      showToast(`Graph scaled by ${btn.textContent}`);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 8: THE SIX INFINITY STONES (COSMIC ALTARS & DISCOVERY)
═══════════════════════════════════════════════════════════════════ */
function renderStonesAltars() {
  const container = document.getElementById('stones-pedestals-grid');
  if (!container) return;

  container.innerHTML = stonesData.map(s => {
    const isActive = s.id === activeStoneId;
    return `
      <div class="stone-pedestal ${isActive ? 'active' : ''}" 
           data-stone="${s.id}" 
           style="--stone-color: ${s.color}; --stone-glow: ${s.glow};">
        <div class="stone-orb-visual" style="display:flex;align-items:center;justify-content:center;overflow:hidden;">
          ${s.imageUrl ? `<img src="${s.imageUrl}" alt="${s.name}" style="width:42px;height:42px;object-fit:contain;filter:drop-shadow(0 0 8px ${s.color});" onerror="this.style.display='none'" />` : ''}
        </div>
        <h4 class="stone-name-title">${s.name}</h4>
        <div class="stone-aspect-label">${s.aspect}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.stone-pedestal').forEach(ped => {
    ped.addEventListener('click', () => {
      const id = ped.dataset.stone;
      activeStoneId = id;
      markStoneDiscovered(id);
      renderStonesAltars();
      updateStoneFeaturePanel(id);
    });
  });

  updateStoneFeaturePanel(activeStoneId);
}

function updateStoneFeaturePanel(stoneId) {
  const panel = document.getElementById('stone-feature-panel');
  if (!panel) return;

  const s = stonesData.find(item => item.id === stoneId);
  if (!s) return;

  const section = document.getElementById('stones-altar-section');
  if (section) {
    section.style.setProperty('--active-stone-color', s.color);
    section.style.background = `radial-gradient(circle at center 40%, ${s.glow} 0%, rgba(5, 7, 12, 0.98) 70%)`;
  }

  const journeyHTML = (s.timelineJourney || []).map(step => `
    <li style="font-size: 0.78rem; color: #CBD5E1; line-height: 1.45; margin-bottom: 6px; padding-left: 10px; border-left: 2px solid ${s.color};">
      ${step}
    </li>
  `).join('');

  panel.innerHTML = `
    <div class="stone-feature-left">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <span style="font-size: 0.8rem; font-weight: 700; color: ${s.color}; letter-spacing: 0.15em; text-transform: uppercase;">Cosmic Singularity</span>
        <span style="font-size: 0.7rem; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 10px;">${s.aspect}</span>
      </div>
      <h3>The ${s.name}</h3>
      <p class="stone-quote">"${s.quote}"</p>
      <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 1.2rem;">${s.lore}</p>
      
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1rem;">
        <span style="font-size: 0.72rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.1em;">First Appearance in Multiverse:</span>
        <div style="font-size: 0.85rem; color: var(--stone-space); margin-top: 4px;">${s.firstAppearance} (${s.yearIntroduced})</div>
      </div>
    </div>
    <div class="stone-feature-right">
      <div class="stone-data-meta">
        <div class="stone-meta-row">
          <span class="stone-meta-key">Known Cosmic Vessels</span>
          <span class="stone-meta-val" style="color: #fff;">${s.vessels.join(' • ')}</span>
        </div>
        <div class="stone-meta-row">
          <span class="stone-meta-key">Notable Historical Wielders</span>
          <span class="stone-meta-val">${s.wielders.join(', ')}</span>
        </div>
        <div class="stone-meta-row">
          <span class="stone-meta-key">Infinity Saga Movement Timeline</span>
          <ul style="list-style: none; padding: 0; margin-top: 6px;">${journeyHTML}</ul>
        </div>
      </div>
    </div>
  `;
}

function markStoneDiscovered(stoneId) {
  discoveredStones.add(stoneId);
  localStorage.setItem(DISCOVERED_STONES_KEY, JSON.stringify([...discoveredStones]));
  
  const navDot = document.querySelector(`.nav-stone-dot[data-stone="${stoneId}"]`);
  if (navDot) navDot.classList.add('active');

  if (discoveredStones.size === 6) {
    showToast('✦ All 6 Infinity Stones Harmonized! Gauntlet Ready.', '💎');
  } else {
    showToast(`Discovered ${stoneId.toUpperCase()} Stone (${discoveredStones.size}/6)`);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   3-SECOND MARVEL STUDIOS INTRO & INTERACTIVE 7-BRANCH MULTIVERSE TREE
═══════════════════════════════════════════════════════════════════ */
let introTimers = [];

function dismissStudioIntro() {
  introTimers.forEach(t => clearTimeout(t));
  introTimers = [];
  const intro = document.getElementById('marvel-studio-intro');
  if (!intro) return;
  intro.classList.add('intro-exit');
  document.body.style.overflow = '';
  setTimeout(() => {
    intro.style.display = 'none';
  }, 450);
}

function playStudioIntro() {
  const intro = document.getElementById('marvel-studio-intro');
  const redBg = document.getElementById('intro-red-bg');
  const logoStage = document.getElementById('intro-logo-stage');
  const blackout = document.getElementById('intro-blackout');
  if (!intro) return;

  introTimers.forEach(t => clearTimeout(t));
  introTimers = [];

  intro.style.display = 'flex';
  intro.classList.remove('intro-exit');
  redBg?.classList.remove('active');
  logoStage?.classList.remove('revealed');
  blackout?.classList.remove('active');
  document.body.style.overflow = 'hidden';

  introTimers.push(setTimeout(() => redBg?.classList.add('active'), 200));
  introTimers.push(setTimeout(() => logoStage?.classList.add('revealed'), 450));
  introTimers.push(setTimeout(() => blackout?.classList.add('active'), 2250));
  introTimers.push(setTimeout(() => {
    intro.classList.add('intro-exit');
    document.body.style.overflow = '';
  }, 2700));
  introTimers.push(setTimeout(() => {
    intro.style.display = 'none';
  }, 3150));
}

function initStudioIntro() {
  const replayBtn = document.getElementById('btn-replay-studio-intro');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      playStudioIntro();
    });
  }

  const skipBtn = document.getElementById('btn-skip-studio-intro');
  if (skipBtn) {
    skipBtn.addEventListener('click', dismissStudioIntro);
  }

  // Always play the 3-second Marvel Studios opening animation on load
  playStudioIntro();
}

function playCloudTransition(onCovered, onComplete, duration = 650) {
  let canvas = document.getElementById('cinematic-cloud-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'cinematic-cloud-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:999995;pointer-events:none;opacity:0;';
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  const w = canvas.width = window.innerWidth;
  const h = canvas.height = window.innerHeight;
  canvas.style.opacity = '1';

  const puffs = Array.from({ length: 36 }, () => ({
    xOffset: (Math.random() - 0.5) * w * 1.1,
    yRatio: Math.random(),
    radius: (0.35 + Math.random() * 0.4) * Math.max(w, h),
    density: 0.85 + Math.random() * 0.15
  }));

  const start = performance.now();
  let coveredDone = false;

  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    ctx.clearRect(0, 0, w, h);

    const opacityCurve = p < 0.45 ? p / 0.45 : (p < 0.65 ? 1 : 1 - (p - 0.65) / 0.35);
    const sweepX = (Math.sin(p * Math.PI * 0.5) * 2.2 - 0.6) * w;

    for (const puff of puffs) {
      const px = sweepX + puff.xOffset;
      const py = puff.yRatio * h;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, puff.radius);
      const a = Math.min(1, opacityCurve * puff.density);
      grad.addColorStop(0, `rgba(2, 6, 4, ${a})`);
      grad.addColorStop(0.5, `rgba(6, 18, 11, ${a * 0.92})`);
      grad.addColorStop(1, 'rgba(2, 6, 4, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, puff.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (p >= 0.45 && !coveredDone) {
      coveredDone = true;
      if (onCovered) onCovered();
    }

    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, w, h);
      canvas.style.opacity = '0';
      if (onComplete) onComplete();
    }
  }
  requestAnimationFrame(frame);
}

let activeHeroBranchIdx = null;

function initMultiverseTreeBranches() {
  const heroSec = document.getElementById('hero');
  const doomStage = document.getElementById('hero-doom-bg-stage');
  const doomPerimeterHud = document.getElementById('hero-doom-perimeter-hud');
  const lokiTreeStage = document.getElementById('loki-tree-interactive-stage');
  const backBtn = document.getElementById('tree-hero-back-btn');
  const nextBtn = document.getElementById('tree-hero-next-btn');
  const earthPanel = document.getElementById('tree-earth-panel');
  const openLokiTreeBtn = document.getElementById('btn-open-loki-tree');

  function activateBranch(branchIdx = 4) {
    const branch = DOOMSDAY_BRANCHES[branchIdx] || DOOMSDAY_BRANCHES[4];
    if (!branch || !heroSec) return;
    activeHeroBranchIdx = branchIdx;

    playCloudTransition(() => {
      if (doomStage) {
        doomStage.style.background = `#020805 url('/images/loki-multiverse-4k.jpg') center 24% / cover no-repeat`;
      } else {
        heroSec.style.background = `#020805 url('/images/loki-multiverse-4k.jpg') center 24% / cover no-repeat`;
      }

      if (doomPerimeterHud) doomPerimeterHud.style.display = 'none';
      if (lokiTreeStage) lokiTreeStage.style.display = 'flex';
      if (backBtn) backBtn.style.display = 'inline-flex';
      if (nextBtn) {
        nextBtn.style.display = 'inline-flex';
        const nextIdx = (branchIdx % 7) + 1;
        nextBtn.textContent = `NEXT TIMELINE BRANCH (0${nextIdx}) →`;
      }

      document.querySelectorAll('.hero-branch-chip, .loki-strand-node').forEach(node => {
        node.classList.toggle('active', parseInt(node.dataset.branch, 10) === branchIdx);
      });

      if (earthPanel) {
        earthPanel.style.display = 'block';
        const moviesHTML = branch.movies.map(m => {
          const item = timelineData.find(t => t.id === String(m.id));
          const poster = item?.poster || `https://mcu-timelines.vercel.app/photos/${m.id}.jpg?v=2`;
          const isWatched = watchedSet.has(String(m.id));
          return `
            <div class="loki-movie-card-chip" data-movie-id="${m.id}">
              <img src="${poster}" alt="${m.title}" loading="lazy" />
              <div class="loki-movie-chip-info">
                <strong>${m.title} ${isWatched ? '✓' : ''}</strong>
                <span>${m.year}</span>
              </div>
            </div>
          `;
        }).join('');

        earthPanel.innerHTML = `
          <div class="loki-console-top">
            <div class="loki-console-title-block">
              <div class="loki-console-kicker">YGGDRASIL BRANCH 0${branchIdx} // ${branch.universeCode || branch.label}</div>
              <h3>${branch.title}</h3>
              <p class="loki-console-lore">${branch.lokiAnalysis || branch.tagline}</p>
            </div>
            <div class="loki-telemetry-badges">
              <div class="loki-t-pill">
                <small>TEMPORAL ERA</small>
                <strong>${branch.temporalSpan || 'Multiverse Era'}</strong>
              </div>
              <div class="loki-t-pill">
                <small>ANCHOR BEING</small>
                <strong>${branch.anchorBeing || 'Nexus Anchor'}</strong>
              </div>
              <div class="loki-t-pill">
                <small>DOOMSDAY STATUS</small>
                <strong style="color: ${branch.color};">${branch.incursionStatus || 'ACTIVE BRANCH'}</strong>
              </div>
            </div>
          </div>
          <div class="loki-movies-row">
            ${moviesHTML}
          </div>
        `;

        earthPanel.querySelectorAll('.loki-movie-card-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const mId = chip.dataset.movieId;
            const item = timelineData.find(t => t.id === String(mId));
            if (item) openMovieModal(item);
          });
        });
      }
    });
  }

  function resetTreeToOverview() {
    if (!heroSec) return;
    activeHeroBranchIdx = null;
    playCloudTransition(() => {
      if (doomStage) {
        doomStage.style.background = `#020604 url('/images/doom-entrance-4k.jpg') center 20% / cover no-repeat`;
      } else {
        heroSec.style.background = `#020604 url('/images/doom-entrance-4k.jpg') center 20% / cover no-repeat`;
      }

      if (doomPerimeterHud) doomPerimeterHud.style.display = 'grid';
      if (lokiTreeStage) lokiTreeStage.style.display = 'none';
      if (backBtn) backBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      document.querySelectorAll('.hero-branch-chip, .loki-strand-node').forEach(c => c.classList.remove('active'));
    });
  }

  openLokiTreeBtn?.addEventListener('click', () => activateBranch(4));

  document.querySelectorAll('[data-branch]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.branch, 10);
      if (idx) activateBranch(idx);
    });
  });

  backBtn?.addEventListener('click', resetTreeToOverview);
  nextBtn?.addEventListener('click', () => {
    const nextIdx = activeHeroBranchIdx ? (activeHeroBranchIdx % 7) + 1 : 1;
    activateBranch(nextIdx);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 5B: DOOMSDAY FAST-TRACK WATCHLIST
═══════════════════════════════════════════════════════════════════ */
function renderDoomsdaySection() {
  const grid = document.getElementById('doomsday-grid');
  if (!grid) return;

  const essentialItems = timelineData.filter(t => t.doomsdayEssential);
  const watchedEssential = essentialItems.filter(t => watchedSet.has(t.id)).length;
  const totalEssential = essentialItems.length;
  const pctEssential = totalEssential > 0 ? Math.round((watchedEssential / totalEssential) * 100) : 0;

  const valEl = document.getElementById('dd-prog-val');
  const fillEl = document.getElementById('dd-prog-fill');
  if (valEl) valEl.textContent = `${watchedEssential} / ${totalEssential} Essential Watched (${pctEssential}%)`;
  if (fillEl) fillEl.style.width = `${pctEssential}%`;

  let filtered = essentialItems;
  if (activeDoomsdayTab !== 'all') {
    filtered = essentialItems.filter(t => t.doomsdayCategory === activeDoomsdayTab);
  }

  grid.innerHTML = filtered.map(item => {
    const isWatched = watchedSet.has(item.id);
    const safeTitle = item.title.replace(/'/g, "\\'");
    return `
      <div class="dd-card ${isWatched ? 'watched' : ''}" data-id="${item.id}">
        <div class="dd-card-top">
          <img src="${item.poster}" alt="${item.title}" class="dd-poster" loading="lazy" onerror="handleImageError(this, '${safeTitle}')" />
          <div class="dd-card-info">
            <div>
              <span class="dd-category-tag">${item.doomsdayCategory || 'Essential'}</span>
              <span class="dd-card-year">🕐 ${item.inUniverseYear || item.year} • ${item.year}</span>
            </div>
            <div class="dd-card-title ${item.franchiseFont || ''}">${item.title}</div>
            <div class="dd-reason-box">${item.doomsdayReason}</div>
            ${item.doomsdayEpisodes ? `<div class="dd-episodes-box">💡 ${item.doomsdayEpisodes}</div>` : ''}
          </div>
        </div>
        <div class="dd-card-footer">
          <a href="${item.watchUrl}" target="_blank" rel="noopener noreferrer" class="dd-watch-btn">
            <span>▶ Watch on ${item.watch}</span>
          </a>
          <button class="dd-check-btn" data-dd-watch="${item.id}">
            ${isWatched ? '✓ Watched' : '+ Mark Watched'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-dd-watch]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWatched(btn.dataset.ddWatch);
    });
  });

  grid.querySelectorAll('.dd-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const item = timelineData.find(t => t.id === card.dataset.id);
      if (item) openMovieModal(item);
    });
  });
}

function initDoomsdayFastTrack() {
  document.querySelectorAll('.dd-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dd-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDoomsdayTab = btn.dataset.ddTab;
      renderDoomsdaySection();
    });
  });

  // Calibrated exact target synchronized with avengerscountdown.com & global theatrical premiere:
  // Dec 18, 2026 05:00:00 UTC (10:30:00 AM IST)
  // Perfectly synchronized to Indian Standard Time (IST)
  const DOOMSDAY_TARGET_ISO = '2026-12-18T05:00:00Z';
  const DOOMSDAY_TARGET_MS = Date.parse(DOOMSDAY_TARGET_ISO);
  const SECRET_WARS_TARGET_MS = Date.parse('2027-12-17T05:00:00Z');

  const elMonths = document.getElementById('cd-months');
  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMinutes = document.getElementById('cd-minutes');
  const elSeconds = document.getElementById('cd-seconds');
  const ddEl = document.getElementById('dd-countdown-doomsday');
  const swEl = document.getElementById('dd-countdown-secretwars');

  let prevValues = { m: '', d: '', h: '', min: '', s: '' };

  function addUTCMonths(date, months) {
    const d = new Date(date);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months);
    const maxDays = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(date.getUTCDate(), maxDays));
    return d;
  }

  function computeDoomsdayTimeLeft(targetMs, now) {
    const targetDate = new Date(targetMs);
    const nowDate = new Date(now);
    if (nowDate >= targetDate) {
      return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
    }
    let n = (targetDate.getUTCFullYear() - nowDate.getUTCFullYear()) * 12 + targetDate.getUTCMonth() - nowDate.getUTCMonth();
    if (addUTCMonths(nowDate, n) > targetDate) n--;
    const l = Math.floor((targetDate.getTime() - addUTCMonths(nowDate, n).getTime()) / 1000);
    const totalDays = Math.floor((targetDate.getTime() - nowDate.getTime()) / 86400000);
    return {
      months: n,
      days: Math.floor(l / 86400),
      hours: Math.floor(l / 3600) % 24,
      minutes: Math.floor(l / 60) % 60,
      seconds: l % 60,
      totalDays
    };
  }

  function updateDigitWithScroll(el, newVal, key, isMinuteOrHigher = false) {
    if (!el) return;
    if (prevValues[key] !== newVal) {
      const hadPrev = prevValues[key] !== '';
      prevValues[key] = newVal;
      el.textContent = newVal;
      if (hadPrev) {
        const animClass = isMinuteOrHigher ? 'minute-pulse' : 'tick-scroll';
        el.classList.remove('tick-scroll', 'minute-pulse');
        void el.offsetWidth;
        el.classList.add(animClass);
      }
    }
  }

  function tickDoomsdayCountdown() {
    const now = Date.now();
    const time = computeDoomsdayTimeLeft(DOOMSDAY_TARGET_MS, now);

    const strM = String(time.months).padStart(2, '0');
    const strD = String(time.days).padStart(2, '0');
    const strH = String(time.hours).padStart(2, '0');
    const strMin = String(time.minutes).padStart(2, '0');
    const strS = String(time.seconds).padStart(2, '0');

    updateDigitWithScroll(elMonths, strM, 'm', true);
    updateDigitWithScroll(elDays, strD, 'd', true);
    updateDigitWithScroll(elHours, strH, 'h', true);
    updateDigitWithScroll(elMinutes, strMin, 'min', true);
    updateDigitWithScroll(elSeconds, strS, 's', false);

    if (ddEl) {
      ddEl.textContent = `DEC 18, 2026 (${time.totalDays}d ${strH}h ${strMin}m)`;
    }
    if (swEl) {
      const swDiff = SECRET_WARS_TARGET_MS - now;
      if (swDiff > 0) {
        const swDays = Math.ceil(swDiff / (1000 * 60 * 60 * 24));
        swEl.textContent = `DEC 17, 2027 (${swDays}d)`;
      }
    }
  }

  tickDoomsdayCountdown();
  setInterval(tickDoomsdayCountdown, 1000);

  // Wire Doomsday Theatrical Dossier modal
  const dossierModal = document.getElementById('doomsday-theatrical-dossier-modal');
  const btnOpenDossier = document.getElementById('btn-open-doomsday-dossier');
  const btnCloseDossier = document.getElementById('btn-close-doomsday-dossier');

  if (btnOpenDossier && dossierModal) {
    btnOpenDossier.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dossierModal.classList.add('active');
    });
  }
  if (btnCloseDossier && dossierModal) {
    btnCloseDossier.addEventListener('click', (e) => {
      e.preventDefault();
      dossierModal.classList.remove('active');
    });
  }
  if (dossierModal) {
    dossierModal.addEventListener('click', (e) => {
      if (e.target === dossierModal) {
        dossierModal.classList.remove('active');
      }
    });
  }

  renderDoomsdaySection();
}

/* ═══════════════════════════════════════════════════════════════════
   MARVEL TRAILER INTERMISSION ENGINE (CHARACTER-BY-CHARACTER & SOUND VISUALS)
═══════════════════════════════════════════════════════════════════ */
const TRAILER_ROTATION_SLATES = [
  {
    headline: 'THE MULTIVERSE IS COLLAPSING.',
    accents: 'MULTIVERSE:ember,COLLAPSING.:crimson',
    tag: 'INCURSION WARNING // <strong>AVENGERS: DOOMSDAY</strong>',
    sub: 'Across the Sacred Timeline and branching realities, six phases of gods, soldiers, and cosmic conquerors collide toward a single point of no return.',
    pill: 'NEXT GLOBAL EVENT: <span class="pill-highlight">AVENGERS: DOOMSDAY (MAY 2026)</span>'
  },
  {
    headline: 'EVERY UNIVERSE HAS AN END.',
    accents: 'EVERY:ember,UNIVERSE:white,END.:crimson',
    tag: 'BEYOND THE SACRED TIMELINE // <strong>INCURSION ALERT</strong>',
    sub: 'Parallel Earths are colliding in the dark. When two universes occupy the same space, only one can survive the impact.',
    pill: 'OMEGA THREAT: <span class="pill-highlight">MULTIVERSE INCURSIONS</span>'
  },
  {
    headline: 'THE FINAL COUNTDOWN HAS BEGUN.',
    accents: 'FINAL:ember,COUNTDOWN:crimson,BEGUN.:white',
    tag: 'PHASE 06 DIRECTIVE // <strong>ROAD TO DOOMSDAY</strong>',
    sub: 'The clock is ticking across every timeline. Every alliance forged and every stone shattered leads directly to Victor Von Doom.',
    pill: 'COUNTDOWN LOCKED: <span class="pill-highlight">AVENGERS: DOOMSDAY • MAY 1, 2026</span>'
  },
  {
    headline: 'ARE YOU READY FOR DOOMSDAY?',
    accents: 'READY:ember,DOOMSDAY?:crimson',
    tag: 'THE CONQUEROR ARRIVES // <strong>AVENGERS: DOOMSDAY</strong>',
    sub: 'No armor, no mystic spell, and no timeline branch is prepared for the iron mask of Doctor Doom.',
    pill: 'THEATRICAL EVENT: <span class="pill-highlight">AVENGERS: DOOMSDAY</span>'
  },
  {
    headline: 'ONE LAST BATTLE. INFINITE CONSEQUENCES.',
    accents: 'LAST:ember,BATTLE.:crimson,INFINITE:ember,CONSEQUENCES.:crimson',
    tag: 'THE GRAND CONVERGENCE // <strong>AVENGERS: SECRET WARS</strong>',
    sub: 'Earth-616, Fox Mutants, the Fantastic Four, and the Spider-Verse converge for the ultimate war for existence.',
    pill: 'SAGA FINALE: <span class="pill-highlight">AVENGERS: SECRET WARS (MAY 2027)</span>'
  },
  {
    headline: 'THE END OF EVERYTHING IS JUST THE BEGINNING.',
    accents: 'END:crimson,EVERYTHING:crimson,BEGINNING.:ember',
    tag: 'BATTLEWORLD AWAITS // <strong>SECRET WARS & BEYOND</strong>',
    sub: 'Out of the ashes of collapsed timelines, a new Marvel cosmos will be forged.',
    pill: 'DESTINY: <span class="pill-highlight">AVENGERS: DOOMSDAY & SECRET WARS</span>'
  }
];

const PHASE_INTERMISSION_COPY = {
  0: {
    kicker: 'PHASE 00 // LEGACY CONTINUUMS & ORIGINS',
    headline: 'THE END OF EVERYTHING IS JUST THE BEGINNING.',
    accents: 'END:crimson,EVERYTHING:crimson,BEGINNING.:ember',
    sub: 'Legacy mutant realities and wartime origins that anchor the road to Avengers: Secret Wars.'
  },
  1: {
    kicker: 'PHASE 01 // THE AVENGERS INITIATIVE (2008–2012)',
    headline: 'SIX HEROES. ONE SINGULARITY. ZERO TURNING BACK.',
    accents: 'SIX:ember,SINGULARITY.:crimson,BACK.:ember',
    sub: 'The Tesseract awakens and Earth’s Mightiest Heroes assemble for the first time.'
  },
  2: {
    kicker: 'PHASE 02 // COSMIC EXPANSION & ULTRON (2013–2015)',
    headline: 'EVERY UNIVERSE HAS AN END.',
    accents: 'EVERY:ember,UNIVERSE:white,END.:crimson',
    sub: 'The Aether and Power Stone emerge in deep space while S.H.I.E.L.D. collapses from within.'
  },
  3: {
    kicker: 'PHASE 03 // CIVIL WAR TO ENDGAME (2016–2019)',
    headline: 'ONE LAST BATTLE. INFINITE CONSEQUENCES.',
    accents: 'LAST:ember,BATTLE.:crimson,INFINITE:ember,CONSEQUENCES.:crimson',
    sub: 'Divided heroes face Thanos across Titan and Wakanda before risking everything in the Time Heist.'
  },
  4: {
    kicker: 'PHASE 04 // FRACTURING REALITIES (2021–2022)',
    headline: 'THE MULTIVERSE IS COLLAPSING.',
    accents: 'MULTIVERSE:ember,COLLAPSING.:crimson',
    sub: 'He Who Remains falls, the Sacred Timeline branches, and rifts tear open across dimensions.'
  },
  5: {
    kicker: 'PHASE 05 // INCURSIONS & ANCHOR BEINGS (2023–2025)',
    headline: 'THE FINAL COUNTDOWN HAS BEGUN.',
    accents: 'FINAL:ember,COUNTDOWN:crimson,BEGUN.:white',
    sub: 'The Void, the Quantum Realm, and the New Avengers set the stage for Doctor Doom’s arrival.'
  },
  6: {
    kicker: 'PHASE 06 // THE MULTIVERSE SAGA ENDGAME (2025–2027)',
    headline: 'ARE YOU READY FOR DOOMSDAY?',
    accents: 'READY:ember,DOOMSDAY?:crimson',
    sub: 'The Fantastic Four arrive as all timelines converge in Avengers: Doomsday and Avengers: Secret Wars.'
  }
};

function parseAccentMap(accentSpec = '') {
  const map = {};
  accentSpec.split(',').forEach(pair => {
    const [word, style] = pair.split(':');
    if (word && style) map[word.trim().toUpperCase()] = style.trim();
  });
  return map;
}

function buildCharRevealHTML(text, accentSpec = '') {
  const accentMap = parseAccentMap(accentSpec);
  const words = text.trim().split(/\s+/);
  let charIndex = 0;

  return words.map(word => {
    const upper = word.toUpperCase();
    const cleaned = upper.replace(/[.,?!:;]/g, '');
    const accentType = accentMap[upper] || accentMap[cleaned] || 'white';
    const charsHTML = [...word].map(ch => {
      const idx = charIndex++;
      return `<span class="tr-char" style="--char-idx: ${idx}">${ch}</span>`;
    }).join('');
    return `<span class="tr-word accent-${accentType}">${charsHTML}</span>`;
  }).join(' ');
}

function buildSoundwaveHTML(barCount = 14) {
  let bars = '';
  for (let i = 0; i < barCount; i++) {
    const waveIdx = Math.abs((barCount / 2) - i);
    bars += `<span class="eq-bar" style="--eq-i: ${waveIdx}"></span>`;
  }
  return bars;
}

let trailerObserver = null;

function observeIntermissionElements(root = document) {
  if (!trailerObserver) {
    trailerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        } else if (entry.boundingClientRect.top > 0) {
          entry.target.classList.remove('is-revealed');
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  }

  root.querySelectorAll('.trailer-intermission, .phase-intermission-banner').forEach(el => {
    trailerObserver.observe(el);
  });
}

function initTrailerIntermissions() {
  document.querySelectorAll('.trailer-soundwave').forEach(sw => {
    sw.innerHTML = buildSoundwaveHTML(14);
  });

  document.querySelectorAll('.trailer-hype-headline').forEach(h2 => {
    const rawText = h2.dataset.hypeText || h2.textContent.trim();
    const accents = h2.dataset.accents || '';
    h2.innerHTML = buildCharRevealHTML(rawText, accents);
  });

  const firstIntermission = document.querySelector('.trailer-intermission[data-intermission-idx="0"]');
  if (firstIntermission) {
    const switcher = firstIntermission.querySelector('.trailer-slate-switcher');
    let currentSlate = 0;

    function applySlate(idx) {
      currentSlate = idx;
      const slate = TRAILER_ROTATION_SLATES[idx];
      const h2 = firstIntermission.querySelector('.trailer-hype-headline');
      const tag = firstIntermission.querySelector('.trailer-event-tag');
      const sub = firstIntermission.querySelector('.trailer-sub-narration');
      const pill = firstIntermission.querySelector('.trailer-countdown-pill');

      firstIntermission.classList.remove('is-revealed');
      void firstIntermission.offsetWidth;

      if (h2) h2.innerHTML = buildCharRevealHTML(slate.headline, slate.accents);
      if (tag) tag.innerHTML = slate.tag;
      if (sub) sub.textContent = slate.sub;
      if (pill) pill.innerHTML = slate.pill;

      if (switcher) {
        switcher.querySelectorAll('.trailer-slate-dot').forEach((d, i) => {
          d.classList.toggle('active', i === idx);
        });
      }

      requestAnimationFrame(() => {
        firstIntermission.classList.add('is-revealed');
      });
    }

    if (switcher) {
      switcher.innerHTML = TRAILER_ROTATION_SLATES.map((s, i) => `
        <button class="trailer-slate-dot ${i === 0 ? 'active' : ''}" data-slate="${i}" aria-label="Show trailer message ${i + 1}: ${s.headline}"></button>
      `).join('');

      switcher.querySelectorAll('.trailer-slate-dot').forEach(btn => {
        btn.addEventListener('click', () => {
          applySlate(parseInt(btn.dataset.slate, 10));
        });
      });

      setInterval(() => {
        const rect = firstIntermission.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > 80;
        if (inView && !document.hidden) {
          applySlate((currentSlate + 1) % TRAILER_ROTATION_SLATES.length);
        }
      }, 6500);
    }
  }

  observeIntermissionElements(document);
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 9: MOVIE ARCHIVE (RELEASE ORDER & CHRONOLOGICAL DUAL MODES)
═══════════════════════════════════════════════════════════════════ */
function getRankBadge(pct) {
  if (pct >= 100) return '💀 Secret Wars Legend';
  if (pct >= 80) return '⚡ Timeline Master';
  if (pct >= 60) return '🧠 Multiverse Walker';
  if (pct >= 40) return '🔥 Infinity Survivor';
  if (pct >= 20) return '⚔️ Avenger';
  if (pct >= 1) return '🛡️ Recruit';
  return '🧬 Multiverse Newbie';
}

function renderArchiveCardHTML(t, nextUnwatchedId) {
  const isWatched = watchedSet.has(t.id);
  const isNext = t.id === nextUnwatchedId;
  const orderNum = activeArchiveOrder === 'chronological' ? t.chronologicalOrder : t.releaseOrder;
  const typeLabel = t.type === 'movie' ? 'Film' : (t.type === 'series' ? 'Series' : 'Special');
  const typeClass = t.type === 'movie' ? 'meta-type-movie' : 'meta-type-series';

  return `
    <div class="archive-card ${isWatched ? 'watched' : ''}" id="archive-card-${t.id}" data-id="${t.id}">
      <div class="archive-card-poster">
        <img src="${t.poster}" alt="${t.title}" loading="lazy" onerror="handleImageError(this, '${t.title.replace(/'/g, "\\'")}')" />
        ${isNext ? `<div class="archive-next-badge">NEXT UP</div>` : ''}
        ${t.doomsdayEssential ? `<div class="archive-dd-badge">⚡ DOOMSDAY</div>` : ''}
        <div class="archive-seq-pill">#${orderNum}</div>
        <button class="archive-watched-check" data-id="${t.id}" title="Toggle Watched" aria-label="Mark ${t.title} as watched">
          ✓
        </button>
      </div>
      <div class="archive-card-body">
        <div class="archive-card-meta">
          <span class="${typeClass}">${typeLabel}</span>
          <span title="In-Universe Chronological Era">🕐 ${t.inUniverseYear || t.year}</span>
          <span style="opacity:0.7;">${t.year}</span>
        </div>
        <h4 class="archive-card-title ${t.franchiseFont || ''}">${t.title}</h4>
        <p class="archive-card-summary">${t.synopsis || t.hook || ''}</p>
        <a href="${t.watchUrl}" target="_blank" rel="noopener noreferrer" class="archive-watch-link" onclick="event.stopPropagation();">
          <span>● Watch on ${t.watch}</span>
        </a>
      </div>
    </div>
  `;
}

function updateUpNextBanner(sortedList) {
  const nextItem = sortedList.find(t => !watchedSet.has(t.id));
  const banner = document.getElementById('up-next-banner');
  const titleEl = document.getElementById('up-next-title');
  const jumpBtn = document.getElementById('up-next-jump-btn');
  const heroNextTitle = document.getElementById('hero-up-next-title');
  const heroNextBtn = document.getElementById('hero-up-next-jump-btn');

  const scrollToNext = () => {
    if (!nextItem) return;
    const card = document.getElementById(`archive-card-${nextItem.id}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.boxShadow = '0 0 30px #00E676';
      setTimeout(() => { card.style.boxShadow = ''; }, 1800);
    }
  };

  if (heroNextTitle) {
    heroNextTitle.textContent = nextItem
      ? `${nextItem.title} (${nextItem.inUniverseYear || nextItem.year})`
      : 'All 77 Titles Completed! 🏆';
  }
  if (heroNextBtn) {
    heroNextBtn.onclick = scrollToNext;
  }

  if (!banner || !titleEl) return nextItem ? nextItem.id : null;

  if (nextItem) {
    banner.style.display = 'flex';
    titleEl.textContent = `${nextItem.title} (${nextItem.year}) • ${nextItem.dimension}`;
    if (jumpBtn) {
      jumpBtn.onclick = scrollToNext;
    }
    return nextItem.id;
  } else {
    banner.style.display = 'none';
    return null;
  }
}

function renderMovieArchive() {
  const grid = document.getElementById('archive-grid');
  if (!grid) return;

  let list = [...timelineData];

  // Sort strictly by active mode
  if (activeArchiveOrder === 'chronological') {
    list.sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
  } else {
    list.sort((a, b) => a.releaseOrder - b.releaseOrder);
  }

  const nextUnwatchedId = updateUpNextBanner(list);

  // Filter by media type / status
  if (activeArchiveFilter === 'movie' || activeArchiveFilter === 'series' || activeArchiveFilter === 'special') {
    list = list.filter(t => t.type === activeArchiveFilter);
  } else if (activeArchiveFilter === 'doomsday') {
    list = list.filter(t => t.doomsdayEssential);
  } else if (activeArchiveFilter === 'watched') {
    list = list.filter(t => watchedSet.has(t.id));
  } else if (activeArchiveFilter === 'unwatched') {
    list = list.filter(t => !watchedSet.has(t.id));
  }

  // Filter by search
  const hasSearch = Boolean(archiveSearchQuery.trim());
  if (hasSearch) {
    const q = archiveSearchQuery.toLowerCase();
    list = list.filter(t => 
      t.title.toLowerCase().includes(q) ||
      (t.year && t.year.toLowerCase().includes(q)) ||
      (t.dimension && t.dimension.toLowerCase().includes(q)) ||
      (t.phase !== undefined && `phase ${t.phase}`.includes(q))
    );
  }

  updateArchiveStats();

  if (list.length === 0) {
    grid.className = 'archive-grid';
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">No titles match your archive filter.</div>`;
    return;
  }

  // In Chronological mode without search, group by Phase with trailer intermissions;
  // In Release Order mode, render in strict theatrical release sequence with Phase badges!
  if (!hasSearch && activeArchiveOrder === 'chronological' && activeArchiveFilter === 'all') {
    grid.className = 'timeline-phases-stack';
    const phasesOrder = [0, 1, 2, 3, 4, 5, 6];
    const blocksHTML = phasesOrder.map(pNum => {
      const phaseItems = list.filter(item => item.phase === pNum);
      if (phaseItems.length === 0) return '';

      const watchedInPhase = phaseItems.filter(item => watchedSet.has(item.id)).length;
      const copy = PHASE_INTERMISSION_COPY[pNum] || PHASE_INTERMISSION_COPY[6];
      const charHTML = buildCharRevealHTML(copy.headline, copy.accents);
      const soundHTML = buildSoundwaveHTML(10);

      return `
        <div class="timeline-phase-block" data-phase-block="${pNum}">
          <div class="phase-intermission-banner">
            <div class="phase-intermission-left">
              <div class="phase-intermission-kicker">
                <span class="trailer-rec-dot"></span>
                <span>${copy.kicker}</span>
                <span class="trailer-soundwave" aria-hidden="true">${soundHTML}</span>
              </div>
              <h3 class="phase-intermission-quote">${charHTML}</h3>
              <p class="phase-intermission-sub">${copy.sub}</p>
            </div>
            <div class="phase-intermission-right">
              <span class="phase-meta-badge">PHASE 0${pNum}</span>
              <span class="phase-watched-pill">${watchedInPhase} / ${phaseItems.length} WATCHED</span>
            </div>
          </div>
          <div class="archive-grid">
            ${phaseItems.map(t => renderArchiveCardHTML(t, nextUnwatchedId)).join('')}
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = blocksHTML;
    observeIntermissionElements(grid);
  } else {
    grid.className = 'archive-grid';
    grid.innerHTML = list.map(t => renderArchiveCardHTML(t, nextUnwatchedId)).join('');
  }

  // Bind clicks
  grid.querySelectorAll('.archive-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.archive-watched-check')) {
        e.stopPropagation();
        toggleWatched(card.dataset.id);
        return;
      }
      if (e.target.closest('a')) return;
      const item = timelineData.find(t => t.id === card.dataset.id);
      if (item) openMovieModal(item);
    });
  });
}

function saveWatchedState() {
  const arr = [...watchedSet];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(arr.map(Number).filter(n => !Number.isNaN(n))));
}

function toggleWatched(id) {
  const strId = String(id);
  if (watchedSet.has(strId)) {
    watchedSet.delete(strId);
    showToast('Removed from Watched Archives');
  } else {
    watchedSet.add(strId);
    showToast('Marked as Watched ✓', '🛡');
  }
  saveWatchedState();
  renderMovieArchive();
  renderDoomsdaySection();
  renderInfinitySaga();
  renderMultiverseSaga();
}

function updateArchiveStats() {
  const total = timelineData.length;
  const count = [...watchedSet].filter(id => timelineData.some(t => t.id === String(id))).length;
  const unwatched = Math.max(0, total - count);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  const essentialItems = timelineData.filter(t => t.doomsdayEssential);
  const totalEssential = essentialItems.length;
  const watchedEssential = essentialItems.filter(t => watchedSet.has(t.id)).length;
  const needEssential = Math.max(0, totalEssential - watchedEssential);

  const countEl = document.getElementById('archive-watched-count');
  const pctEl = document.getElementById('archive-watched-pct');
  const rankEl = document.getElementById('archive-agent-rank');

  if (countEl) countEl.textContent = `${count} / ${total}`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (rankEl) rankEl.textContent = getRankBadge(pct);

  // Sync Top Navbar Live Watch Summary Pill
  const navWatchedRatio = document.getElementById('nav-watched-ratio');
  const navDoomsdayRatio = document.getElementById('nav-doomsday-ratio');
  if (navWatchedRatio) navWatchedRatio.textContent = `🛡️ ${count}/${total}`;
  if (navDoomsdayRatio) navDoomsdayRatio.textContent = `⚡ ${watchedEssential}/${totalEssential}`;

  // Sync Opening Hero Live Watch Telemetry Widget
  const heroWatchedEl = document.getElementById('hero-stat-watched');
  const heroUnwatchedEl = document.getElementById('hero-stat-unwatched');
  const heroDdNeedEl = document.getElementById('hero-stat-dd-need');
  const heroPctEl = document.getElementById('hero-telemetry-pct');
  const heroBarFillEl = document.getElementById('hero-telemetry-bar-fill');
  const heroRankEl = document.getElementById('hero-telemetry-rank');

  if (heroWatchedEl) heroWatchedEl.textContent = `${count} / ${total}`;
  if (heroUnwatchedEl) heroUnwatchedEl.textContent = `${unwatched}`;
  if (heroDdNeedEl) {
    heroDdNeedEl.textContent = needEssential === 0 ? '✓ Ready!' : `${needEssential} Left`;
    const lbl = heroDdNeedEl.nextElementSibling;
    if (lbl) lbl.textContent = `Need for Doomsday (${watchedEssential}/${totalEssential})`;
  }
  if (heroPctEl) heroPctEl.textContent = `${pct}%`;
  if (heroBarFillEl) heroBarFillEl.style.width = `${pct}%`;
  if (heroRankEl) heroRankEl.textContent = getRankBadge(pct);

  // Sync Infinity Stone nav dots with sixths of watch progress
  const placedStones = Math.floor((count / total) * 6 + 1e-9);
  document.querySelectorAll('.nav-stone-dot').forEach((dot, idx) => {
    if (idx < placedStones || discoveredStones.has(dot.dataset.stone)) {
      dot.classList.add('active');
    }
  });
}

function initArchiveControls() {
  const modeBtns = document.querySelectorAll('.archive-mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeArchiveOrder = btn.dataset.order;
      renderMovieArchive();
      showToast(activeArchiveOrder === 'release' ? 'Sorted by Theatrical Release Date (2000–2027)' : 'Sorted by In-Universe Story Chronology');
    });
  });

  const typeBtns = document.querySelectorAll('.archive-type-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeArchiveFilter = btn.dataset.type;
      renderMovieArchive();
    });
  });

  const searchInput = document.getElementById('archive-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      archiveSearchQuery = e.target.value;
      renderMovieArchive();
    });
  }

  const markAllBtn = document.getElementById('btn-mark-all-watched');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      timelineData.forEach(t => watchedSet.add(t.id));
      saveWatchedState();
      showToast('All 79 Titles Marked as Watched! 💀 Secret Wars Legend Unlocked!', '🏆');
      renderMovieArchive();
      renderDoomsdaySection();
      renderInfinitySaga();
      renderMultiverseSaga();
    });
  }

  const resetAllBtn = document.getElementById('btn-reset-watched');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      document.getElementById('snap-confirm-modal')?.classList.add('open');
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   1080x1920 NATIVE STORY PROGRESS CARD GENERATOR & SHARE MODAL
═══════════════════════════════════════════════════════════════════ */
function generateStoryProgressCanvas(count, total, stageText, badgeText) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
  bgGrad.addColorStop(0, '#05070c');
  bgGrad.addColorStop(0.5, '#0c1020');
  bgGrad.addColorStop(1, '#040508');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1920);

  const glowGrad = ctx.createRadialGradient(540, 320, 30, 540, 320, 520);
  glowGrad.addColorStop(0, 'rgba(232, 57, 43, 0.18)');
  glowGrad.addColorStop(1, 'rgba(232, 57, 43, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 1080, 800);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, 984, 1824);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px "Outfit", sans-serif';
  ctx.fillText('MARVEL MULTIVERSE TIMELINE', 540, 310);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 260px "Outfit", sans-serif';
  ctx.fillText(String(count), 540, 650);

  ctx.fillStyle = '#9AA6B8';
  ctx.font = '600 34px "Outfit", sans-serif';
  ctx.fillText(`OF ${total} CANONICAL TITLES WATCHED`, 540, 810);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '400 38px "Outfit", sans-serif';
  ctx.fillText(stageText, 540, 890);

  ctx.fillStyle = '#FF8A00';
  ctx.font = 'bold 32px "Outfit", sans-serif';
  ctx.fillText(badgeText.toUpperCase(), 540, 1005);

  const pct = total > 0 ? Math.min(1, count / total) : 0;
  const barX = 190, barY = 1150, barW = 700, barH = 18;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(barX, barY, barW, barH);
  if (pct > 0) {
    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fillGrad.addColorStop(0, '#E8392B');
    fillGrad.addColorStop(1, '#FF8A00');
    ctx.fillStyle = fillGrad;
    ctx.fillRect(barX, barY, Math.max(18, barW * pct), barH);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Outfit", sans-serif';
  ctx.fillText('BUILT BY ORIGIN MAX', 540, 1680);
  ctx.fillStyle = '#E8392B';
  ctx.font = '500 24px "Outfit", sans-serif';
  ctx.fillText('mcutime-line.netlify.app', 540, 1730);

  return canvas.toDataURL('image/png', 1.0);
}

function openShareModal() {
  const modal = document.getElementById('share-progress-modal');
  if (!modal) return;

  const total = timelineData.length;
  const count = [...watchedSet].filter(id => timelineData.some(t => t.id === String(id))).length;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const badge = getRankBadge(pct);
  let stage = 'Beginning the Multiverse Journey';
  if (pct >= 100) stage = 'Complete MCU & Multiverse Veteran';
  else if (pct >= 75) stage = 'Deep in the Multiverse Saga';
  else if (pct >= 50) stage = 'Entering the Multiverse Era';
  else if (pct >= 25) stage = 'Surviving the Infinity Saga';
  else if (pct >= 1) stage = 'Assembling the Avengers';

  const numEl = document.getElementById('share-num');
  const ofEl = document.getElementById('share-of-text');
  const subEl = document.getElementById('share-sub');
  const badgeEl = document.getElementById('share-badge');
  const barEl = document.getElementById('share-bar');

  if (numEl) numEl.textContent = count;
  if (ofEl) ofEl.textContent = `of ${total} titles watched (${pct}%)`;
  if (subEl) subEl.textContent = stage;
  if (badgeEl) badgeEl.textContent = badge;
  if (barEl) barEl.style.width = `${pct}%`;

  modal.classList.add('open');
}

function initShareModal() {
  document.getElementById('nav-share-trigger')?.addEventListener('click', openShareModal);
  document.getElementById('btn-open-share')?.addEventListener('click', openShareModal);

  document.getElementById('btn-share-download-png')?.addEventListener('click', () => {
    const total = timelineData.length;
    const count = [...watchedSet].filter(id => timelineData.some(t => t.id === String(id))).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const dataUrl = generateStoryProgressCanvas(count, total, document.getElementById('share-sub')?.textContent || '', getRankBadge(pct));
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'mcu-multiverse-progress.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloaded 1080×1920 Story Progress Card!');
  });

  document.getElementById('btn-share-copy-link')?.addEventListener('click', () => {
    const url = window.location.href.split('#')[0];
    navigator.clipboard?.writeText(url);
    showToast('Timeline link copied to clipboard!');
  });

  document.querySelectorAll('[data-share-social]').forEach(btn => {
    btn.addEventListener('click', () => {
      const total = timelineData.length;
      const count = [...watchedSet].filter(id => timelineData.some(t => t.id === String(id))).length;
      const url = encodeURIComponent(window.location.href.split('#')[0]);
      const text = encodeURIComponent(`I've watched ${count}/${total} Marvel Multiverse titles! Track your journey:`);
      const platform = btn.dataset.shareSocial;
      const shareUrls = {
        whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
        telegram: `https://t.me/share/url?url=${url}&text=${text}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
      };
      if (shareUrls[platform]) window.open(shareUrls[platform], '_blank', 'noopener');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   CINEMATIC MODALS (CHARACTER DOSSIER & MOVIE DETAILS)
═══════════════════════════════════════════════════════════════════ */
function openCharacterDossier(charObj) {
  let modal = document.getElementById('character-dossier-modal');
  if (!modal) return;

  const content = modal.querySelector('.modal-dynamic-body');
  if (!content) return;

  const auditNote = charObj.rawAudit && charObj.rawAudit.anomaliesFound 
    ? `<div class="dossier-audit-alert">
        <strong>⚠ Raw Dataset Audit Disclosure:</strong> ${charObj.rawAudit.note}
       </div>`
    : '';

  const powersPills = (charObj.powers || []).map(p => `
    <span style="font-size: 0.72rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 4px 10px; border-radius: 12px; color: #E2E8F0;">${p}</span>
  `).join('');

  const appearancesList = (charObj.notableAppearances || []).join(' • ');
  const safeName = charObj.name.replace(/'/g, "\\'");
  const fbPoster = (charObj.fallbackPoster || '').replace(/'/g, "\\'");

  content.innerHTML = `
    <div class="dossier-layout">
      <div class="dossier-media">
        <img src="${charObj.image}" alt="${charObj.name}" onerror="handleImageError(this, '${safeName}', '${charObj.accentColor || '#1a233a'}', '${fbPoster}')" />
        <div style="position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.85); padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; border: 1px solid var(--border-bright);">
          ${charObj.universe}
        </div>
      </div>
      <div class="dossier-content">
        <div class="dossier-header">
          <div style="font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase; color: ${charObj.accentColor || '#3C8DFF'}; font-weight: 700;">
            ${charObj.category?.toUpperCase() || 'CLASSIFIED'} • ${charObj.identity}
          </div>
          <h2 class="${charObj.franchiseFont || ''}">${charObj.name}</h2>
          <div class="dossier-realname">${charObj.realName}</div>
        </div>

        ${auditNote}

        <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-primary);">${charObj.bio || ''}</p>

        ${powersPills ? `
          <div>
            <span style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); display: block; margin-bottom: 6px;">Canonical Powers &amp; Capabilities</span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">${powersPills}</div>
          </div>
        ` : ''}

        <div style="margin-top: 0.5rem; padding-top: 0.85rem; border-top: 1px solid var(--border-subtle); font-size: 0.76rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 6px;">
          <div>Key Appearances: <strong style="color: #fff;">${appearancesList || 'Marvel Continuum'}</strong></div>
          <div>Network Centrality: <strong style="color: #00E676;">Degree ${(charObj.networkDegree || 0.15).toFixed(2)} • Eigenvector ${(charObj.networkEigen || 0.06).toFixed(4)}</strong></div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function openMovieModal(item) {
  let modal = document.getElementById('movie-detail-modal');
  if (!modal) return;

  const content = modal.querySelector('.modal-dynamic-body');
  if (!content) return;

  const isWatched = watchedSet.has(item.id);

  content.innerHTML = `
    <div class="dossier-layout">
      <div class="dossier-media">
        <img src="${item.poster}" alt="${item.title}" onerror="handleImageError(this, '${item.title.replace(/'/g, "\\'")}')" />
      </div>
      <div class="dossier-content">
        <div class="dossier-header">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 6px;">
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--stone-space); letter-spacing: 0.12em; text-transform: uppercase;">
              Phase ${item.phase} • ${item.saga}
            </span>
            <span style="font-size: 0.68rem; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 8px;">
              ${item.type.toUpperCase()}
            </span>
            <span style="font-size: 0.68rem; background: rgba(0,230,118,0.12); color: #00E676; padding: 2px 8px; border-radius: 8px;">
              ${item.dimension}
            </span>
          </div>
          <h2 class="${item.franchiseFont || ''}">${item.title}</h2>
          <div class="dossier-realname">In-Universe Era: ${item.inUniverseYear || item.year} • Released: ${item.year} • Release #${item.releaseOrder} • Chronological #${item.chronologicalOrder}</div>
        </div>

        <p style="font-size: 0.92rem; line-height: 1.6; color: var(--text-primary);">${item.synopsis || item.hook || ''}</p>

        ${item.doomsdayReason ? `
          <div style="background: rgba(0, 230, 118, 0.08); border: 1px solid rgba(0, 230, 118, 0.35); border-radius: 10px; padding: 12px 16px;">
            <span style="font-size: 0.68rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #00E676;">⚡ Essential for Avengers: Doomsday (${item.doomsdayCategory}):</span>
            <p style="font-size: 0.8rem; color: #E2E8F0; margin-top: 4px;">${item.doomsdayReason}</p>
            ${item.doomsdayEpisodes ? `<p style="font-size: 0.74rem; color: #FACC15; margin-top: 4px;">💡 ${item.doomsdayEpisodes}</p>` : ''}
          </div>
        ` : ''}

        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 1rem;">
          <button class="btn-toggle-watched-modal" style="
            background: ${isWatched ? '#00E676' : 'rgba(255,255,255,0.08)'};
            color: ${isWatched ? '#000' : '#fff'};
            border: 1px solid ${isWatched ? '#00E676' : 'var(--border-bright)'};
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
          ">
            ${isWatched ? '✓ Watched' : '+ Mark as Watched'}
          </button>
          <a href="${item.watchUrl}" target="_blank" rel="noopener noreferrer" class="btn-cosmic-ghost" style="padding: 10px 20px;">
            ▶ Watch on ${item.watch}
          </a>
        </div>
      </div>
    </div>
  `;

  const watchBtn = content.querySelector('.btn-toggle-watched-modal');
  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      toggleWatched(item.id);
      openMovieModal(item);
    });
  }

  modal.classList.add('open');
}

function initModalHandlers() {
  document.querySelectorAll('.cinematic-modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.modal-close-cross')) {
        modal.classList.remove('open');
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.cinematic-modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════
   EASTER EGGS: THANOS GAUNTLET SNAP, MJOLNIR, SPIDER-WEB & SLING RING
═══════════════════════════════════════════════════════════════════ */
function executeThanosSnap(wipeStorage = false) {
  document.getElementById('snap-confirm-modal')?.classList.remove('open');
  const gauntlet = document.getElementById('thanos-gauntlet-container');
  const flash = document.getElementById('snap-white-flash');

  try {
    const audio = new Audio(STUDIO_ASSETS.thanosSnapAudio);
    audio.volume = 0.65;
    audio.play().catch(() => {});
  } catch (e) {}

  if (gauntlet) gauntlet.style.bottom = '40px';

  setTimeout(() => {
    if (flash) flash.style.opacity = '1';
    if (gauntlet) gauntlet.style.bottom = '-320px';

    if (wipeStorage) {
      watchedSet.clear();
      saveWatchedState();
      renderMovieArchive();
      renderDoomsdaySection();
      renderInfinitySaga();
      renderMultiverseSaga();
    }

    const cards = document.querySelectorAll('.archive-card, .character-card');
    cards.forEach((card, index) => {
      if (index % 2 === 0) {
        card.style.transition = 'opacity 1.2s ease, transform 1.2s ease, filter 1.2s ease';
        card.style.opacity = '0.15';
        card.style.transform = 'translateY(-14px) scale(0.94)';
        card.style.filter = 'blur(6px) grayscale(1)';
      }
    });

    showToast('🫰 SNAP! Reality rewritten across the timeline.', '💎');
  }, 420);

  setTimeout(() => {
    if (flash) flash.style.opacity = '0';
  }, 850);

  setTimeout(() => {
    document.querySelectorAll('.archive-card, .character-card').forEach(card => {
      card.style.opacity = '';
      card.style.transform = '';
      card.style.filter = '';
    });
  }, 3600);
}

function shootSpiderWeb(cx, cy) {
  const canvas = document.getElementById('spidey-web');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  canvas.style.opacity = '1';

  const tx = cx || W * 0.5;
  const ty = cy || H * 0.5;
  const origins = [{ x: 0, y: H }, { x: W, y: H }, { x: W * 0.5, y: H }];

  const pop = document.createElement('div');
  pop.className = 'thwip-text-normal';
  pop.textContent = 'THWIP!';
  pop.style.cssText = `position:fixed;left:${tx}px;top:${ty}px;animation:thwipPopNormal 0.75s ease forwards;`;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 750);

  let p = 0;
  function anim() {
    p += 0.1;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 2.5;
    origins.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + (tx - o.x) * Math.min(1, p), o.y + (ty - o.y) * Math.min(1, p));
      ctx.stroke();
    });
    if (p < 1.8) requestAnimationFrame(anim);
    else {
      ctx.clearRect(0, 0, W, H);
      canvas.style.opacity = '0';
    }
  }
  requestAnimationFrame(anim);
}

function openDoctorStrangePortal() {
  const canvas = document.getElementById('dr-strange-portal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(W, H) * 0.34;
  const start = performance.now();

  showToast('🌀 Sling Ring Portal Opened — "Be careful what you wish for, Parker."', '✨');

  function draw(now) {
    const elapsed = now - start;
    const p = Math.min(1, elapsed / 1200);
    const fade = elapsed > 3000 ? Math.max(0, 1 - (elapsed - 3000) / 800) : 1;
    const r = maxR * (1 - Math.pow(1 - p, 3)) * fade;

    ctx.clearRect(0, 0, W, H);
    if (r > 4) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 8;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 35;
      ctx.stroke();

      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 / 24) * i + now * 0.004;
        const sx = cx + Math.cos(angle) * r;
        const sy = cy + Math.sin(angle) * r;
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
      ctx.restore();
    }

    if (elapsed < 3800) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, W, H);
  }
  requestAnimationFrame(draw);
}

function initEasterEggs() {
  document.getElementById('btn-replay-universe')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Multiverse Rewound to the Big Bang Singularity', '🌌');
  });

  document.getElementById('nav-snap-trigger')?.addEventListener('click', () => {
    document.getElementById('snap-confirm-modal')?.classList.add('open');
  });

  document.getElementById('btn-confirm-snap')?.addEventListener('click', () => {
    executeThanosSnap(true);
  });

  // 6-Click Logo -> Assemble all 6 Infinity Stones
  let logoClicks = 0;
  let logoTimer = null;
  document.getElementById('mcu-logo')?.addEventListener('click', (e) => {
    logoClicks++;
    clearTimeout(logoTimer);
    logoTimer = setTimeout(() => { logoClicks = 0; }, 3000);
    if (logoClicks >= 6) {
      logoClicks = 0;
      ['reality', 'space', 'time', 'mind', 'power', 'soul'].forEach(s => markStoneDiscovered(s));
      showToast('💎 ALL 6 INFINITY STONES ASSEMBLED! I AM IRON MAN.', '⚡');
    }
  });

  // Double-click background to shoot Spider-Man webs
  window.addEventListener('dblclick', (e) => {
    if (e.target.closest('button, a, input, select, .archive-card, .character-card, .dd-card')) return;
    shootSpiderWeb(e.clientX, e.clientY);
  });

  // Keyboard secret sequences: worthy, unworthy, thwip, strange, smash, chimichanga
  let keyBuffer = '';
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-15);

    if (keyBuffer.endsWith('unworthy')) {
      document.body.classList.remove('mjolnir-mode');
      showToast('🔨 Mjolnir returned to Asgard.');
      keyBuffer = '';
    } else if (keyBuffer.endsWith('worthy')) {
      document.body.classList.add('mjolnir-mode');
      showToast('⚡ Whosoever holds this hammer, if they be worthy, shall possess the power of Thor!');
      keyBuffer = '';
    } else if (keyBuffer.endsWith('thwip')) {
      shootSpiderWeb(window.innerWidth / 2, window.innerHeight / 2);
      keyBuffer = '';
    } else if (keyBuffer.endsWith('strange')) {
      openDoctorStrangePortal();
      keyBuffer = '';
    } else if (keyBuffer.endsWith('smash')) {
      document.body.style.animation = 'screenShake 0.4s ease';
      setTimeout(() => { document.body.style.animation = ''; }, 450);
      showToast('💚 HULK SMASH!', '💥');
      keyBuffer = '';
    } else if (keyBuffer.endsWith('chimichanga')) {
      showToast('🌮 Maximum Effort! Deadpool broke the 4th wall.', '⚔️');
      keyBuffer = '';
    }
  });

  // Mjolnir impact ripple when worthy mode is active
  window.addEventListener('click', (e) => {
    if (!document.body.classList.contains('mjolnir-mode')) return;
    const ripple = document.createElement('div');
    ripple.className = 'mjolnir-impact';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 450);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   INITIALIZE EVERYTHING ON DOM READY
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initStudioIntro();
  initHeroParticleCanvas();
  initHeroStats();
  initMultiverseTreeBranches();
  initCosmicAudio();
  initMultiverseNav();
  initTrailerIntermissions();
  renderBranchRealities();
  renderInfinitySaga();
  renderMultiverseSaga();
  initMultiverseTabs();
  initDoomsdayFastTrack();
  renderCharacterGallery();
  initCharacterFilters();
  initMarvelNetwork();
  initNetworkControls();
  renderStonesAltars();
  renderMovieArchive();
  initArchiveControls();
  initShareModal();
  initModalHandlers();
  initEasterEggs();
});
