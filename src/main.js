import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { timelineData, phasesData } from './data/timeline.js';
import { charactersData } from './data/characters.js';
import { networkGraphData } from './data/network.js';
import { stonesData } from './data/stones.js';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL STATE & STORAGE
═══════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'mcu-multiverse-watched-v2';
const DISCOVERED_STONES_KEY = 'mcu-discovered-stones-v1';

let watchedSet = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
let discoveredStones = new Set(JSON.parse(localStorage.getItem(DISCOVERED_STONES_KEY) || '[]'));

let activeArchiveOrder = 'chronological'; // 'release' | 'chronological'
let activeArchiveFilter = 'all'; // 'all' | 'movie' | 'series' | 'special'
let archiveSearchQuery = '';

let activeCharCategory = 'all';
let charSearchQuery = '';

let activeMultiversePhase = 'all'; // 'all' | 4 | 5 | 6

let activeNetworkMetric = 'degree'; // 'degree' | 'eigenvector' | 'betweenness'
let activeNetworkFaction = 'all';
let selectedNetworkNode = 'Captain America';

let activeStoneId = 'space';
let audioMuted = true;
let audioContext = null;

/* ═══════════════════════════════════════════════════════════════════
   FALLBACK / SAFE IMAGE HANDLER
═══════════════════════════════════════════════════════════════════ */
window.handleImageError = function(img, title, fallbackColor = '#1a233a') {
  if (img.dataset.failed) return;
  img.dataset.failed = 'true';
  const cleanTitle = (title || 'Marvel Title').replace(/[^\w\s-]/gi, '').slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#070a12"/>
        <stop offset="100%" stop-color="${fallbackColor}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="150" cy="180" r="45" fill="none" stroke="#e23636" stroke-width="2" opacity="0.6"/>
    <text x="150" y="188" font-family="'Bebas Neue', sans-serif" font-size="28" fill="#e23636" text-anchor="middle">MCU</text>
    <text x="150" y="270" font-family="'Outfit', sans-serif" font-size="16" font-weight="600" fill="#f5f5f7" text-anchor="middle">${cleanTitle}</text>
    <text x="150" y="295" font-family="'Outfit', sans-serif" font-size="11" fill="#718096" text-anchor="middle">MULTIVERSE ARCHIVE</text>
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
  const hoursCount = 172; // Verified MCU canonical runtime aggregate
  const charCount = charactersData.length;
  const phasesCount = phasesData.length;

  const elTitles = document.getElementById('stat-total-titles');
  const elHours = document.getElementById('stat-total-hours');
  const elChars = document.getElementById('stat-total-characters');
  const elPhases = document.getElementById('stat-total-phases');

  if (elTitles) elTitles.textContent = titlesCount;
  if (elHours) elHours.textContent = `${hoursCount}h`;
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
    const sections = ['multiverse-nexus', 'infinity-saga-section', 'multiverse-saga-section', 'characters-section', 'marvel-network-section', 'stones-altar-section', 'archive-section'];
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
function renderInfinitySaga() {
  const track = document.getElementById('infinity-saga-track');
  if (!track) return;

  const infinityTitles = timelineData.filter(t => t.saga === 'Infinity Saga');

  track.innerHTML = infinityTitles.map(t => {
    const isWatched = watchedSet.has(t.id);
    const isCrossover = t.isCrossover;
    return `
      <div class="saga-movie-card ${isWatched ? 'watched' : ''}" data-id="${t.id}">
        <div class="saga-card-poster">
          <img src="${t.poster}" alt="${t.title}" loading="lazy" onerror="handleImageError(this, '${t.title.replace(/'/g, "\\'")}')" />
          <div class="saga-phase-tag">Phase ${t.phase}</div>
          ${isCrossover ? `<div class="saga-crossover-tag">✦ Crossover</div>` : ''}
          <div class="saga-order-badge">#${t.releaseOrder}</div>
        </div>
        <div class="saga-card-info">
          <div class="saga-card-meta">
            <span>${t.year}</span>
            <span>${t.runtime}</span>
          </div>
          <h4 class="saga-card-title">${t.title}</h4>
        </div>
      </div>
    `;
  }).join('');

  // Click card to open movie detail modal
  track.querySelectorAll('.saga-movie-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const item = timelineData.find(t => t.id === id);
      if (item) openMovieModal(item);
    });
  });

  // Track scroll buttons
  const prevBtn = document.getElementById('infinity-track-prev');
  const nextBtn = document.getElementById('infinity-track-next');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -400, behavior: 'smooth' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: 400, behavior: 'smooth' });
    });
  }
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
            <span class="m-phase">Phase ${t.phase}</span>
            <span class="m-year">${t.year}</span>
          </div>
          <h4 class="multiverse-card-title">${t.title}</h4>
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
   SECTION 6: CHARACTER UNIVERSE (AUDITED 44 CHARACTERS)
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
    return `
      <div class="character-card" data-id="${c.id}" style="--char-accent: ${c.accentColor || '#3C8DFF'}">
        <div class="char-card-media">
          <img src="${c.image}" alt="${c.name}" loading="lazy" onerror="handleImageError(this, '${c.name.replace(/'/g, "\\'")}', '${c.accentColor || '#1a233a'}')" />
          <div class="char-universe-pill">${c.universe}</div>
          <div class="char-audit-status">${rawAnomalies}</div>
        </div>
        <div class="char-card-info">
          <h3 class="char-name">${c.name}</h3>
          <div class="char-real-name">${c.realName}</div>
          <div class="char-role-badge">${c.identity}</div>
          
          <div class="char-power-strip">
            <span class="power-label">Combat Rating</span>
            <div class="power-bar-wrap">
              <div class="power-bar-fill" style="width: ${c.powerLevel?.combat || 80}%;"></div>
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
        <div class="stone-orb-visual"></div>
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

  // Set ambient wash on section
  const section = document.getElementById('stones-altar-section');
  if (section) {
    section.style.setProperty('--active-stone-color', s.color);
    section.style.background = `radial-gradient(circle at center 40%, ${s.glow} 0%, rgba(5, 7, 12, 0.98) 70%)`;
  }

  panel.innerHTML = `
    <div class="stone-feature-left">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <span style="font-size: 0.8rem; font-weight: 700; color: ${s.color}; letter-spacing: 0.15em; text-transform: uppercase;">Cosmic Singularity</span>
        <span style="font-size: 0.7rem; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 10px;">${s.aspect}</span>
      </div>
      <h3>The ${s.name}</h3>
      <p class="stone-quote">"${s.quote}"</p>
      <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 1.5rem;">${s.lore}</p>
      
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
          <span class="stone-meta-key">Dimensional Frequency</span>
          <span class="stone-meta-val">${s.aspect} Continuum Distortion</span>
        </div>
        <div class="stone-meta-row">
          <span class="stone-meta-key">Destruction / Current Status</span>
          <span class="stone-meta-val">${s.status || 'Reduced to atoms by Thanos (2018) / Restored via Time Heist'}</span>
        </div>
      </div>
    </div>
  `;
}

function markStoneDiscovered(stoneId) {
  discoveredStones.add(stoneId);
  localStorage.setItem(DISCOVERED_STONES_KEY, JSON.stringify([...discoveredStones]));
  
  // Update nav dots
  const navDot = document.querySelector(`.nav-stone-dot[data-stone="${stoneId}"]`);
  if (navDot) navDot.classList.add('active');

  if (discoveredStones.size === 6) {
    showToast('✦ All 6 Infinity Stones Harmonized! Gauntlet Ready.', '💎');
  } else {
    showToast(`Discovered ${stoneId.toUpperCase()} Stone (${discoveredStones.size}/6)`);
  }
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
          // Re-arm when scrolling back above so the trailer reveal replays smoothly
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
  // Populate soundwaves
  document.querySelectorAll('.trailer-soundwave').forEach(sw => {
    sw.innerHTML = buildSoundwaveHTML(14);
  });

  // Convert all .trailer-hype-headline into character-by-character spans
  document.querySelectorAll('.trailer-hype-headline').forEach(h2 => {
    const rawText = h2.dataset.hypeText || h2.textContent.trim();
    const accents = h2.dataset.accents || '';
    h2.innerHTML = buildCharRevealHTML(rawText, accents);
  });

  // Setup interactive rotating slate switcher on the primary trailer intermission
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
      void firstIntermission.offsetWidth; // Reflow to retrigger character & flare animations

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

      // Gentle auto-rotation every 6.5s when visible in viewport
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
function renderArchiveCardHTML(t) {
  const isWatched = watchedSet.has(t.id);
  const orderNum = activeArchiveOrder === 'chronological' ? t.chronologicalOrder : t.releaseOrder;
  const typeLabel = t.type === 'movie' ? 'Film' : (t.type === 'series' ? 'Series' : 'Special');
  const typeClass = t.type === 'movie' ? 'meta-type-movie' : 'meta-type-series';

  return `
    <div class="archive-card ${isWatched ? 'watched' : ''}" data-id="${t.id}">
      <div class="archive-card-poster">
        <img src="${t.poster}" alt="${t.title}" loading="lazy" onerror="handleImageError(this, '${t.title.replace(/'/g, "\\'")}')" />
        <div class="archive-seq-pill">#${orderNum}</div>
        <button class="archive-watched-check" data-id="${t.id}" title="Toggle Watched" aria-label="Mark ${t.title} as watched">
          ✓
        </button>
      </div>
      <div class="archive-card-body">
        <div class="archive-card-meta">
          <span class="${typeClass}">${typeLabel}</span>
          <span>${t.year}</span>
        </div>
        <h4 class="archive-card-title">${t.title}</h4>
        <p class="archive-card-summary">${t.synopsis || t.hook || ''}</p>
      </div>
    </div>
  `;
}

function renderMovieArchive() {
  const grid = document.getElementById('archive-grid');
  if (!grid) return;

  let list = [...timelineData];

  // Sort by active mode
  if (activeArchiveOrder === 'chronological') {
    list.sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
  } else {
    list.sort((a, b) => a.releaseOrder - b.releaseOrder);
  }

  // Filter by media type
  if (activeArchiveFilter !== 'all') {
    list = list.filter(t => t.type === activeArchiveFilter);
  }

  // Filter by search
  const hasSearch = Boolean(archiveSearchQuery.trim());
  if (hasSearch) {
    const q = archiveSearchQuery.toLowerCase();
    list = list.filter(t => 
      t.title.toLowerCase().includes(q) ||
      (t.year && t.year.toString().includes(q)) ||
      (t.phase !== undefined && `phase ${t.phase}`.includes(q))
    );
  }

  // Update stats counters
  updateArchiveStats();

  if (list.length === 0) {
    grid.className = 'archive-grid';
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">No titles match your archive filter.</div>`;
    return;
  }

  // When browsing without an active text search, group by MCU Phases with cinematic trailer intermission banners
  if (!hasSearch) {
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
            ${phaseItems.map(renderArchiveCardHTML).join('')}
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = blocksHTML;
    observeIntermissionElements(grid);
  } else {
    grid.className = 'archive-grid';
    grid.innerHTML = list.map(renderArchiveCardHTML).join('');
  }

  // Bind clicks
  grid.querySelectorAll('.archive-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.archive-watched-check')) {
        e.stopPropagation();
        toggleWatched(card.dataset.id);
        return;
      }
      const item = timelineData.find(t => t.id === card.dataset.id);
      if (item) openMovieModal(item);
    });
  });
}

function toggleWatched(id) {
  if (watchedSet.has(id)) {
    watchedSet.delete(id);
    showToast('Removed from Watched Archives');
  } else {
    watchedSet.add(id);
    showToast('Marked as Watched ✓', '🛡');
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...watchedSet]));
  renderMovieArchive();
  renderInfinitySaga();
  renderMultiverseSaga();
}

function updateArchiveStats() {
  const total = timelineData.length;
  const count = watchedSet.size;
  const pct = Math.round((count / total) * 100);

  const countEl = document.getElementById('archive-watched-count');
  const pctEl = document.getElementById('archive-watched-pct');
  const rankEl = document.getElementById('archive-agent-rank');

  if (countEl) countEl.textContent = `${count} / ${total}`;
  if (pctEl) pctEl.textContent = `${pct}%`;

  if (rankEl) {
    let rank = 'Cadet';
    if (pct >= 100) rank = 'Cosmic Entity (Multiverse Master)';
    else if (pct >= 80) rank = 'Sorcerer Supreme';
    else if (pct >= 50) rank = 'Avenger Special Operative';
    else if (pct >= 25) rank = 'S.H.I.E.L.D. Field Agent';
    rankEl.textContent = rank;
  }
}

function initArchiveControls() {
  const modeBtns = document.querySelectorAll('.archive-mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeArchiveOrder = btn.dataset.order;
      renderMovieArchive();
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...watchedSet]));
      showToast('All 79 Titles Marked as Watched!', '🏆');
      renderMovieArchive();
      renderInfinitySaga();
      renderMultiverseSaga();
    });
  }

  const resetAllBtn = document.getElementById('btn-reset-watched');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      watchedSet.clear();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      showToast('Watched progress reset.');
      renderMovieArchive();
      renderInfinitySaga();
      renderMultiverseSaga();
    });
  }
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
        <strong>⚠ Raw Dataset Audit Disclosure:</strong> Original CSV mapped this entry incorrectly (${charObj.rawAudit.note}). Corrected to canonical Marvel continuity.
       </div>`
    : '';

  content.innerHTML = `
    <div class="dossier-layout">
      <div class="dossier-media">
        <img src="${charObj.image}" alt="${charObj.name}" onerror="handleImageError(this, '${charObj.name.replace(/'/g, "\\'")}', '${charObj.accentColor || '#1a233a'}')" />
        <div style="position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.85); padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; border: 1px solid var(--border-bright);">
          ${charObj.universe}
        </div>
      </div>
      <div class="dossier-content">
        <div class="dossier-header">
          <div style="font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase; color: ${charObj.accentColor || '#3C8DFF'}; font-weight: 700;">
            ${charObj.category?.toUpperCase() || 'CLASSIFIED'} • ${charObj.identity}
          </div>
          <h2>${charObj.name}</h2>
          <div class="dossier-realname">${charObj.realName}</div>
        </div>

        ${auditNote}

        <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-primary);">${charObj.bio || ''}</p>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 0.5rem;">
          <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted);">Power Attribute Matrix</span>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="font-size: 0.75rem; display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Combat</span>
              <strong style="color: #fff;">${charObj.powerLevel?.combat || 85}%</strong>
            </div>
            <div style="font-size: 0.75rem; display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Energy</span>
              <strong style="color: #fff;">${charObj.powerLevel?.energy || 70}%</strong>
            </div>
            <div style="font-size: 0.75rem; display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Intelligence</span>
              <strong style="color: #fff;">${charObj.powerLevel?.intelligence || 80}%</strong>
            </div>
            <div style="font-size: 0.75rem; display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Strength</span>
              <strong style="color: #fff;">${charObj.powerLevel?.strength || 75}%</strong>
            </div>
          </div>
        </div>

        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
          <span>First Appearance: <strong style="color: #fff;">${charObj.firstAppearance || 'Unknown'}</strong></span>
          <span>Affiliation: <strong style="color: #fff;">${charObj.affiliations ? charObj.affiliations.join(', ') : 'Independent'}</strong></span>
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
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--stone-space); letter-spacing: 0.12em; text-transform: uppercase;">
              Phase ${item.phase} • ${item.saga}
            </span>
            <span style="font-size: 0.68rem; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 8px;">
              ${item.type.toUpperCase()}
            </span>
          </div>
          <h2>${item.title}</h2>
          <div class="dossier-realname">${item.year} • ${item.runtime} • Release #${item.releaseOrder} (Chronological #${item.chronologicalOrder})</div>
        </div>

        <p style="font-size: 0.92rem; line-height: 1.6; color: var(--text-primary);">${item.synopsis || item.hook || ''}</p>

        ${item.postCreditsScene ? `
          <div style="background: rgba(130, 87, 255, 0.1); border: 1px solid rgba(130, 87, 255, 0.3); border-radius: 10px; padding: 12px 16px; margin: 0.5rem 0;">
            <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--stone-power);">Post-Credits Sequence:</span>
            <p style="font-size: 0.8rem; color: #E2E8F0; margin-top: 4px;">${item.postCreditsScene}</p>
          </div>
        ` : ''}

        <div style="display: flex; gap: 12px; margin-top: 1rem;">
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
            ${isWatched ? '✓ Watched' : 'Mark as Watched'}
          </button>
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
   EASTER EGGS: THANOS SNAP & REPLAY UNIVERSE
═══════════════════════════════════════════════════════════════════ */
function initEasterEggs() {
  const replayBtn = document.getElementById('btn-replay-universe');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Multiverse Rewound to the Big Bang Singularity', '🌌');
    });
  }

  const snapBtn = document.getElementById('nav-snap-trigger');
  if (snapBtn) {
    snapBtn.addEventListener('click', () => {
      executeThanosSnap();
    });
  }
}

function executeThanosSnap() {
  showToast('Snap initiated... Half the universe turns to dust.', '🤌');
  const cards = document.querySelectorAll('.archive-card, .character-card');
  
  cards.forEach((card, index) => {
    if (index % 2 === 0) {
      card.style.transition = 'opacity 1.5s ease, transform 1.5s ease, filter 1.5s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-20px) scale(0.9)';
      card.style.filter = 'blur(10px) grayscale(1)';
    }
  });

  setTimeout(() => {
    showToast('Time Stone activated! Restoring timeline branches...', '🟢');
    cards.forEach(card => {
      card.style.opacity = '';
      card.style.transform = '';
      card.style.filter = '';
    });
  }, 4000);
}

/* ═══════════════════════════════════════════════════════════════════
   INITIALIZE EVERYTHING ON DOM READY
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initHeroParticleCanvas();
  initHeroStats();
  initCosmicAudio();
  initMultiverseNav();
  initTrailerIntermissions();
  renderBranchRealities();
  renderInfinitySaga();
  renderMultiverseSaga();
  initMultiverseTabs();
  renderCharacterGallery();
  initCharacterFilters();
  initMarvelNetwork();
  initNetworkControls();
  renderStonesAltars();
  renderMovieArchive();
  initArchiveControls();
  initModalHandlers();
  initEasterEggs();
});
