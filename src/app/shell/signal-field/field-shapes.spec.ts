import {
  islandShape,
  mulberry32,
  noiseShape,
  portraitShape,
  randomAttributes,
  sphereShape,
  terrainShape,
  waveShape,
} from './field-shapes';

const N = 2000;

function allFinite(data: Float32Array): boolean {
  return data.every((v) => Number.isFinite(v));
}

describe('field shapes', () => {
  it('generate one xyz triple per particle with finite values', () => {
    for (const shape of [noiseShape(N), waveShape(N), sphereShape(N), terrainShape(N), islandShape(N)]) {
      expect(shape.length).toBe(N * 3);
      expect(allFinite(shape)).toBe(true);
    }
    expect(randomAttributes(N).length).toBe(N * 4);
  });

  it('are deterministic, so the composition is identical on every visit', () => {
    expect(islandShape(500)).toEqual(islandShape(500));
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('keeps the island inside its unit bounds', () => {
    const island = islandShape(N);
    for (let i = 0; i < N; i++) {
      expect(Math.abs(island[i * 3])).toBeLessThan(0.35);
      expect(Math.abs(island[i * 3 + 1])).toBeLessThan(0.55);
    }
  });

  it('puts sphere points on the unit sphere', () => {
    const sphere = sphereShape(N);
    for (let i = 0; i < N; i += 97) {
      const r = Math.hypot(sphere[i * 3], sphere[i * 3 + 1], sphere[i * 3 + 2]);
      expect(r).toBeGreaterThan(0.97);
      expect(r).toBeLessThan(1.03);
    }
  });

  it('samples the portrait only where the density map is dark', () => {
    // 4x4 map: white everywhere except one dark pixel at (1, 1) — interior so the edge pass sees it.
    const w = 4;
    const h = 4;
    const data = new Uint8ClampedArray(w * h * 4).fill(255);
    const dark = (1 * w + 1) * 4;
    data[dark] = data[dark + 1] = data[dark + 2] = 0;
    const image = { width: w, height: h, data, colorSpace: 'srgb' } as ImageData;
    const shape = portraitShape(300, image);
    const aspect = w / h;
    for (let i = 0; i < 300; i++) {
      // Mirrored x: pixel column 1 maps into (0.5 - 2/4, 0.5 - 1/4] * aspect.
      const x = shape[i * 3];
      expect(x).toBeGreaterThan((0.5 - 2 / w) * aspect - 1e-6);
      expect(x).toBeLessThanOrEqual((0.5 - 1 / w) * aspect + 1e-6);
    }
  });
});
