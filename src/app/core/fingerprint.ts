import { isBrowser } from './motion.config';

const cache = new Map<string, string>();

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '');
  const v = parseInt(m.length === 3 ? m.replace(/./g, '$&$&') : m, 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}

/**
 * A generative cover for repositories that have no screenshot: a flow field
 * seeded by the repo name, tinted with its primary language colour. Every
 * repository gets its own, always-identical, visual fingerprint.
 */
export function fingerprint(name: string, color: string, width = 720, height = 450): string | null {
  const key = `${name}|${color}|${width}x${height}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (!isBrowser()) return null;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
  } catch {
    return null;
  }
  if (!ctx) return null;

  const rand = rng(hashSeed(name));
  ctx.fillStyle = '#0c0e11';
  ctx.fillRect(0, 0, width, height);

  // Technical-drawing grid.
  ctx.strokeStyle = 'rgba(236, 233, 225, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }

  const f1 = 0.0025 + rand() * 0.006;
  const f2 = 0.0025 + rand() * 0.006;
  const p1 = rand() * 10;
  const p2 = rand() * 10;
  const twist = 1.2 + rand() * 2.4;
  const angle = (x: number, y: number): number =>
    (Math.sin(x * f1 + p1) + Math.cos(y * f2 + p2) + Math.sin((x - y) * f1 * 0.7 + p2)) * twist;

  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const strokes = 620;
  for (let i = 0; i < strokes; i++) {
    let x = rand() * width;
    let y = rand() * height;
    const pick = rand();
    ctx.strokeStyle =
      pick < 0.07
        ? 'rgba(255, 90, 31, 0.65)'
        : pick < 0.4
          ? rgba(color, 0.32 + rand() * 0.3)
          : `rgba(236, 233, 225, ${(0.07 + rand() * 0.16).toFixed(3)})`;
    ctx.lineWidth = pick < 0.07 ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 24 + Math.floor(rand() * 40);
    for (let s = 0; s < steps; s++) {
      const a = angle(x, y);
      x += Math.cos(a) * 3.2;
      y += Math.sin(a) * 3.2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  const fade = ctx.createLinearGradient(0, height * 0.55, 0, height);
  fade.addColorStop(0, 'rgba(12, 14, 17, 0)');
  fade.addColorStop(1, 'rgba(12, 14, 17, 0.9)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, width, height);

  ctx.font = '500 15px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(236, 233, 225, 0.85)';
  ctx.fillText(name, 26, height - 28);
  ctx.fillStyle = 'rgba(236, 233, 225, 0.4)';
  ctx.font = '500 11px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillText(`SEED ${hashSeed(name).toString(16).toUpperCase().padStart(8, '0')}`, 26, 34);
  ctx.fillStyle = color;
  ctx.fillRect(width - 38, 26, 12, 12);

  let url: string;
  try {
    url = canvas.toDataURL('image/webp', 0.86);
    if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/png');
  } catch {
    return null;
  }
  cache.set(key, url);
  return url;
}
