import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  viewChild,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  effect,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ThemeService } from '../../core/theme.service';
import { ResponsiveService } from '../../core/responsive.service';
import { ProjectDetailService } from '../../core/project-detail.service';
import { prefersReducedMotion } from '../../core/motion.config';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface ThemeColors {
  node: string;
  line: string;
}

const CONNECTION_DISTANCE = 150;
const CONNECTION_DISTANCE_SQ = CONNECTION_DISTANCE * CONNECTION_DISTANCE;
const MOUSE_RADIUS = 180;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const MOUSE_FORCE = 0.015;

@Component({
  selector: 'app-neural-network-background',
  template: `<canvas #canvas class="neural-canvas" aria-hidden="true"></canvas>`,
  styles: `
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .neural-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeuralNetworkBackgroundComponent implements AfterViewInit, OnDestroy {
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeService = inject(ThemeService);
  private readonly responsive = inject(ResponsiveService);
  private readonly projectDetail = inject(ProjectDetailService);
  private readonly doc = inject(DOCUMENT);

  private ctx: CanvasRenderingContext2D | null = null;
  private nodes: Node[] = [];
  private animationId: number | null = null;
  private mouseX = -1000;
  private mouseY = -1000;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private reducedMotion = false;
  private visible = true;
  private themeColors: ThemeColors = {
    node: 'rgba(45, 212, 191, 0.6)',
    line: 'rgba(45, 212, 191, 0.15)',
  };

  private readonly onMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  };

  private readonly onVisibilityChange = (): void => {
    this.visible = !this.doc.hidden;
    if (this.visible && this.animationId === null) {
      this.tick();
    }
  };

  private readonly onResize = (): void => {
    this.setupCanvas();
    this.initNodes();
  };

  constructor() {
    effect(() => {
      this.themeService.theme();
      this.refreshThemeColors();
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.refreshThemeColors();
    this.reducedMotion = prefersReducedMotion();
    if (this.reducedMotion) {
      this.drawStatic();
      return;
    }

    this.setupCanvas();
    this.initNodes();
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
    this.doc.addEventListener('visibilitychange', this.onVisibilityChange);
    this.tick();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.doc.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private refreshThemeColors(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const styles = getComputedStyle(this.doc.documentElement);
    this.themeColors = {
      node: styles.getPropertyValue('--neural-node').trim() || 'rgba(45, 212, 191, 0.6)',
      line: styles.getPropertyValue('--neural-line').trim() || 'rgba(45, 212, 191, 0.15)',
    };
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width * this.dpr;
    canvas.height = this.height * this.dpr;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  private initNodes(): void {
    const isMobile = this.responsive.isMobile();
    const count = isMobile ? 35 : 70;
    this.nodes = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.5,
    }));
  }

  private drawConnections(ctx: CanvasRenderingContext2D, line: string): void {
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < CONNECTION_DISTANCE_SQ) {
          const dist = Math.sqrt(distSq);
          ctx.beginPath();
          ctx.strokeStyle = line;
          ctx.globalAlpha = 1 - dist / CONNECTION_DISTANCE;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  private drawNodes(ctx: CanvasRenderingContext2D, node: string): void {
    ctx.globalAlpha = 1;
    for (const n of this.nodes) {
      ctx.beginPath();
      ctx.fillStyle = node;
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawStatic(): void {
    this.setupCanvas();
    this.initNodes();
    const ctx = this.ctx;
    if (!ctx) return;
    const { node, line } = this.themeColors;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawConnections(ctx, line);
    this.drawNodes(ctx, node);
  }

  private tick = (): void => {
    this.animationId = requestAnimationFrame(this.tick);

    if (!this.visible || this.projectDetail.overlayOpen()) {
      return;
    }

    const ctx = this.ctx;
    if (!ctx) return;

    const { node, line } = this.themeColors;
    ctx.clearRect(0, 0, this.width, this.height);

    for (const n of this.nodes) {
      const dx = this.mouseX - n.x;
      const dy = this.mouseY - n.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < MOUSE_RADIUS_SQ && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        n.vx -= (dx / dist) * force * MOUSE_FORCE;
        n.vy -= (dy / dist) * force * MOUSE_FORCE;
      }

      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > this.width) n.vx *= -1;
      if (n.y < 0 || n.y > this.height) n.vy *= -1;

      n.x = Math.max(0, Math.min(this.width, n.x));
      n.y = Math.max(0, Math.min(this.height, n.y));

      n.vx *= 0.995;
      n.vy *= 0.995;
    }

    this.drawConnections(ctx, line);
    this.drawNodes(ctx, node);
  };
}
