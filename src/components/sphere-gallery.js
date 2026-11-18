/**
 * SPHERE GALLERY 3D — Dr. Doom Fast-Track Watchlist Multiverse Sphere
 * Built on Originkit raw WebGL architecture (zero external 3D dependencies).
 * Features:
 *   • Spherical Fibonacci shell distribution of MCU Doomsday releases
 *   • Lit emerald Latverian nucleus with additive wireframe glow lattice
 *   • Live dynamic line segments wiring each node to the core
 *   • 3D raycasting with magnetic attraction & camera pop
 *   • Pointer drag orbit with realistic damping & inertia
 *   • Wheel dolly zoom with exponential damping
 *   • Click-to-dossier modal integration
 *   • Pillar category filtering support
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const BASE_SPIN = 0.22;
const SPRING_STIFFNESS = 70;
const HOVER_POP = 0.3;
const BILLBOARD_BLEND = 0.75;
const RADIUS = 12;
const DAMPING = 0.6;
const FOV = 45;
const MIN_DIST = 16;
const MAX_DIST = 65;
const REST_DIST_MUL = 2.8;
const MAX_BRANCHES = 60;
const ZOOM_GAIN = 1;
const ORBIT_SPEED = 0.25;
const ORBIT_DAMPING = 0.6;
const ORBIT_LIMIT = 70;
const DEPTH_FLOOR = 0.32;
const ZOOM_RATE = 9;
const CLICK_SLOP_PX = 6;
const CLICK_MS = 450;
const SPHERE_W = 32;
const SPHERE_H = 24;
const NEAR = 0.1;
const FAR = 2000;

function hash01(i) {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function parseColor(input, fallback) {
  if (!input) return fallback.slice();
  const s = String(input).trim();

  const m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(/[,\s/]+/).filter(Boolean);
    const ch = (t) => t.indexOf('%') >= 0 ? parseFloat(t) / 100 : parseFloat(t) / 255;
    const r = ch(parts[0] ?? '0');
    const g = ch(parts[1] ?? '0');
    const b = ch(parts[2] ?? '0');
    const a = parts[3] === undefined ? 1 : parseFloat(parts[3]);
    if ([r, g, b, a].some((v) => !isFinite(v))) return fallback.slice();
    return [clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1), clamp(a, 0, 1)];
  }

  let h = s.replace(/^#/, '');
  if (h.length === 3 || h.length === 4) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length !== 6 && h.length !== 8) return fallback.slice();
  const n = parseInt(h, 16);
  if (!isFinite(n)) return fallback.slice();
  if (h.length === 6) {
    return [
      ((n >> 16) & 255) / 255,
      ((n >> 8) & 255) / 255,
      (n & 255) / 255,
      1,
    ];
  }
  return [
    ((n >>> 24) & 255) / 255,
    ((n >>> 16) & 255) / 255,
    ((n >>> 8) & 255) / 255,
    (n & 255) / 255,
  ];
}

/* ---------------------------------------------------------------- Matrix Math */
function mat4() {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

function perspective(out, fovyRad, aspect) {
  const f = 1 / Math.tan(fovyRad / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (FAR + NEAR) / (NEAR - FAR);
  out[11] = -1;
  out[14] = (2 * FAR * NEAR) / (NEAR - FAR);
  return out;
}

function mul(out, a, b) {
  for (let c = 0; c < 4; c++) {
    const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
    out[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return out;
}

function rigView(out, yaw, pitch, camZ) {
  const a = Math.cos(pitch), b = Math.sin(pitch);
  const c = Math.cos(yaw), d = Math.sin(yaw);
  out[0] = c;
  out[1] = 0;
  out[2] = -d;
  out[3] = 0;
  out[4] = d * b;
  out[5] = a;
  out[6] = c * b;
  out[7] = 0;
  out[8] = a * d;
  out[9] = -b;
  out[10] = a * c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = -camZ;
  out[15] = 1;
  return out;
}

function rigBasis(yaw, pitch) {
  const a = Math.cos(pitch), b = Math.sin(pitch);
  const c = Math.cos(yaw), d = Math.sin(yaw);
  return [c, d * b, a * d, 0, a, -b, -d, c * b, a * c];
}

function applyBasis(R, x, y, z, out) {
  out[0] = R[0] * x + R[1] * y + R[2] * z;
  out[1] = R[3] * x + R[4] * y + R[5] * z;
  out[2] = R[6] * x + R[7] * y + R[8] * z;
}

function applyBasisT(R, x, y, z, out) {
  out[0] = R[0] * x + R[3] * y + R[6] * z;
  out[1] = R[1] * x + R[4] * y + R[7] * z;
  out[2] = R[2] * x + R[5] * y + R[8] * z;
}

function quatFromYawPitch(yaw, pitch, out) {
  const cy = Math.cos(yaw / 2), sy = Math.sin(yaw / 2);
  const cx = Math.cos(pitch / 2), sx = Math.sin(pitch / 2);
  out[0] = cy * sx;
  out[1] = sy * cx;
  out[2] = -sy * sx;
  out[3] = cy * cx;
  return out;
}

function quatFromZTo(dx, dy, dz, out) {
  const r = dz + 1;
  let x, y, z, w;
  if (r < 1e-6) {
    x = 0; y = -1; z = 0; w = 0;
  } else {
    x = -dy; y = dx; z = 0; w = r;
  }
  const len = Math.hypot(x, y, z, w) || 1;
  out[0] = x / len;
  out[1] = y / len;
  out[2] = z / len;
  out[3] = w / len;
  return out;
}

function quatSlerp(a, b, t, out) {
  if (t <= 0) {
    out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
    return out;
  }
  if (t >= 1) {
    out[0] = b[0]; out[1] = b[1]; out[2] = b[2]; out[3] = b[3];
    return out;
  }
  const ax = a[0], ay = a[1], az = a[2], aw = a[3];
  let bx = b[0], by = b[1], bz = b[2], bw = b[3];
  let cosHalf = aw * bw + ax * bx + ay * by + az * bz;
  if (cosHalf < 0) {
    cosHalf = -cosHalf;
    bx = -bx; by = -by; bz = -bz; bw = -bw;
  }
  if (cosHalf >= 1) {
    out[0] = ax; out[1] = ay; out[2] = az; out[3] = aw;
    return out;
  }
  const sqrSin = 1 - cosHalf * cosHalf;
  if (sqrSin <= Number.EPSILON) {
    const s = 1 - t;
    out[0] = s * ax + t * bx;
    out[1] = s * ay + t * by;
    out[2] = s * az + t * bz;
    out[3] = s * aw + t * bw;
    const len = Math.hypot(out[0], out[1], out[2], out[3]) || 1;
    out[0] /= len; out[1] /= len; out[2] /= len; out[3] /= len;
    return out;
  }
  const sinHalf = Math.sqrt(sqrSin);
  const half = Math.atan2(sinHalf, cosHalf);
  const ra = Math.sin((1 - t) * half) / sinHalf;
  const rb = Math.sin(t * half) / sinHalf;
  out[0] = ax * ra + bx * rb;
  out[1] = ay * ra + by * rb;
  out[2] = az * ra + bz * rb;
  out[3] = aw * ra + bw * rb;
  return out;
}

function compose(out, px, py, pz, q, sx, sy, sz) {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;

  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = px;
  out[13] = py;
  out[14] = pz;
  out[15] = 1;
  return out;
}

function quatAxes(q, right, up, normal) {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  right[0] = 1 - (yy + zz);
  right[1] = xy + wz;
  right[2] = xz - wy;
  up[0] = xy - wz;
  up[1] = 1 - (xx + zz);
  up[2] = yz + wx;
  normal[0] = xz + wy;
  normal[1] = yz - wx;
  normal[2] = 1 - (xx + yy);
}

function buildSphere(widthSeg, heightSeg) {
  const pos = [];
  const grid = [];
  let index = 0;

  for (let iy = 0; iy <= heightSeg; iy++) {
    const row = [];
    const v = iy / heightSeg;
    const theta = v * Math.PI;
    for (let ix = 0; ix <= widthSeg; ix++) {
      const u = ix / widthSeg;
      const phi = u * Math.PI * 2;
      pos.push(
        -Math.cos(phi) * Math.sin(theta),
        Math.cos(theta),
        Math.sin(phi) * Math.sin(theta)
      );
      row.push(index++);
    }
    grid.push(row);
  }

  const tris = [];
  for (let iy = 0; iy < heightSeg; iy++) {
    for (let ix = 0; ix < widthSeg; ix++) {
      const a = grid[iy][ix + 1];
      const b = grid[iy][ix];
      const c = grid[iy + 1][ix];
      const d = grid[iy + 1][ix + 1];
      if (iy !== 0) tris.push(a, b, d);
      if (iy !== heightSeg - 1) tris.push(b, c, d);
    }
  }

  const edges = [];
  for (let i = 0; i < tris.length; i += 3) {
    const a = tris[i], b = tris[i + 1], c = tris[i + 2];
    edges.push(a, b, b, c, c, a);
  }

  return {
    positions: new Float32Array(pos),
    tris: new Uint16Array(tris),
    edges: new Uint16Array(edges),
  };
}

/* ------------------------------------------------------------- GLSL Shaders */
const QUAD_VERT = `
precision highp float;
attribute vec2 aCorner;
uniform mat4 uMVP;
varying vec2 vUv;
void main() {
    vUv = aCorner + 0.5;
    gl_Position = uMVP * vec4(aCorner, 0.0, 1.0);
}
`;

const QUAD_FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uMap;
uniform float uHasTex;
uniform vec2  uHalf;
uniform float uRadius;
uniform float uAA;
uniform float uOpacity;
uniform float uDim;
uniform vec3  uPlaceholder;

float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
    vec2 p = (vUv - 0.5) * 2.0 * uHalf;
    float sHalf = min(uHalf.x, uHalf.y);
    float t = sHalf > 0.0 ? clamp(uRadius / sHalf, 0.0, 1.0) : 0.0;
    vec2 box = mix(uHalf, vec2(sHalf), t);
    float d = sdRoundBox(p, box, uRadius);
    float aa = max(uAA, 1e-5);
    float mask = 1.0 - smoothstep(-aa, aa, d);
    if (mask <= 0.002) discard;

    vec3 col = mix(uPlaceholder, texture2D(uMap, vUv).rgb, uHasTex);
    col *= uDim;

    float a = mask * uOpacity;
    if (a <= 0.002) discard;
    gl_FragColor = vec4(col * a, a);
}
`;

const SOLID_VERT = `
precision highp float;
attribute vec3 aPos;
uniform mat4 uMVP;
uniform float uScale;
void main() {
    gl_Position = uMVP * vec4(aPos * uScale, 1.0);
}
`;

const SOLID_FRAG = `
precision mediump float;
uniform vec4 uColor;
void main() {
    gl_FragColor = vec4(uColor.rgb * uColor.a, uColor.a);
}
`;

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('[SphereGallery3D] shader compilation failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function linkProgram(gl, vertSrc, fragSrc) {
  const v = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!v || !f) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('[SphereGallery3D] link program failed:', gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

/* ------------------------------------------------ Poster Canvas Generator */
function createFallbackPosterCanvas(item, width = 300, height = 450) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#062816');
  grad.addColorStop(0.5, '#02120a');
  grad.addColorStop(1, '#010503');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // Category Badge
  ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
  ctx.fillRect(16, 20, width - 32, 34);
  ctx.fillStyle = '#00E676';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((item.doomsdayCategory || 'DOOMSDAY ESSENTIAL').toUpperCase(), width / 2, 42);

  // Central Icon / Insignia
  ctx.fillStyle = 'rgba(0, 230, 118, 0.12)';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 20, 65, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#00E676';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('DOOM', width / 2, height / 2 - 12);

  // Movie Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px sans-serif';
  const words = (item.title || 'MCU Title').split(' ');
  let line = '';
  let yPos = height - 100;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 40 && n > 0) {
      ctx.fillText(line.trim(), width / 2, yPos);
      line = words[n] + ' ';
      yPos += 24;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), width / 2, yPos);

  // Year / Phase
  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Year ${item.year || '2026'} • Essential Prep`, width / 2, height - 30);

  return canvas;
}

/* ------------------------------------------------ SphereGallery3D Class */
export class DoomsdaySphereGallery {
  constructor(options = {}) {
    this.container = options.container;
    this.canvas = options.canvas;
    this.items = options.items || [];
    this.onItemSelect = options.onItemSelect || (() => {});
    this.onHoverChange = options.onHoverChange || (() => {});

    // Live options
    this.branches = options.branches || 26;
    this.speed = options.speed || 18;
    this.direction = options.direction || 'counterclockwise'; // 'clockwise' | 'counterclockwise'
    this.hoverForce = options.hover || 200;
    this.scale = options.scale || 60;
    this.size = options.size || 28;
    this.rounded = options.rounded || 18;
    this.coreColor = options.coreColor || '#00E676';
    this.lineColor = options.lineColor || 'rgba(0, 230, 118, 0.45)';
    this.coreSize = options.coreSize || 22;

    this.gl = null;
    this.rafId = 0;
    this.isAlive = true;
    this.mediaList = [];
    this.graveyard = [];
    this.nodes = [];
    this.order = [];

    this.pointer = {
      nx: 0,
      ny: 0,
      inside: false,
      dragging: false,
      lastX: 0,
      lastY: 0,
      downX: 0,
      downY: 0,
      downAt: 0,
    };

    this.orbit = {
      yaw: 0,
      pitch: 0,
      yawVel: 0,
      pitchVel: 0,
      spin: 0,
      zoom: RADIUS * REST_DIST_MUL,
      zoomTarget: RADIUS * REST_DIST_MUL,
    };

    this.camDist = this.orbit.zoom / (this.scale / 100);
    this.frameBasis = rigBasis(0, 0);

    this.init();
  }

  init() {
    if (!this.canvas || !this.container) return;

    const attrs = {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      depth: true,
      powerPreference: 'high-performance',
    };

    const gl = this.canvas.getContext('webgl2', attrs) ||
               this.canvas.getContext('webgl', attrs) ||
               this.canvas.getContext('experimental-webgl', attrs);

    if (!gl) {
      console.error('[DoomsdaySphereGallery] WebGL is not available');
      return;
    }
    this.gl = gl;

    this.isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic') ||
                 gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

    // Compile programs
    this.quadProg = linkProgram(gl, QUAD_VERT, QUAD_FRAG);
    this.solidProg = linkProgram(gl, SOLID_VERT, SOLID_FRAG);
    if (!this.quadProg || !this.solidProg) return;

    this.qLoc = {
      aCorner: gl.getAttribLocation(this.quadProg, 'aCorner'),
      uMVP: gl.getUniformLocation(this.quadProg, 'uMVP'),
      uMap: gl.getUniformLocation(this.quadProg, 'uMap'),
      uHasTex: gl.getUniformLocation(this.quadProg, 'uHasTex'),
      uHalf: gl.getUniformLocation(this.quadProg, 'uHalf'),
      uRadius: gl.getUniformLocation(this.quadProg, 'uRadius'),
      uAA: gl.getUniformLocation(this.quadProg, 'uAA'),
      uOpacity: gl.getUniformLocation(this.quadProg, 'uOpacity'),
      uDim: gl.getUniformLocation(this.quadProg, 'uDim'),
      uPlaceholder: gl.getUniformLocation(this.quadProg, 'uPlaceholder'),
    };

    this.sLoc = {
      aPos: gl.getAttribLocation(this.solidProg, 'aPos'),
      uMVP: gl.getUniformLocation(this.solidProg, 'uMVP'),
      uScale: gl.getUniformLocation(this.solidProg, 'uScale'),
      uColor: gl.getUniformLocation(this.solidProg, 'uColor'),
    };

    // Quad geometry buffer
    this.quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
      ]),
      gl.STATIC_DRAW
    );

    // Core sphere geometry
    const ball = buildSphere(SPHERE_W, SPHERE_H);
    this.ball = ball;
    this.ballBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ballBuf);
    gl.bufferData(gl.ARRAY_BUFFER, ball.positions, gl.STATIC_DRAW);

    this.ballTri = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ballTri);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ball.tris, gl.STATIC_DRAW);

    this.ballEdge = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ballEdge);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ball.edges, gl.STATIC_DRAW);

    // Dynamic line buffer
    this.lineBuf = gl.createBuffer();
    this.lineData = new Float32Array(0);

    // Default white 1x1 texture
    this.whiteTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.whiteTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Resize handling
    this.vw = 1;
    this.vh = 1;
    this.resize = () => {
      const w = Math.max(1, this.container.clientWidth);
      const h = Math.max(1, this.container.clientHeight);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.vw = Math.max(1, Math.round(w * dpr));
      this.vh = Math.max(1, Math.round(h * dpr));
      if (this.canvas.width !== this.vw) this.canvas.width = this.vw;
      if (this.canvas.height !== this.vh) this.canvas.height = this.vh;
    };
    this.resize();
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(this.container);

    // Setup input listeners
    this.setupListeners();

    // Prepare textures for items
    this.loadMedia();

    // Start render loop with visibility awareness
    this.setupVisibilityObserver();
  }

  setupVisibilityObserver() {
    this.isRunning = false;
    if (typeof IntersectionObserver !== 'undefined' && this.container) {
      this.io = new IntersectionObserver(([entry]) => {
        const inView = entry.isIntersecting;
        if (inView && !this.isRunning) {
          this.isRunning = true;
          this.startLoop();
        } else if (!inView && this.isRunning) {
          this.isRunning = false;
          if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
          }
        }
      }, { rootMargin: '100px 0px' });
      this.io.observe(this.container);
    } else {
      this.isRunning = true;
      this.startLoop();
    }
  }

  setItems(newItems) {
    this.items = newItems || [];
    this.loadMedia();
  }

  loadMedia() {
    // Retire existing textures safely
    for (const m of this.mediaList) {
      if (m.texture) this.graveyard.push(m.texture);
    }
    this.mediaList = [];

    const items = this.items.length ? this.items : [{ title: 'Doomsday', poster: '' }];

    this.mediaList = items.map((item) => {
      const entry = {
        item,
        image: null,
        aspect: 0.67, // standard 2:3 poster aspect
        texture: null,
        applied: false,
      };

      // Create fallback branded canvas immediately so cards never appear blank
      const fbCanvas = createFallbackPosterCanvas(item);
      entry.fallbackCanvas = fbCanvas;

      if (item.poster) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!this.isAlive) return;
          entry.image = img;
          entry.aspect = (img.naturalWidth || 1) / Math.max(1, img.naturalHeight || 1);
        };
        img.onerror = () => {
          // Use fallback canvas
          entry.image = fbCanvas;
        };
        img.src = item.poster;
      } else {
        entry.image = fbCanvas;
      }

      return entry;
    });
  }

  uploadTexture(source) {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        this.isGL2 ? gl.SRGB8_ALPHA8 : gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source
      );
    } catch (_) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const isPOT = (v) => (v & (v - 1)) === 0 && v > 0;
    const w = source.naturalWidth || source.width || 1;
    const h = source.naturalHeight || source.height || 1;
    const mip = this.isGL2 || (isPOT(w) && isPOT(h));

    if (mip) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      if (this.aniso) {
        const max = gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max || 1));
      }
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    return tex;
  }

  ensureLines(n) {
    if (this.lineData.length === n * 6) return;
    this.lineData = new Float32Array(n * 6);
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.lineData, gl.DYNAMIC_DRAW);
  }

  setupListeners() {
    const canvas = this.canvas;
    const container = this.container;

    const setNdc = (e) => {
      const r = container.getBoundingClientRect();
      this.pointer.nx = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
      this.pointer.ny = -((e.clientY - r.top) / Math.max(1, r.height)) * 2 + 1;
    };

    const rayO = [0, 0, 0];
    const rayD = [0, 0, -1];
    const rayOL = [0, 0, 0];
    const rayDL = [0, 0, -1];
    const axR = [0, 0, 0], axU = [0, 0, 0], axN = [0, 0, 0];

    this.buildRay = (camZ, fovRad, aspect) => {
      const th = Math.tan(fovRad / 2);
      const dx = this.pointer.nx * th * aspect;
      const dy = this.pointer.ny * th;
      const dz = -1;
      const len = Math.hypot(dx, dy, dz) || 1;
      rayO[0] = 0; rayO[1] = 0; rayO[2] = camZ;
      rayD[0] = dx / len; rayD[1] = dy / len; rayD[2] = dz / len;
    };

    this.hitTest = (R) => {
      applyBasisT(R, rayO[0], rayO[1], rayO[2], rayOL);
      applyBasisT(R, rayD[0], rayD[1], rayD[2], rayDL);

      let best = -1;
      let bestT = Infinity;
      for (let i = 0; i < this.nodes.length; i++) {
        const nd = this.nodes[i];
        quatAxes(nd.q, axR, axU, axN);
        const denom = rayDL[0] * axN[0] + rayDL[1] * axN[1] + rayDL[2] * axN[2];
        if (Math.abs(denom) < 1e-8) continue;
        const ox = nd.px - rayOL[0];
        const oy = nd.py - rayOL[1];
        const oz = nd.pz - rayOL[2];
        const t = (ox * axN[0] + oy * axN[1] + oz * axN[2]) / denom;
        if (t <= 0 || t >= bestT) continue;
        const hx = rayOL[0] + rayDL[0] * t - nd.px;
        const hy = rayOL[1] + rayDL[1] * t - nd.py;
        const hz = rayOL[2] + rayDL[2] * t - nd.pz;
        const u = hx * axR[0] + hy * axR[1] + hz * axR[2];
        const v = hx * axU[0] + hy * axU[1] + hz * axU[2];
        if (Math.abs(u) > nd.hx || Math.abs(v) > nd.hy) continue;
        bestT = t;
        best = i;
      }
      return best;
    };

    this.onPointerDown = (e) => {
      setNdc(e);
      this.pointer.inside = true;
      this.pointer.dragging = true;
      this.pointer.lastX = e.clientX;
      this.pointer.lastY = e.clientY;
      this.pointer.downX = e.clientX;
      this.pointer.downY = e.clientY;
      this.pointer.downAt = performance.now();
      this.orbit.yawVel = 0;
      this.orbit.pitchVel = 0;
      canvas.style.cursor = 'grabbing';
    };

    this.onPointerMove = (e) => {
      const r = container.getBoundingClientRect();
      const inBox = e.clientX >= r.left && e.clientX <= r.right &&
                    e.clientY >= r.top && e.clientY <= r.bottom;
      this.pointer.inside = inBox || this.pointer.dragging;
      if (this.pointer.inside) setNdc(e);

      if (!this.pointer.dragging) {
        if (inBox) {
          const fovRad = (FOV * Math.PI) / 180;
          this.buildRay(this.camDist, fovRad, this.vw / this.vh);
          const idx = this.hitTest(this.frameBasis);
          canvas.style.cursor = idx >= 0 ? 'pointer' : 'grab';
          if (idx >= 0 && this.mediaList.length) {
            const item = this.mediaList[idx % this.mediaList.length]?.item;
            if (item) this.onHoverChange(item);
          }
        }
        return;
      }

      const dx = e.clientX - this.pointer.lastX;
      const dy = e.clientY - this.pointer.lastY;
      this.pointer.lastX = e.clientX;
      this.pointer.lastY = e.clientY;

      const orbitSpeed = ORBIT_SPEED;
      this.orbit.yaw += (dx * orbitSpeed * Math.PI) / 180;
      this.orbit.pitch += (dy * orbitSpeed * Math.PI) / 180;
      const lim = (ORBIT_LIMIT * Math.PI) / 180;
      this.orbit.pitch = clamp(this.orbit.pitch, -lim, lim);

      this.orbit.yawVel = dx * orbitSpeed * 60;
      this.orbit.pitchVel = dy * orbitSpeed * 60;
    };

    this.onPointerUp = (e) => {
      if (!this.pointer.dragging) return;
      this.pointer.dragging = false;
      canvas.style.cursor = 'grab';

      const dt = performance.now() - this.pointer.downAt;
      const dist = Math.abs(e.clientX - this.pointer.downX) + Math.abs(e.clientY - this.pointer.downY);

      if (dist <= CLICK_SLOP_PX && dt <= CLICK_MS) {
        this.orbit.yawVel = 0;
        this.orbit.pitchVel = 0;
        setNdc(e);
        const fovRad = (FOV * Math.PI) / 180;
        this.buildRay(this.camDist, fovRad, this.vw / this.vh);
        const idx = this.hitTest(this.frameBasis);
        if (idx >= 0 && this.mediaList.length) {
          const item = this.mediaList[idx % this.mediaList.length]?.item;
          if (item) this.onItemSelect(item);
        }
      }
    };

    this.onWheel = (e) => {
      e.preventDefault();
      this.orbit.zoomTarget = clamp(
        this.orbit.zoomTarget + e.deltaY * 0.02 * ZOOM_GAIN,
        MIN_DIST,
        MAX_DIST
      );
    };

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerleave', () => {
      if (!this.pointer.dragging) this.pointer.inside = false;
    });
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  toggleDirection() {
    this.direction = this.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
  }

  toggleAutoplay() {
    this.speed = this.speed > 0 ? 0 : 18;
    return this.speed > 0;
  }

  resetView() {
    this.orbit.yaw = 0;
    this.orbit.pitch = 0;
    this.orbit.yawVel = 0;
    this.orbit.pitchVel = 0;
    this.orbit.zoomTarget = RADIUS * REST_DIST_MUL;
  }

  startLoop() {
    const gl = this.gl;
    const proj = mat4();
    const view = mat4();
    const viewProj = mat4();
    const model = mat4();
    const mvp = mat4();
    const qRig = [0, 0, 0, 1];
    const qCamLocal = [0, 0, 0, 1];
    const qRadial = [0, 0, 0, 1];
    const forwardLocal = [0, 0, -1];
    const tmpA = [0, 0, 0];
    const rayO = [0, 0, 0];
    const rayD = [0, 0, -1];
    const placeholderRGB = parseColor('#06180e', [0.02, 0.08, 0.05, 1]);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST);

    let prev = performance.now();

    const frame = () => {
      if (!this.isAlive || !this.isRunning) return;
      this.rafId = requestAnimationFrame(frame);

      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      // Clean up retired textures
      while (this.graveyard.length) {
        gl.deleteTexture(this.graveyard.pop());
      }

      const media = this.mediaList;
      const count = clamp(this.branches, 1, MAX_BRANCHES);
      const mediaFor = (i) => media.length ? media[i % media.length] : undefined;

      // Ensure nodes array
      while (this.nodes.length < count) {
        this.nodes.push({
          ox: 0, oy: 0, oz: 0,
          vx: 0, vy: 0, vz: 0,
          px: 0, py: 0, pz: 0,
          q: [0, 0, 0, 1],
          hx: 0, hy: 0,
        });
      }
      if (this.nodes.length > count) this.nodes.length = count;
      this.ensureLines(count);

      // Viewport & Depth Clear
      gl.viewport(0, 0, this.vw, this.vh);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Camera dolly
      this.orbit.zoom += (this.orbit.zoomTarget - this.orbit.zoom) * (1 - Math.exp(-ZOOM_RATE * dt));
      const scaleFactor = clamp(this.scale / 100, 0.2, 4);
      this.camDist = this.orbit.zoom / Math.max(0.001, scaleFactor);

      const fovRad = (FOV * Math.PI) / 180;
      const aspect = this.vw / this.vh;
      perspective(proj, fovRad, aspect);

      // Orbit physics
      if (!this.pointer.dragging) {
        const keep = Math.exp((-6 / Math.max(0.001, ORBIT_DAMPING)) * dt);
        this.orbit.yaw += ((this.orbit.yawVel * dt * Math.PI) / 180) * keep;
        this.orbit.pitch += ((this.orbit.pitchVel * dt * Math.PI) / 180) * keep;
        this.orbit.yawVel *= keep;
        this.orbit.pitchVel *= keep;
        const lim = (ORBIT_LIMIT * Math.PI) / 180;
        this.orbit.pitch = clamp(this.orbit.pitch, -lim, lim);
      }

      const spinSign = this.direction === 'clockwise' ? -1 : 1;
      const spinSpeed = (BASE_SPIN * this.speed * spinSign) / 50;
      this.orbit.spin += spinSpeed * dt;
      if (this.orbit.spin > Math.PI * 2) this.orbit.spin -= Math.PI * 2;

      const yaw = this.orbit.spin + this.orbit.yaw;
      const pitch = this.orbit.pitch;
      rigView(view, yaw, pitch, this.camDist);
      mul(viewProj, proj, view);

      const R = rigBasis(yaw, pitch);
      this.frameBasis = R;
      quatFromYawPitch(yaw, pitch, qRig);

      qCamLocal[0] = -qRig[0];
      qCamLocal[1] = -qRig[1];
      qCamLocal[2] = -qRig[2];
      qCamLocal[3] = qRig[3];
      applyBasisT(R, 0, 0, -1, forwardLocal);

      const coreR = RADIUS * clamp(this.coreSize / 100, 0, 1);
      const coreCol = parseColor(this.coreColor, [0, 0.902, 0.463, 1]);
      const lineCol = parseColor(this.lineColor, [0, 0.902, 0.463, 0.45]);

      // --- Draw Core Nucleus ---------------------------------------
      gl.useProgram(this.solidProg);
      gl.uniformMatrix4fv(this.sLoc.uMVP, false, viewProj);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ballBuf);
      gl.enableVertexAttribArray(this.sLoc.aPos);
      gl.vertexAttribPointer(this.sLoc.aPos, 3, gl.FLOAT, false, 0, 0);

      if (coreR > 0.001) {
        gl.disable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.depthMask(true);
        gl.uniform1f(this.sLoc.uScale, coreR);
        gl.uniform4f(this.sLoc.uColor, coreCol[0], coreCol[1], coreCol[2], 1);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ballTri);
        gl.drawElements(gl.TRIANGLES, this.ball.tris.length, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.CULL_FACE);
      }
      gl.disableVertexAttribArray(this.sLoc.aPos);

      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // Core Mesh Halo function
      const drawHalo = () => {
        gl.useProgram(this.solidProg);
        gl.uniformMatrix4fv(this.sLoc.uMVP, false, viewProj);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ballBuf);
        gl.enableVertexAttribArray(this.sLoc.aPos);
        gl.vertexAttribPointer(this.sLoc.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.uniform1f(this.sLoc.uScale, coreR * 1.45);
        gl.uniform4f(this.sLoc.uColor, coreCol[0], coreCol[1], coreCol[2], 0.7);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ballEdge);
        gl.drawElements(gl.LINES, this.ball.edges.length, gl.UNSIGNED_SHORT, 0);
        gl.disableVertexAttribArray(this.sLoc.aPos);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      };

      if (!count) {
        drawHalo();
        return;
      }

      // --- Magnetic Pointer Ray ------------------------------------
      const force = clamp(this.hoverForce / 100, 0, 3);
      const hoverDist = RADIUS * clamp((this.hoverForce / 100) * 0.35, 0, 3);
      const hovering = this.pointer.inside && force > 0 && hoverDist > 0;
      if (hovering) {
        const th = Math.tan(fovRad / 2);
        const dx = this.pointer.nx * th * aspect;
        const dy = this.pointer.ny * th;
        const dz = -1;
        const len = Math.hypot(dx, dy, dz) || 1;
        rayO[0] = 0; rayO[1] = 0; rayO[2] = this.camDist;
        rayD[0] = dx / len; rayD[1] = dy / len; rayD[2] = dz / len;
      }

      // --- Node Fibonacci Distribution & Spring Physics -----------
      const itemSize = RADIUS * clamp(this.size / 100, 0.01, 2);
      const worldPerPixel = (2 * Math.tan(fovRad / 2)) / this.vh;

      for (let i = 0; i < count; i++) {
        const nd = this.nodes[i];
        const y = 1 - (2 * (i + 0.5)) / count;
        const rr = Math.sqrt(Math.max(0, 1 - y * y));
        const th = GOLDEN_ANGLE * i;
        const Rr = RADIUS;

        const bx = Math.cos(th) * rr * Rr;
        const by = y * Rr;
        const bz = Math.sin(th) * rr * Rr;

        let capture = 0;
        let tx = 0, ty = 0, tz = 0;
        if (hovering) {
          applyBasis(R, bx, by, bz, tmpA);
          const wx = tmpA[0], wy = tmpA[1], wz = tmpA[2];
          const t = Math.max(0, (wx - rayO[0]) * rayD[0] + (wy - rayO[1]) * rayD[1] + (wz - rayO[2]) * rayD[2]);
          const cx = rayO[0] + rayD[0] * t;
          const cy = rayO[1] + rayD[1] * t;
          const cz = rayO[2] + rayD[2] * t;
          const d = Math.hypot(cx - wx, cy - wy, cz - wz);
          if (d < hoverDist) {
            const u = 1 - d / hoverDist;
            capture = u * u * (3 - 2 * u);
            applyBasisT(R, cx - wx, cy - wy, cz - wz, tmpA);
            const k = capture * force;
            tx = tmpA[0] * k;
            ty = tmpA[1] * k;
            tz = tmpA[2] * k;
            const pop = -k * RADIUS * 0.12;
            tx += forwardLocal[0] * pop;
            ty += forwardLocal[1] * pop;
            tz += forwardLocal[2] * pop;
          }
        }

        const damp = 2 + DAMPING * 16;
        nd.vx += (tx - nd.ox) * SPRING_STIFFNESS * dt;
        nd.vy += (ty - nd.oy) * SPRING_STIFFNESS * dt;
        nd.vz += (tz - nd.oz) * SPRING_STIFFNESS * dt;
        const decay = Math.exp(-damp * dt);
        nd.vx *= decay; nd.vy *= decay; nd.vz *= decay;
        nd.ox += nd.vx * dt; nd.oy += nd.vy * dt; nd.oz += nd.vz * dt;

        nd.px = bx + nd.ox;
        nd.py = by + nd.oy;
        nd.pz = bz + nd.oz;

        const radLen = Math.hypot(nd.px, nd.py, nd.pz) || 1;
        quatFromZTo(nd.px / radLen, nd.py / radLen, nd.pz / radLen, qRadial);
        quatSlerp(qRadial, qCamLocal, BILLBOARD_BLEND, nd.q);

        const m = mediaFor(i);
        const aspectI = m?.aspect || 0.67;
        const s = itemSize * (1 + HOVER_POP * capture);
        nd.hx = (s * aspectI) / 2;
        nd.hy = s / 2;

        this.order[i] = i;
      }
      this.order.length = count;

      // Depth sort
      const depthOf = (nd) => R[6] * nd.px + R[7] * nd.py + R[8] * nd.pz;
      this.order.sort((a, b) => depthOf(this.nodes[a]) - depthOf(this.nodes[b]));

      let split = 0;
      while (split < count && depthOf(this.nodes[this.order[split]]) < 0) split++;

      // Connecting lines
      for (let o = 0; o < count; o++) {
        const nd = this.nodes[this.order[o]];
        const len = Math.hypot(nd.px, nd.py, nd.pz) || 1;
        const k = coreR / len;
        this.lineData[o * 6 + 0] = nd.px * k;
        this.lineData[o * 6 + 1] = nd.py * k;
        this.lineData[o * 6 + 2] = nd.pz * k;
        this.lineData[o * 6 + 3] = nd.px;
        this.lineData[o * 6 + 4] = nd.py;
        this.lineData[o * 6 + 5] = nd.pz;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.lineData);

      const drawStrings = (from, cnt) => {
        if (cnt <= 0) return;
        gl.useProgram(this.solidProg);
        gl.uniformMatrix4fv(this.sLoc.uMVP, false, viewProj);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
        gl.enableVertexAttribArray(this.sLoc.aPos);
        gl.vertexAttribPointer(this.sLoc.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.uniform1f(this.sLoc.uScale, 1);
        gl.uniform4f(this.sLoc.uColor, lineCol[0], lineCol[1], lineCol[2], lineCol[3]);
        gl.drawArrays(gl.LINES, from * 2, cnt * 2);
        gl.disableVertexAttribArray(this.sLoc.aPos);
      };

      const beginQuads = () => {
        gl.useProgram(this.quadProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
        gl.enableVertexAttribArray(this.qLoc.aCorner);
        gl.vertexAttribPointer(this.qLoc.aCorner, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1i(this.qLoc.uMap, 0);
        gl.uniform3f(this.qLoc.uPlaceholder, placeholderRGB[0], placeholderRGB[1], placeholderRGB[2]);
        gl.uniform1f(this.qLoc.uOpacity, 1);
        gl.activeTexture(gl.TEXTURE0);
      };

      const drawQuads = (from, to) => {
        for (let o = from; o < to; o++) {
          const i = this.order[o];
          const nd = this.nodes[i];
          const m = mediaFor(i);

          if (m && m.image && !m.texture) {
            m.texture = this.uploadTexture(m.image);
            m.applied = false;
          }

          const aspectI = m?.aspect || 0.67;
          const hasTex = m && m.texture ? 1 : 0;
          gl.bindTexture(gl.TEXTURE_2D, hasTex ? m.texture : this.whiteTex);
          gl.uniform1f(this.qLoc.uHasTex, hasTex);

          const roundedNorm = clamp(this.rounded / 100, 0, 1);
          if (hasTex) {
            gl.uniform2f(this.qLoc.uHalf, aspectI / 2, 0.5);
            gl.uniform1f(this.qLoc.uRadius, roundedNorm * Math.min(aspectI / 2, 0.5));
          } else {
            gl.uniform2f(this.qLoc.uHalf, 0.5, 0.5);
            gl.uniform1f(this.qLoc.uRadius, roundedNorm * 0.5);
          }

          const sy = nd.hy * 2;
          const sx = nd.hx * 2;
          compose(model, nd.px, nd.py, nd.pz, nd.q, sx, sy, 1);
          mul(mvp, viewProj, model);
          gl.uniformMatrix4fv(this.qLoc.uMVP, false, mvp);

          const depth = R[6] * nd.px + R[7] * nd.py + R[8] * nd.pz;
          const tt = clamp((depth + RADIUS) / (2 * RADIUS), 0, 1);
          gl.uniform1f(this.qLoc.uDim, DEPTH_FLOOR + (1 - DEPTH_FLOOR) * tt);

          const dist = Math.max(0.001, this.camDist - depth);
          gl.uniform1f(this.qLoc.uAA, (worldPerPixel * dist) / Math.max(1e-4, sy));

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      };

      // Draw sequence: Back lines -> Back quads -> Core Halo -> Front lines -> Front quads
      drawStrings(0, split);
      beginQuads();
      drawQuads(0, split);
      gl.disableVertexAttribArray(this.qLoc.aCorner);

      drawHalo();

      drawStrings(split, count - split);
      beginQuads();
      drawQuads(split, count);
      gl.disableVertexAttribArray(this.qLoc.aCorner);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  destroy() {
    this.isAlive = false;
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
    if (this.ro) this.ro.disconnect();
    if (this.io) this.io.disconnect();

    const gl = this.gl;
    if (!gl) return;

    gl.deleteBuffer(this.quadBuf);
    gl.deleteBuffer(this.ballBuf);
    gl.deleteBuffer(this.ballTri);
    gl.deleteBuffer(this.ballEdge);
    gl.deleteBuffer(this.lineBuf);
    gl.deleteTexture(this.whiteTex);

    for (const m of this.mediaList) {
      if (m.texture) gl.deleteTexture(m.texture);
    }
    while (this.graveyard.length) {
      gl.deleteTexture(this.graveyard.pop());
    }
    gl.deleteProgram(this.quadProg);
    gl.deleteProgram(this.solidProg);
  }
}
