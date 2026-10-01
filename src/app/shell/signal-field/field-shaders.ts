/** Simplex noise 3D — Ian McEwan / Ashima Arts (MIT), webgl-noise. */
const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const FIELD_VERTEX = /* glsl */ `
precision highp float;

attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec4 aRand;

uniform float uTime;
uniform float uMix;
uniform vec2 uStates;
uniform vec4 uFromXf;
uniform vec4 uFromXf2;
uniform vec4 uToXf;
uniform vec4 uToXf2;
uniform float uAspect;
uniform float uDpr;
uniform float uSize;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform vec2 uTilt;
uniform float uMotion;
uniform float uScatter;
uniform float uVelocity;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uAlphaScale;

varying vec3 vColor;
varying float vAlpha;

const float PI = 3.14159265;

${SIMPLEX_3D}

vec3 shapeNoise(vec3 a, float t, out float shade) {
  vec3 q = a * 1.3 + vec3(0.0, 0.0, t * 0.07);
  shade = 0.8;
  return a + vec3(snoise(q), snoise(q + 19.1), snoise(q + 37.7)) * 0.09 * uMotion;
}

vec3 shapePortrait(vec3 a, float t, out float shade) {
  float dark = clamp(a.z / 0.22 + 0.5, 0.0, 1.0);
  shade = 0.35 + pow(dark, 1.5) * 1.15;
  float n = snoise(vec3(a.xy * 5.0, t * 0.22));
  return a + vec3(n * 0.003, n * 0.003, n * 0.05) * uMotion;
}

vec3 shapeWave(vec3 a, float t, out float shade) {
  float x = a.x;
  float tt = t * uMotion;
  float strand = a.z;
  float k = smoothstep(-0.75, 0.25, x);
  float phase = strand * 0.55;
  float carrier = sin(x * 6.2 - tt * 1.1 + phase) * (0.3 + 0.7 * k);
  float harmonic = sin(x * 14.0 - tt * 1.8 + 1.3 + phase * 0.5) * 0.26 * k;
  float signal = (carrier + harmonic) * 0.42 + strand * 0.075 * k;
  float sigma = mix(0.85, 0.01, k);
  float drift = snoise(vec3(x * 2.5, a.y * 1.5, tt * 0.25)) * 0.22 * (1.0 - k);
  shade = mix(0.55, 1.35, k);
  return vec3(x, signal * k + a.y * sigma + drift, strand * 0.25 * k + a.y * 0.6 * (1.0 - k));
}

vec3 shapeSphere(vec3 a, float t, out float shade) {
  float tt = t * uMotion;
  float r = 1.0 + 0.16 * snoise(a * 1.4 + vec3(tt * 0.16));
  vec3 p = a * r;
  float ay = tt * 0.1 + 0.6;
  float ax = 0.38;
  p = vec3(p.x * cos(ay) + p.z * sin(ay), p.y, -p.x * sin(ay) + p.z * cos(ay));
  p = vec3(p.x, p.y * cos(ax) - p.z * sin(ax), p.y * sin(ax) + p.z * cos(ax));
  shade = 0.45 + (p.z * 0.5 + 0.5) * 0.9;
  return p;
}

vec3 shapeTerrain(vec3 a, float t, out float shade) {
  float tt = t * uMotion;
  float x = a.x;
  float d = a.y;
  float z = d - tt * 0.035;
  float h = snoise(vec3(x * 1.4, z * 1.8, 1.7)) * 0.7 + snoise(vec3(x * 3.6, z * 4.6, 4.1)) * 0.22;
  h = max(h, -0.3) + 0.3;
  shade = 0.45 + h * 0.9;
  return vec3(x, h * 1.45 + (1.0 - d) * 0.55, d);
}

vec3 shapeIsland(vec3 a, float t, out float shade) {
  float n = snoise(vec3(a.xy * 6.0, t * 0.2 * uMotion));
  shade = 0.9 + n * 0.3;
  return a + vec3(0.0, 0.0, n * 0.05 * uMotion);
}

vec3 shapeFor(float id, vec3 a, float t, out float shade) {
  if (id < 0.5) return shapeNoise(a, t, shade);
  if (id < 1.5) return shapePortrait(a, t, shade);
  if (id < 2.5) return shapeWave(a, t, shade);
  if (id < 3.5) return shapeSphere(a, t, shade);
  if (id < 4.5) return shapeTerrain(a, t, shade);
  return shapeIsland(a, t, shade);
}

vec3 place(vec3 p, vec4 xf, vec4 xf2) {
  return vec3(p.x * xf.z + xf.x, p.y * xf.w + xf.y, p.z * xf2.x);
}

void main() {
  float t = uTime;
  float shadeA;
  float shadeB;
  vec3 a = place(shapeFor(uStates.x, aFrom, t, shadeA), uFromXf, uFromXf2);
  vec3 b = place(shapeFor(uStates.y, aTo, t, shadeB), uToXf, uToXf2);

  float delay = aRand.x * 0.42;
  float m = smoothstep(delay, delay + 0.58, uMix);
  vec3 p = mix(a, b, m);

  // Mid-flight turbulence: particles swirl between embeddings instead of sliding.
  float burst = sin(m * PI) * uMotion + uScatter;
  vec3 q = p * 0.75 + vec3(0.0, 0.0, t * 0.12);
  p += vec3(snoise(q + 3.1), snoise(q + 11.7), snoise(q + 23.3)) * burst * 0.42;

  // Fast scrolling drags particles behind at different rates — a data-stream smear.
  p.y += uVelocity * (0.35 + aRand.y * 1.3) * uMotion;

  float ry = uTilt.x;
  float rx = uTilt.y;
  p = vec3(p.x * cos(ry) + p.z * sin(ry), p.y, -p.x * sin(ry) + p.z * cos(ry));
  p = vec3(p.x, p.y * cos(rx) - p.z * sin(rx), p.y * sin(rx) + p.z * cos(rx));

  float persp = 3.2 / max(0.45, 3.2 - p.z);
  vec2 ndc = vec2(p.x * persp / uAspect, p.y * persp);

  vec2 diff = ndc - uMouse;
  diff.x *= uAspect;
  float dist = length(diff);
  float push = smoothstep(0.3, 0.0, dist) * uMouseStrength;
  ndc += normalize(diff + vec2(0.0001)) * vec2(1.0 / uAspect, 1.0) * push * 0.085;

  gl_Position = vec4(ndc, 0.0, 1.0);
  float size = uSize * (0.6 + aRand.y * 1.1) * persp * uDpr;
  gl_PointSize = clamp(size, 1.0, 7.0 * uDpr);

  float accent = step(0.94, aRand.w);
  vColor = mix(uColor, uAccent, accent);
  float alpha = mix(uFromXf2.y, uToXf2.y, m) * mix(shadeA, shadeB, m);
  vAlpha = alpha * uAlphaScale * (0.3 + 0.7 * aRand.z) * (1.0 + push * 1.6) * clamp(persp, 0.45, 1.25);
}
`;

export const FIELD_FRAGMENT = /* glsl */ `
precision mediump float;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.12, d) * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}
`;
