/**
 * BOOKSHELF COVER FLIP — Originkit 3D Bookshelf Component
 * Mathematical 3D book row layout with interactive spine-to-cover opening flip.
 * Features:
 *   • 3D book geometry: spine face + hinged cover face
 *   • Smooth bezier opening/closing with neighbour slot gliding
 *   • Pointer hover tracking with book lift and perspective tilt
 *   • Shelf floor reflection and dynamic contact shadows
 *   • Autoplay idle rotation with pause on hover
 *   • Volume pagination for complete Multiverse Saga library
 *   • Click-to-dossier modal integration
 */

const ADVANCED = {
  openMs: 530,
  closeMs: 670,
  holdMs: 2600,
  idleMs: 2600,
  autoPlay: true,
  coverScale: 118,
  coverAspect: 69,
  gap: 3,
  heightJitter: 0,
  perspective: 1600,
  lift: 3,
  tilt: 6,
  titleSize: 44,
  monogramSize: 28,
  monogramOpacity: 45,
  textOpacity: 92,
  coverTitleSize: 13,
  kickerSize: 5,
  readsSize: 4,
  coverStrip: 6,
  artScale: 100,
  shade: 12,
  highlight: 8,
  shadowOpacity: 55,
  floorColor: '#00E676',
  floorOpacity: 12,
  rowOffset: 0,
  starColor: '#00E676',
  hover: 50,
};

const JITTER = [0, 0.6, -1, 0.3, -0.4, 0.8];
const SIZE_DEFAULT = 440;
const SIZE_MAX = 800;
const FLAT_EPS = 1e-4;
const FACE_SS = 2;

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    if (t < 0 || t > 1 || Math.abs(sx(t) - x) > 1e-3) {
      let lo = 0, hi = 1;
      t = x;
      for (let i = 0; i < 30; i++) {
        if (sx(t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return sy(t);
  };
}

const OPEN_EASE = bezier(0.38, 0.25, 0.28, 0.98);
const CLOSE_EASE = bezier(0.1, 0, 0.38, 0.98);
const OPEN_D0 = OPEN_EASE(1e-4) / 1e-4;
const CLOSE_D0 = CLOSE_EASE(1e-4) / 1e-4;

function parseColor(c) {
  if (!c || typeof c !== 'string') return [0, 0, 0, 1];
  const s = c.trim();
  if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((ch) => ch + ch).join('');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [r || 0, g || 0, b || 0, a];
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return [p[0] || 0, p[1] || 0, p[2] || 0, p[3] ?? 1];
  }
  return [0, 0, 0, 1];
}

function rgba(c, a) {
  const [r, g, b] = parseColor(c);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function mix(a, b, t) {
  const A = parseColor(a), B = parseColor(b);
  const f = (i) => Math.round(A[i] + (B[i] - A[i]) * t);
  return `rgb(${f(0)}, ${f(1)}, ${f(2)})`;
}

function lum(c) {
  const [r, g, b] = parseColor(c);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function getMoviePalette(item, idx) {
  const palettes = [
    { spine: '#0E2818', text: '#68E8A3', cover: '#091B10' }, // Loki Emerald
    { spine: '#360914', text: '#FF8BA7', cover: '#24060D' }, // WandaVision Crimson
    { spine: '#1B1438', text: '#B8A1FF', cover: '#120D26' }, // What If Cosmic Violet
    { spine: '#380E0E', text: '#FFA4A4', cover: '#240808' }, // Shang-Chi Red
    { spine: '#0E2138', text: '#8DC2FF', cover: '#0A1728' }, // Falcon & Winter Soldier
    { spine: '#261838', text: '#D8A4FF', cover: '#1A1026' }, // Doctor Strange
    { spine: '#362408', text: '#FFDE8A', cover: '#241805' }, // Thor Gold/Purple
    { spine: '#121820', text: '#A2B4C8', cover: '#0C1016' }, // Black Panther Vibranium
    { spine: '#1A1030', text: '#CAA2FF', cover: '#110A20' }, // Quantumania
    { spine: '#181E24', text: '#C2D1E0', cover: '#101418' }, // Guardians Vol 3
    { spine: '#380B12', text: '#FFA2B4', cover: '#26060B' }, // Deadpool & Wolverine
    { spine: '#0A1C30', text: '#88BCF5', cover: '#061322' }, // Fantastic Four First Steps
  ];
  return palettes[idx % palettes.length];
}

function rowLayout(g, es) {
  const out = [];
  let x = g.startX;
  for (let i = 0; i < g.n; i++) {
    const e = es[i] ?? 0;
    const th = (e * Math.PI) / 2;
    const m = 1 + (g.k - 1) * e;
    const w = m * (g.sw * Math.cos(th) + g.cw * Math.sin(th));
    out.push({ x, w, th, m, e });
    x += w + g.gap;
  }
  return out;
}

function rowSettled(es, n) {
  for (let i = 0; i < n; i++) {
    const e = es[i] ?? 0;
    if (e > FLAT_EPS && e < 1 - FLAT_EPS) return false;
  }
  return true;
}

function faceOpacities(g, L) {
  const c = Math.cos(L.th), s = Math.sin(L.th);
  const x0 = L.w / 2;
  const proj = (x, z) => x0 + ((x - x0) * g.P) / Math.max(1, g.P - z);
  const dz = g.sw * s;
  const xh = L.m * g.sw * c, zh = L.m * g.sw * s - dz;
  const xf = L.m * (g.sw * c + g.cw * s), zf = L.m * (g.sw * s - g.cw * c) - dz;
  const hinge = proj(xh, zh);
  const fade = (w, full) => `${Math.max(0, Math.min(1, (w / Math.max(1e-3, L.m * full) - 0.15) / 0.25))}`;
  return {
    spineOpacity: fade(hinge - proj(0, -dz), g.sw),
    coverOpacity: fade(proj(xf, zf) - hinge, g.cw),
  };
}

function slotStyles(g, L, liftPx, tiltDeg, shadowOp, settled = false) {
  const still = Math.abs(tiltDeg) < 0.01;
  const closed = still && L.e < FLAT_EPS;
  const open = still && L.e > 1 - FLAT_EPS;
  const flat = closed || open;
  const px = (v) => (settled ? Math.round(v) : v);

  return {
    slot: {
      transform: flat
        ? `translate(${px(L.x)}px, ${px(g.floorY - g.boxH)}px)`
        : `translate3d(${L.x}px, ${g.floorY - g.boxH}px, 0px)`,
      width: `${Math.max(1, L.w)}px`,
      height: `${g.boxH}px`,
      perspective: flat ? 'none' : `${g.P}px`,
      perspectiveOrigin: `${L.w / 2}px ${g.boxH * 0.55}px`,
    },
    book: {
      transform: flat
        ? `translateY(${-liftPx}px)${open ? ` scale(${L.m})` : ''}`
        : `translateY(${-liftPx}px) translateZ(${-g.sw * Math.sin(L.th)}px) scale(${L.m}) rotateX(${tiltDeg}deg) rotateY(${(-L.th * 180) / Math.PI}deg)`,
      transformStyle: flat ? 'flat' : 'preserve-3d',
    },
    coverVisibility: closed ? 'hidden' : 'visible',
    coverTransform: open ? `translateX(${1 - g.sw}px)` : 'rotateY(90deg)',
    spineVisibility: open ? 'hidden' : 'visible',
    shadow: {
      transform: `translate3d(${L.x - L.w * 0.08}px, ${g.floorY - g.hs * 0.035}px, 0px)`,
      width: `${L.w * 1.16}px`,
      height: `${g.hs * (0.07 + 0.03 * L.e)}px`,
      opacity: `${shadowOp * (0.6 + 0.4 * L.e)}`,
    },
    ...faceOpacities(g, L),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN BOOKSHELF COVER FLIP CONTROLLER CLASS
   ═══════════════════════════════════════════════════════════════════ */
export class BookshelfCoverFlip {
  constructor(options = {}) {
    this.container = options.container;
    this.items = options.items || [];
    this.onBookSelect = options.onBookSelect || (() => {});
    this.onActiveChange = options.onActiveChange || (() => {});

    this.pageSize = 6;
    this.currentPage = 0;
    this.currentBooks = [];

    this.size = options.size || 440;
    this.spineWidth = options.spineWidth || 14;
    this.speed = options.speed || 50;

    this.state = {
      es: [1],
      vel: [0],
      tw: [{ from: 1, to: 1, t: 0, dur: 0.5, open: true, v0: 0 }],
      lift: [0],
      active: 0,
      autoIdx: 0,
      holdT: 0,
      idleT: 0,
      pointerIn: false,
      hovered: -1,
      py: 0,
      ty: 0,
      reduce: false,
    };

    this.rafId = 0;
    this.isAlive = true;
    this.isAutoplay = true;

    this.dims = { w: 1200, h: 620 };
    this.slotEls = [];
    this.bookEls = [];
    this.shadowEls = [];
    this.coverEls = [];
    this.spineEls = [];
    this.coverFaceEls = [];
    this.spineFaceEls = [];

    this.init();
  }

  init() {
    if (!this.container) return;

    this.measure();
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(this.container);

    this.updateCurrentPageBooks();
    this.renderDOM();
    this.setupListeners();
    this.startLoop();
  }

  setItems(newItems) {
    this.items = newItems || [];
    this.currentPage = 0;
    this.updateCurrentPageBooks();
    this.renderDOM();
  }

  nextPage() {
    const totalPages = Math.max(1, Math.ceil(this.items.length / this.pageSize));
    this.currentPage = (this.currentPage + 1) % totalPages;
    this.updateCurrentPageBooks();
    this.renderDOM();
  }

  prevPage() {
    const totalPages = Math.max(1, Math.ceil(this.items.length / this.pageSize));
    this.currentPage = (this.currentPage - 1 + totalPages) % totalPages;
    this.updateCurrentPageBooks();
    this.renderDOM();
  }

  toggleAutoplay() {
    this.isAutoplay = !this.isAutoplay;
    return this.isAutoplay;
  }

  updateCurrentPageBooks() {
    const start = this.currentPage * this.pageSize;
    const slice = this.items.slice(start, start + this.pageSize);
    this.currentBooks = slice.length ? slice : this.items.slice(0, this.pageSize);
    const n = this.currentBooks.length;

    // Adjust state arrays to match active books count
    const s = this.state;
    while (s.es.length < n) {
      s.es.push(0);
      s.vel.push(0);
      s.tw.push({ from: 0, to: 0, t: 0, dur: 0.5, open: true, v0: 0 });
      s.lift.push(0);
    }
    s.es.length = n;
    s.vel.length = n;
    s.tw.length = n;
    s.lift.length = n;
    if (s.active >= n) s.active = 0;
    if (s.autoIdx >= n) s.autoIdx = 0;

    // Set first book open by default on volume switch
    s.es[0] = 1;
    s.tw[0] = { from: 1, to: 1, t: 0, dur: 0.5, open: true, v0: 0 };
    s.active = 0;
    s.autoIdx = 0;
    s.holdT = 0;
    s.idleT = 0;
  }

  measure() {
    const w = this.container.offsetWidth || 1200;
    const h = this.container.offsetHeight || 620;
    this.dims = { w, h };
    this.updateGeometry();
  }

  updateGeometry() {
    const n = this.currentBooks.length || 1;
    const W = this.dims.w || 1200;
    const H = this.dims.h || 620;
    const adv = ADVANCED;
    const size = this.size;
    const k = adv.coverScale / 100;
    const sw0 = (size * this.spineWidth) / 100;
    const cw0 = (size * adv.coverAspect) / 100;
    const gap0 = (size * adv.gap) / 100;
    const rowOpen0 = (n - 1) * (sw0 + gap0) + k * cw0;
    const jMax = 1 + (0.8 * adv.heightJitter) / 100;

    const hsMax = Math.max(1, Math.min((W * 0.88) / Math.max(1e-6, rowOpen0 / size), (H * 0.78) / (k * jMax)));
    const hsDef = Math.min(SIZE_DEFAULT, hsMax * 0.82);
    const hs = Math.max(
      1,
      size <= SIZE_DEFAULT
        ? (size * hsDef) / SIZE_DEFAULT
        : hsDef + ((hsMax - hsDef) * Math.min(1, (size - SIZE_DEFAULT) / (SIZE_MAX - SIZE_DEFAULT)))
    );

    const fit = hs / size;
    const sw = sw0 * fit;
    const cw = cw0 * fit;
    const gap = gap0 * fit;
    const rowOpenW = rowOpen0 * fit;
    const heights = this.currentBooks.map((_, i) => hs * (1 + (JITTER[i % JITTER.length] * adv.heightJitter) / 100));
    const startX = (W - rowOpenW) / 2;
    const floorY = H / 2 + (hs * k) / 2 + (H * adv.rowOffset) / 100;

    this.geom = {
      n, hs, sw, cw, gap, k, W, H, heights, startX, floorY,
      boxH: hs * k * jMax * 1.1,
      P: adv.perspective * (hs / 440),
    };
  }

  renderDOM() {
    this.updateGeometry();
    const g = this.geom;
    const adv = ADVANCED;
    const floorX = g.startX - g.gap * 4;
    const floorW = (g.W - g.startX * 2) + g.gap * 8;
    const fade = 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)';

    this.container.innerHTML = `
      <div class="bs-viewport" style="position: relative; width: 100%; height: 100%; overflow: hidden; isolation: isolate; user-select: none;">
        <!-- Shelf Floor & Glow Lines -->
        <div class="bs-floor-reflect" style="position: absolute; left: ${floorX}px; top: ${g.floorY}px; width: ${floorW}px; height: ${g.hs * 0.16}px; background: linear-gradient(180deg, ${rgba(adv.floorColor, (adv.floorOpacity / 100) * 0.6)} 0%, ${rgba(adv.floorColor, 0)} 100%); -webkit-mask-image: ${fade}; mask-image: ${fade}; pointer-events: none;"></div>
        <div class="bs-floor-line" style="position: absolute; left: ${floorX}px; top: ${g.floorY}px; width: ${floorW}px; height: 1px; background: ${rgba(adv.floorColor, Math.min(1, (adv.floorOpacity / 100) * 1.5))}; -webkit-mask-image: ${fade}; mask-image: ${fade}; pointer-events: none;"></div>

        <!-- Contact Shadows Layer -->
        <div class="bs-shadows-layer" style="position: absolute; inset: 0; pointer-events: none;">
          ${this.currentBooks.map((_, i) => `
            <div class="bs-shadow bs-shadow-${i}" style="position: absolute; left: 0; top: 0; background: radial-gradient(ellipse at center, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.38) 45%, rgba(0,0,0,0) 72%);"></div>
          `).join('')}
        </div>

        <!-- 3D Books Slots -->
        <div class="bs-books-layer" style="position: absolute; inset: 0;">
          ${this.currentBooks.map((item, i) => {
            const pal = getMoviePalette(item, i);
            const h = g.heights[i] || g.hs;
            const strip = (g.cw * adv.coverStrip) / 100;
            const inset = strip + g.cw * 0.1;
            const hl = adv.highlight / 100;
            const sd = adv.shade / 100;
            const safeTitle = (item.title || 'Marvel Movie').replace(/'/g, "\\'");
            const phaseBadge = `PHASE ${item.phase || '4'} • ${item.dimension || 'EARTH-616'}`;
            const subText = `${item.inUniverseYear || item.year} • ${item.status === 'upcoming' ? 'Upcoming' : 'Released'}`;

            return `
              <div class="bs-slot bs-slot-${i}" data-index="${i}" data-id="${item.id}" style="position: absolute; left: 0; top: 0; cursor: pointer;">
                <div class="bs-book bs-book-${i}" style="position: absolute; left: 0; bottom: 0; width: ${g.sw}px; height: ${h}px; transform-origin: 0px 100% 0px;">
                  <!-- High-Res Scale Shim -->
                  <div class="bs-scale-shim" style="position: absolute; left: 0; bottom: 0; width: ${g.sw}px; height: ${h}px; zoom: ${FACE_SS}; transform: scale3d(${1 / FACE_SS}, ${1 / FACE_SS}, ${1 / FACE_SS}); transform-origin: 0px 100% 0px; -webkit-transform-style: preserve-3d; transform-style: preserve-3d;">
                    
                    <!-- Spine Face -->
                    <div class="bs-spine-face bs-spine-face-${i}" style="position: absolute; left: 0; bottom: 0; width: ${g.sw}px; height: ${h}px; background: ${pal.spine}; border-radius: 1px; overflow: hidden; -webkit-backface-visibility: hidden; backface-visibility: hidden; border: 1px solid rgba(0, 230, 118, 0.2);">
                      <div class="bs-spine-inner bs-spine-inner-${i}" style="position: absolute; inset: 0;">
                        <!-- Shading Gradients -->
                        <div style="position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,255,255,${hl}) 0px, rgba(255,255,255,0) ${g.sw * 0.12}px, rgba(0,0,0,0) ${g.sw * 0.55}px, rgba(0,0,0,${sd}) 100%), linear-gradient(180deg, rgba(0,0,0,0) 72%, rgba(0,0,0,${sd * 0.8}) 100%);"></div>
                        <!-- Vertical Spine Title -->
                        <div style="position: absolute; top: ${h * 0.048}px; bottom: ${h * 0.14}px; left: 0; right: 0; display: flex; justify-content: center; overflow: hidden;">
                          <span style="writing-mode: vertical-rl; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-height: 100%; font-family: var(--font-avengero); font-size: ${(g.sw * adv.titleSize * 0.01)}px; line-height: 1; color: ${pal.text}; opacity: ${adv.textOpacity / 100}; letter-spacing: 0.08em; text-transform: uppercase;">
                            ${item.title}
                          </span>
                        </div>
                        <!-- Monogram -->
                        <div style="position: absolute; left: 0; right: 0; bottom: ${h * 0.035}px; text-align: center; font-family: var(--font-captain); font-size: ${(g.sw * adv.monogramSize * 0.01)}px; line-height: 1; color: #00E676; opacity: ${adv.monogramOpacity / 100}; font-weight: 800;">
                          M
                        </div>
                      </div>
                    </div>

                    <!-- Cover Face (Hinged on spine right edge) -->
                    <div class="bs-cover-face bs-cover-face-${i}" style="position: absolute; left: ${g.sw - 1}px; bottom: 0; width: ${g.cw + 1}px; height: ${h}px; transform-origin: 0% 50%; -webkit-backface-visibility: hidden; backface-visibility: hidden; background: linear-gradient(180deg, ${mix(pal.cover, '#0A2014', 0.12)} 0%, ${pal.cover} 100%); overflow: hidden; color: #FFFFFF; border: 1px solid rgba(0, 230, 118, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.9), 0 0 25px rgba(0, 230, 118, 0.12);">
                      <div class="bs-cover-inner bs-cover-inner-${i}" style="position: absolute; inset: 0;">
                        <!-- Full Artwork / Poster -->
                        <div style="position: absolute; left: ${inset}px; right: ${g.cw * 0.08}px; top: ${h * 0.06}px; height: ${h * 0.52}px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; background: #000; box-shadow: 0 4px 18px rgba(0,0,0,0.8);">
                          <img src="${item.poster}" alt="${safeTitle}" draggable="false" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top;" onerror="handleImageError(this, '${safeTitle}')" />
                        </div>
                        <!-- Scrim overlay under titles -->
                        <div style="position: absolute; left: ${strip}px; right: 0; bottom: 0; height: ${h * 0.46}px; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(2,8,4,0.95) 80%);"></div>

                        <!-- Spine Strip Copy on Cover -->
                        <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${strip}px; background: ${mix(pal.cover, '#000000', 0.25)}; border-right: 1px solid rgba(255,255,255,0.14); display: flex; justify-content: center; padding-top: ${h * 0.04}px; overflow: hidden;">
                          <span style="writing-mode: vertical-rl; white-space: nowrap; font-family: var(--font-avengero); font-size: ${g.cw * 0.038}px; line-height: 1; opacity: 0.65; color: ${pal.text}; letter-spacing: 0.06em;">
                            ${item.title}
                          </span>
                        </div>

                        <!-- Kicker & Cover Title -->
                        <div style="position: absolute; left: ${inset}px; right: ${g.cw * 0.08}px; bottom: ${h * 0.11}px;">
                          <div style="font-family: var(--font-eternal); font-size: ${Math.max(8, (g.cw * adv.kickerSize) / 100)}px; letter-spacing: 0.12em; color: #00E676; text-transform: uppercase; margin-bottom: 3px;">
                            ${phaseBadge}
                          </div>
                          <div class="bs-title-text" style="font-family: var(--font-avengero); font-size: ${Math.max(12, (g.cw * adv.coverTitleSize) / 100)}px; line-height: 1.1; color: #FFFFFF; text-shadow: 0 2px 10px rgba(0,0,0,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${item.title}
                          </div>
                        </div>

                        <!-- Subtitle & Reads Bar -->
                        <div style="position: absolute; left: ${inset}px; bottom: ${h * 0.042}px; display: flex; align-items: center; gap: ${g.cw * 0.03}px; font-family: var(--font-captain); font-size: ${Math.max(7, (g.cw * adv.readsSize) / 100)}px; color: #94A3B8; letter-spacing: 0.06em;">
                          <span style="width: ${g.cw * 0.06}px; height: 1px; background: #00E676;"></span>
                          <span>${subText}</span>
                        </div>

                        <!-- Glossy Right Edge Line -->
                        <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.2);"></div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Cache Element References
    this.slotEls = this.currentBooks.map((_, i) => this.container.querySelector(`.bs-slot-${i}`));
    this.bookEls = this.currentBooks.map((_, i) => this.container.querySelector(`.bs-book-${i}`));
    this.shadowEls = this.currentBooks.map((_, i) => this.container.querySelector(`.bs-shadow-${i}`));
    this.coverEls = this.currentBooks.map((_, i) => this.container.querySelector(`.bs-cover-inner-${i}`));
    this.spineEls = this.currentBooks.map((_, i) => this.container.querySelector(`.bs-spine-inner-${i}`));
    this.coverFaceEls = this.currentBooks.map((_, i) => this.container.querySelector(`.bs-cover-face-${i}`));
    this.spineFaceEls = this.currentBooks.map((_, i) => this.container.querySelector(`.bs-spine-face-${i}`));

    // Initial styles
    const initLayout = rowLayout(this.geom, this.state.es);
    const initSettled = rowSettled(this.state.es, this.geom.n);
    for (let i = 0; i < this.geom.n; i++) {
      const ss = slotStyles(this.geom, initLayout[i], 0, 0, ADVANCED.shadowOpacity / 100, initSettled);
      if (this.slotEls[i]) Object.assign(this.slotEls[i].style, ss.slot);
      if (this.bookEls[i]) Object.assign(this.bookEls[i].style, ss.book);
      if (this.shadowEls[i]) Object.assign(this.shadowEls[i].style, ss.shadow);
    }

    this.notifyActive();
  }

  setupListeners() {
    const root = this.container;

    root.addEventListener('pointermove', (e) => {
      const s = this.state;
      const geo = this.geom;
      if (!geo) return;

      const r = root.getBoundingClientRect();
      const cx = geo.W / 2;
      const cy = geo.floorY - (geo.hs * geo.k) / 2;
      const qx = ((e.clientX - r.left) / Math.max(1, r.width)) * geo.W - cx;
      const qy = ((e.clientY - r.top) / Math.max(1, r.height)) * geo.H - cy;

      s.pointerIn = true;
      s.idleT = 0;
      const mid = geo.floorY - (geo.hs * geo.k) / 2;
      s.py = Math.max(-1, Math.min(1, (qy) / ((geo.hs * geo.k) / 2)));

      const targets = Array.from({ length: geo.n }, (_, i) => (i === s.active ? 1 : 0));
      const L = rowLayout(geo, targets);
      const inBand = (qy + mid) >= geo.floorY - geo.hs * geo.k * 1.15 && (qy + mid) <= geo.floorY + geo.hs * 0.15;
      const left = L[0].x - geo.gap;
      const right = L[L.length - 1].x + L[L.length - 1].w + geo.gap;
      const x = qx + cx;

      if (!inBand || x < left || x > right) {
        s.hovered = -1;
        return;
      }

      for (let i = 0; i < L.length; i++) {
        if (x >= L[i].x - geo.gap / 2 && x <= L[i].x + L[i].w + geo.gap / 2) {
          s.hovered = i;
          return;
        }
      }
    });

    root.addEventListener('pointerleave', () => {
      const s = this.state;
      s.pointerIn = false;
      s.hovered = -1;
      s.holdT = 0;
      s.idleT = 0;
      s.py = 0;
    });

    root.addEventListener('click', (e) => {
      const slot = e.target.closest('.bs-slot');
      if (!slot) return;
      const idx = parseInt(slot.dataset.index, 10);
      const item = this.currentBooks[idx];
      if (!item) return;

      const s = this.state;
      if (s.active === idx && s.es[idx] > 0.85) {
        // Book is already fully open: launch classified modal!
        this.onBookSelect(item);
      } else {
        // Swing book open
        s.active = idx;
        s.autoIdx = idx;
        s.holdT = 0;
        this.notifyActive();
      }
    });
  }

  notifyActive() {
    const s = this.state;
    const activeItem = this.currentBooks[s.active];
    if (activeItem) {
      const totalPages = Math.max(1, Math.ceil(this.items.length / this.pageSize));
      this.onActiveChange(activeItem, this.currentPage + 1, totalPages, this.currentBooks.length);
    }
  }

  startLoop() {
    let last = -1;

    const tick = (now) => {
      if (!this.isAlive) return;
      this.rafId = requestAnimationFrame(tick);

      const dt = last < 0 ? 0 : Math.min((now - last) / 1000, 1 / 20);
      last = now;

      const s = this.state;
      const geo = this.geom;
      if (!geo) return;
      const count = geo.n;
      const rate = Math.max(0, (this.speed ?? 50) / 50);
      const hk = ADVANCED.hover / 50;
      const a = ADVANCED;

      // Determine which book is open
      if (s.pointerIn) {
        if (s.hovered >= 0 && s.active !== s.hovered) {
          s.active = s.hovered;
          s.autoIdx = s.hovered;
          this.notifyActive();
        }
      } else if (this.isAutoplay && a.autoPlay && rate > 0 && count > 1) {
        if (s.active < 0) {
          s.idleT += dt * rate;
          if (s.idleT >= a.idleMs / 1000) {
            s.autoIdx = (s.autoIdx + 1) % count;
            s.active = s.autoIdx;
            s.holdT = 0;
            this.notifyActive();
          }
        } else {
          s.holdT += dt * rate;
          if (s.holdT >= a.holdMs / 1000) {
            s.autoIdx = (s.active + 1) % count;
            s.active = s.autoIdx;
            s.holdT = 0;
            this.notifyActive();
          }
        }
      }

      // Smooth tweens per book slot
      for (let i = 0; i < count; i++) {
        const tw = s.tw[i];
        const target = i === s.active ? 1 : 0;
        if (tw.to !== target) {
          tw.from = s.es[i];
          tw.to = target;
          tw.t = 0;
          tw.open = target > tw.from;
          const base = (tw.open ? a.openMs : a.closeMs) / 1000;
          tw.dur = Math.max(0.05, base * Math.abs(target - tw.from));
          const v = s.vel[i] / Math.max(1e-3, rate);
          tw.v0 = Math.abs(v) > 0.05 ? v - ((target - tw.from) * (tw.open ? OPEN_D0 : CLOSE_D0)) / tw.dur : 0;
        }

        const prevVal = s.es[i];
        if (rate > 0) {
          tw.t += dt * rate;
          const u = Math.min(1, tw.t / tw.dur);
          const ez = tw.open ? OPEN_EASE(u) : CLOSE_EASE(u);
          const carry = tw.v0 * tw.dur * u * (1 - u) * (1 - u);
          s.es[i] = Math.max(0, Math.min(1, tw.from + (tw.to - tw.from) * ez + carry));
        }
        s.vel[i] = dt > 0 ? (s.es[i] - prevVal) / dt : 0;
        const lt = s.pointerIn && s.hovered === i ? 1 : 0;
        s.lift[i] += (lt - s.lift[i]) * (1 - Math.exp(-dt * 8));
      }
      s.ty += (s.py - s.ty) * (1 - Math.exp(-dt * 6));

      // Apply layout and 3D styles
      const L = rowLayout(geo, s.es);
      const settled = rowSettled(s.es, count);
      for (let i = 0; i < count; i++) {
        const ss = slotStyles(
          geo,
          L[i],
          (a.lift / 100) * geo.hs * s.lift[i] * hk,
          a.tilt * s.ty * s.lift[i] * hk,
          a.shadowOpacity / 100,
          settled
        );

        const se = this.slotEls[i], be = this.bookEls[i], sh = this.shadowEls[i];
        if (se) Object.assign(se.style, ss.slot);
        if (be) Object.assign(be.style, ss.book);
        if (sh) Object.assign(sh.style, ss.shadow);

        const ce = this.coverEls[i];
        if (ce && ce.style.opacity !== ss.coverOpacity) ce.style.opacity = ss.coverOpacity;
        const cf = this.coverFaceEls[i];
        if (cf && cf.style.visibility !== ss.coverVisibility) cf.style.visibility = ss.coverVisibility;
        if (cf && cf.style.transform !== ss.coverTransform) cf.style.transform = ss.coverTransform;
        const sf = this.spineFaceEls[i];
        if (sf && sf.style.visibility !== ss.spineVisibility) sf.style.visibility = ss.spineVisibility;
        const pe = this.spineEls[i];
        if (pe && pe.style.opacity !== ss.spineOpacity) pe.style.opacity = ss.spineOpacity;
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  destroy() {
    this.isAlive = false;
    cancelAnimationFrame(this.rafId);
    if (this.ro) this.ro.disconnect();
  }
}
