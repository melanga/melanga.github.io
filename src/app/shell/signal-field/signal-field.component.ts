import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { TickerService } from '../../core/ticker.service';
import { SmoothScrollService, absoluteTop } from '../../core/smooth-scroll.service';
import { IntroService } from '../../core/intro.service';
import { ThemeService } from '../../core/theme.service';
import { clamp, damp, prefersReducedMotion } from '../../core/motion.config';
import { FIELD_FRAGMENT, FIELD_VERTEX } from './field-shaders';
import {
  FIELD_STATE_COUNT,
  FieldState,
  islandShape,
  noiseShape,
  portraitShape,
  randomAttributes,
  sphereShape,
  terrainShape,
  waveShape,
} from './field-shapes';

interface StateLayout {
  readonly x: number;
  readonly y: number;
  readonly sx: number;
  readonly sy: number;
  readonly sz: number;
  readonly alpha: number;
}

interface Anchor {
  readonly start: number;
  readonly end: number;
}

type Uniforms = Record<
  | 'uTime'
  | 'uMix'
  | 'uStates'
  | 'uFromXf'
  | 'uFromXf2'
  | 'uToXf'
  | 'uToXf2'
  | 'uAspect'
  | 'uDpr'
  | 'uSize'
  | 'uMouse'
  | 'uMouseStrength'
  | 'uTilt'
  | 'uMotion'
  | 'uScatter'
  | 'uVelocity'
  | 'uColor'
  | 'uAccent'
  | 'uAlphaScale',
  WebGLUniformLocation | null
>;

const PORTRAIT_SRC = 'assets/images/portrait-density.png';

/** Where each embedding sits on screen, per viewport shape. */
function layoutFor(state: number, aspect: number): StateLayout {
  const wide = aspect >= 1;
  switch (state) {
    case FieldState.Noise:
      return { x: 0, y: 0, sx: aspect * 1.12, sy: 1.12, sz: 1.1, alpha: 0.55 };
    case FieldState.Portrait:
      return wide
        ? { x: aspect * 0.47, y: -0.13, sx: 1.78, sy: 1.78, sz: 1.78, alpha: 1 }
        : { x: 0.02, y: -0.42, sx: 1.25, sy: 1.25, sz: 1.25, alpha: 0.5 };
    case FieldState.Wave:
      return wide
        ? { x: 0, y: -0.6, sx: aspect * 1.08, sy: 0.32, sz: 0.6, alpha: 0.7 }
        : { x: 0, y: -0.62, sx: aspect * 1.1, sy: 0.26, sz: 0.5, alpha: 0.55 };
    case FieldState.Sphere:
      return wide
        ? { x: aspect * 0.5, y: 0.04, sx: 0.74, sy: 0.74, sz: 0.74, alpha: 0.42 }
        : { x: 0, y: 0.3, sx: 0.55, sy: 0.55, sz: 0.55, alpha: 0.28 };
    case FieldState.Terrain:
      return { x: 0, y: -0.82, sx: aspect * 1.4, sy: 0.4, sz: 1.5, alpha: wide ? 0.55 : 0.4 };
    default:
      return wide
        ? { x: aspect * 0.52, y: 0.02, sx: 1.55, sy: 1.55, sz: 1, alpha: 0.95 }
        : { x: 0, y: 0.42, sx: 0.9, sy: 0.9, sz: 1, alpha: 0.4 };
  }
}

function hexToRgb(hex: string, fallback: [number, number, number]): [number, number, number] {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return fallback;
  const v = parseInt(m[1], 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * The signal field: one WebGL particle system that morphs between "embeddings"
 * as the page scrolls — noise → portrait → waveform → latent sphere → terrain → island.
 */
@Component({
  selector: 'app-signal-field',
  template: `<canvas #canvas class="field" aria-hidden="true"></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .field {
      width: 100%;
      height: 100vh;
      height: 100lvh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalFieldComponent implements OnDestroy {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly ticker = inject(TickerService);
  private readonly scroll = inject(SmoothScrollService);
  private readonly intro = inject(IntroService);
  private readonly theme = inject(ThemeService);

  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private uniforms: Uniforms | null = null;
  private stateBuffers: WebGLBuffer[] = [];
  private randBuffer: WebGLBuffer | null = null;
  private attribs = { from: -1, to: -1, rand: -1 };
  private count = 0;

  private aspect = 1;
  private dpr = 1;
  private layouts: StateLayout[] = [];
  private anchors: Anchor[] = [];
  private s = 0;
  private time = 0;
  private reducedMotion = false;

  private mouse = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, target: 0 };
  private scatter = 0;
  private velocity = 0;
  private color: [number, number, number] = [0.925, 0.914, 0.882];
  private accent: [number, number, number] = [1, 0.353, 0.122];
  private lightTheme = false;
  private colorsDirty = true;

  private teardown: (() => void)[] = [];

  constructor() {
    effect(() => {
      this.theme.theme();
      this.colorsDirty = true;
    });
    afterNextRender(() => this.init());
  }

  ngOnDestroy(): void {
    for (const fn of this.teardown) fn();
    this.teardown = [];
    const gl = this.gl;
    if (gl) {
      for (const b of this.stateBuffers) gl.deleteBuffer(b);
      if (this.randBuffer) gl.deleteBuffer(this.randBuffer);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.gl = null;
  }

  private init(): void {
    const canvas = this.canvasRef().nativeElement;
    this.reducedMotion = prefersReducedMotion();
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        depth: false,
        powerPreference: 'high-performance',
      });
    } catch {
      gl = null;
    }
    if (!gl || !this.buildProgram(gl)) {
      canvas.style.display = 'none';
      this.intro.fieldReady.set(true);
      return;
    }
    this.gl = gl;

    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;
    this.count = small || lowPower ? 9000 : 20000;

    this.randBuffer = this.upload(randomAttributes(this.count));
    // The sphere doubles as the portrait's placeholder until the density map loads.
    const sphere = sphereShape(this.count);
    const shapes: Float32Array[] = [
      noiseShape(this.count),
      sphere,
      waveShape(this.count),
      sphere,
      terrainShape(this.count),
      islandShape(this.count),
    ];
    this.stateBuffers = shapes.map((data) => this.upload(data));

    this.loadPortrait();
    this.resize();
    this.bindEvents(canvas);

    // Without an intro the field starts already converged on the portrait.
    this.s = this.intro.skip ? this.targetFromScroll() : 0;
    this.teardown.push(this.ticker.add((_, dt) => this.frame(dt), 10));
  }

  private buildProgram(gl: WebGLRenderingContext): boolean {
    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('[signal-field]', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, FIELD_VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FIELD_FRAGMENT);
    if (!vs || !fs) return false;
    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[signal-field]', gl.getProgramInfoLog(program));
      return false;
    }
    this.program = program;
    gl.useProgram(program);
    const u = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
    this.uniforms = {
      uTime: u('uTime'),
      uMix: u('uMix'),
      uStates: u('uStates'),
      uFromXf: u('uFromXf'),
      uFromXf2: u('uFromXf2'),
      uToXf: u('uToXf'),
      uToXf2: u('uToXf2'),
      uAspect: u('uAspect'),
      uDpr: u('uDpr'),
      uSize: u('uSize'),
      uMouse: u('uMouse'),
      uMouseStrength: u('uMouseStrength'),
      uTilt: u('uTilt'),
      uMotion: u('uMotion'),
      uScatter: u('uScatter'),
      uVelocity: u('uVelocity'),
      uColor: u('uColor'),
      uAccent: u('uAccent'),
      uAlphaScale: u('uAlphaScale'),
    };
    this.attribs = {
      from: gl.getAttribLocation(program, 'aFrom'),
      to: gl.getAttribLocation(program, 'aTo'),
      rand: gl.getAttribLocation(program, 'aRand'),
    };
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    return true;
  }

  private upload(data: Float32Array): WebGLBuffer {
    const gl = this.gl!;
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buf;
  }

  private loadPortrait(): void {
    const img = new Image();
    img.decoding = 'async';
    const done = (): void => this.intro.fieldReady.set(true);
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (ctx && this.gl) {
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, c.width, c.height);
          const shape = portraitShape(this.count, data);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.stateBuffers[FieldState.Portrait]);
          this.gl.bufferData(this.gl.ARRAY_BUFFER, shape, this.gl.STATIC_DRAW);
        }
      } catch {
        // keep the placeholder shape
      }
      done();
    };
    img.onerror = done;
    img.src = PORTRAIT_SRC;
  }

  private bindEvents(canvas: HTMLCanvasElement): void {
    const onMove = (e: PointerEvent): void => {
      this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
      this.mouse.target = 1;
    };
    const onLeave = (): void => {
      this.mouse.target = 0;
    };
    const onDown = (e: PointerEvent): void => {
      onMove(e);
      if (!this.reducedMotion) this.scatter = Math.min(0.55, this.scatter + 0.32);
    };
    const onUp = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') this.mouse.target = 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    const onResize = (): void => this.resize();
    window.addEventListener('resize', onResize, { passive: true });
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => this.measureAnchors());
      ro.observe(document.body);
    }

    const onLost = (e: Event): void => e.preventDefault();
    canvas.addEventListener('webglcontextlost', onLost);

    this.teardown.push(() => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', onLost);
      ro?.disconnect();
    });
  }

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.max(1, Math.round(canvas.clientWidth * this.dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * this.dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    this.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    this.layouts = Array.from({ length: FIELD_STATE_COUNT }, (_, i) => layoutFor(i, this.aspect));
    this.measureAnchors();
  }

  /** Each `[data-field-state]` section pulls the field into its embedding as it scrolls in. */
  private measureAnchors(): void {
    const vh = window.innerHeight;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-field-state]'));
    this.anchors = els
      .map((el) => {
        const end = absoluteTop(el) - vh * 0.22;
        return { start: end - vh * 0.85, end };
      })
      .sort((a, b) => a.end - b.end);
  }

  private targetFromScroll(): number {
    const y = this.scroll.y;
    let s = FieldState.Portrait;
    for (const a of this.anchors) {
      s += clamp((y - a.start) / Math.max(1, a.end - a.start));
    }
    return Math.min(FIELD_STATE_COUNT - 1, s);
  }

  private readColors(): void {
    const styles = getComputedStyle(document.documentElement);
    this.lightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    this.color = hexToRgb(styles.getPropertyValue('--fg'), this.color);
    this.accent = hexToRgb(styles.getPropertyValue('--accent'), this.accent);
    this.colorsDirty = false;
  }

  private frame(dt: number): void {
    const gl = this.gl;
    const u = this.uniforms;
    if (!gl || !u || document.hidden) return;
    if (this.colorsDirty) this.readColors();

    if (!this.reducedMotion) this.time += dt / 1000;

    // Intro: the "training run" converges noise into the portrait.
    const phase = this.intro.phase();
    let target: number;
    if (phase === 'booting' || phase === 'training') {
      target = easeInOutCubic(this.intro.trainingProgress());
      this.s = target;
      this.scatter = Math.max(this.scatter, (1 - target) * 0.22);
    } else {
      target = this.targetFromScroll();
      this.s += (target - this.s) * damp(this.reducedMotion ? 1 : 0.07, dt);
    }

    const k = damp(0.06, dt);
    this.mouse.x += (this.mouse.tx - this.mouse.x) * k;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * k;
    this.mouse.strength += (this.mouse.target - this.mouse.strength) * damp(0.04, dt);
    this.scatter *= Math.pow(0.94, dt / 16.7);
    const v = Math.max(-0.3, Math.min(0.3, this.scroll.velocity * 0.004));
    this.velocity += (v - this.velocity) * damp(0.12, dt);

    const from = Math.min(Math.floor(this.s), FIELD_STATE_COUNT - 2);
    const to = from + 1;
    const mix = clamp(this.s - from);
    const lf = this.layouts[from];
    const lt = this.layouts[to];

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.lightTheme) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    else gl.blendFunc(gl.ONE, gl.ONE);

    this.bindAttrib(this.attribs.rand, this.randBuffer!, 4);
    this.bindAttrib(this.attribs.from, this.stateBuffers[from], 3);
    this.bindAttrib(this.attribs.to, this.stateBuffers[to], 3);

    const motion = this.reducedMotion ? 0 : 1;
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uMix, mix);
    gl.uniform2f(u.uStates, from, to);
    gl.uniform4f(u.uFromXf, lf.x, lf.y, lf.sx, lf.sy);
    gl.uniform4f(u.uFromXf2, lf.sz, lf.alpha, 0, 0);
    gl.uniform4f(u.uToXf, lt.x, lt.y, lt.sx, lt.sy);
    gl.uniform4f(u.uToXf2, lt.sz, lt.alpha, 0, 0);
    gl.uniform1f(u.uAspect, this.aspect);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform1f(u.uSize, this.aspect < 1 ? 1.9 : 2.15);
    gl.uniform2f(u.uMouse, this.mouse.x, this.mouse.y);
    gl.uniform1f(u.uMouseStrength, this.mouse.strength * motion);
    gl.uniform2f(u.uTilt, this.mouse.x * 0.1 * motion, -this.mouse.y * 0.06 * motion);
    gl.uniform1f(u.uMotion, motion);
    gl.uniform1f(u.uScatter, this.scatter * motion);
    gl.uniform1f(u.uVelocity, this.velocity * motion);
    gl.uniform3f(u.uColor, this.color[0], this.color[1], this.color[2]);
    gl.uniform3f(u.uAccent, this.accent[0], this.accent[1], this.accent[2]);
    gl.uniform1f(u.uAlphaScale, this.lightTheme ? 0.95 : 0.85);

    gl.drawArrays(gl.POINTS, 0, this.count);
  }

  private bindAttrib(location: number, buffer: WebGLBuffer, size: number): void {
    const gl = this.gl!;
    if (location < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }
}
