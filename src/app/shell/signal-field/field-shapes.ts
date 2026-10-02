/**
 * Particle "embeddings" — each page section gets its own arrangement of the same
 * particles. All shapes are generated in a local unit space; the vertex shader
 * animates and places them (see field-shaders.ts).
 */

export const FieldState = {
  Noise: 0,
  Portrait: 1,
  Wave: 2,
  Sphere: 3,
  Terrain: 4,
  Island: 5,
} as const;

export const FIELD_STATE_COUNT = 6;

/** Deterministic PRNG so the composition is identical on every visit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(1e-6, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Per-particle randoms: x = morph delay, y = size, z = brightness, w = accent pick. */
export function randomAttributes(n: number, seed = 7): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    out[i * 4] = rand();
    out[i * 4 + 1] = Math.pow(rand(), 1.6);
    out[i * 4 + 2] = rand();
    out[i * 4 + 3] = rand();
  }
  return out;
}

/** Static: a uniform cloud filling the view volume. */
export function noiseShape(n: number, seed = 11): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = rand() * 2 - 1;
    out[i * 3 + 1] = rand() * 2 - 1;
    out[i * 3 + 2] = rand() * 2 - 1;
  }
  return out;
}

/**
 * Samples particles from a grayscale density map (dark = dense), weighting edges
 * extra so the silhouette stays crisp. Mirrored so the portrait faces into the page.
 */
export function portraitShape(n: number, image: ImageData, seed = 23): Float32Array {
  const { width: w, height: h, data } = image;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    lum[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
  }

  const weights = new Float32Array(w * h);
  let total = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const dark = Math.max(0, 1 - lum[i] - 0.04);
      const gx = lum[i + 1] - lum[i - 1];
      const gy = lum[i + w] - lum[i - w];
      const edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 2.5);
      const wgt = dark > 0.02 ? Math.pow(dark, 1.6) + edge * 2.2 : 0;
      weights[i] = wgt;
      total += wgt;
    }
  }

  const cdf = new Float32Array(w * h);
  let acc = 0;
  for (let i = 0; i < w * h; i++) {
    acc += weights[i] / (total || 1);
    cdf[i] = acc;
  }

  const rand = mulberry32(seed);
  const out = new Float32Array(n * 3);
  const aspect = w / h;
  for (let k = 0; k < n; k++) {
    const r = rand();
    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const px = (lo % w) + rand();
    const py = Math.floor(lo / w) + rand();
    const dark = 1 - lum[lo];
    out[k * 3] = (0.5 - px / w) * aspect; // mirrored
    out[k * 3 + 1] = 0.5 - py / h;
    // Depth doubles as shading: the shader reads darkness back out of z.
    out[k * 3 + 2] = (dark - 0.5) * 0.22;
  }
  return out;
}

/**
 * Waveform: x along the signal, y a gaussian offset the shader collapses as x grows,
 * z the strand (-1…1) — the clean end of the signal is a ribbon of five strands.
 */
export function waveShape(n: number, seed = 31): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = rand() * 2 - 1;
    out[i * 3 + 1] = gaussian(rand);
    out[i * 3 + 2] = (Math.floor(rand() * 5) - 2) / 2;
  }
  return out;
}

/** Fibonacci sphere — evenly spread unit directions. */
export function sphereShape(n: number, seed = 41): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jitter = 1 + (rand() - 0.5) * 0.04;
    out[i * 3] = Math.cos(theta) * radius * jitter;
    out[i * 3 + 1] = y * jitter;
    out[i * 3 + 2] = Math.sin(theta) * radius * jitter;
  }
  return out;
}

/** Terrain grid: x across, y = depth (-1 far … 1 near); heights come from the shader. */
export function terrainShape(n: number, seed = 53): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(n * 3);
  const cols = Math.round(Math.sqrt(n * 2.2));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out[i * 3] = (c / (cols - 1)) * 2 - 1 + (rand() - 0.5) * 0.004;
    out[i * 3 + 1] = (r / Math.max(1, rows - 1)) * 2 - 1;
    out[i * 3 + 2] = rand();
  }
  return out;
}

/** Simplified coastline of Sri Lanka (lon, lat), clockwise from Point Pedro. */
const SRI_LANKA: readonly (readonly [number, number])[] = [
  [80.23, 9.83], [80.45, 9.72], [80.6, 9.45], [80.82, 9.27], [81.0, 8.95], [81.12, 8.72],
  [81.23, 8.57], [81.4, 8.2], [81.6, 7.9], [81.7, 7.72], [81.8, 7.45], [81.83, 7.3],
  [81.87, 6.9], [81.75, 6.55], [81.55, 6.32], [81.3, 6.18], [81.12, 6.12], [80.85, 5.98],
  [80.59, 5.92], [80.35, 5.97], [80.22, 6.03], [80.05, 6.25], [79.99, 6.42], [79.92, 6.7],
  [79.85, 6.93], [79.83, 7.2], [79.8, 7.6], [79.78, 7.95], [79.75, 8.25], [79.85, 8.6],
  [79.92, 8.98], [80.0, 9.25], [80.08, 9.45], [79.95, 9.58], [79.86, 9.7], [80.02, 9.8],
];

function islandPolygon(): [number, number][] {
  const latMid = 7.875;
  const lonMid = 80.81;
  const span = 3.91;
  return SRI_LANKA.map(([lon, lat]) => [((lon - lonMid) * 0.99) / span, (lat - latMid) / span]);
}

function insidePolygon(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The island of Sri Lanka: dense coastline, softer interior. */
export function islandShape(n: number, seed = 67): Float32Array {
  const rand = mulberry32(seed);
  const poly = islandPolygon();
  const out = new Float32Array(n * 3);
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const lengths = poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length];
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  const perimeter = lengths.reduce((a, b) => a + b, 0);
  const coastCount = Math.floor(n * 0.3);

  for (let k = 0; k < n; k++) {
    let x = 0;
    let y = 0;
    if (k < coastCount) {
      let d = rand() * perimeter;
      let i = 0;
      while (d > lengths[i] && i < lengths.length - 1) {
        d -= lengths[i];
        i++;
      }
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const t = d / lengths[i];
      x = p[0] + (q[0] - p[0]) * t + gaussian(rand) * 0.004;
      y = p[1] + (q[1] - p[1]) * t + gaussian(rand) * 0.004;
    } else {
      do {
        x = minX + rand() * (maxX - minX);
        y = minY + rand() * (maxY - minY);
      } while (!insidePolygon(x, y, poly));
    }
    out[k * 3] = x;
    out[k * 3 + 1] = y;
    out[k * 3 + 2] = (rand() - 0.5) * 0.06;
  }
  return out;
}
