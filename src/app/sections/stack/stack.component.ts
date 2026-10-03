import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { inView } from 'motion';
import { RevealDirective } from '../../core/reveal.directive';
import { TrackSectionDirective } from '../../core/track-section.directive';
import { SectionHeadComponent } from '../../shared/section-head/section-head.component';
import { PortfolioDataStore } from '../../core/portfolio-data.store';
import { ProjectFilterService, projectUsesTech } from '../../core/project-filter.service';
import { ProjectDetailService } from '../../core/project-detail.service';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { mediaMatches, watchMedia } from '../../core/motion.config';
import { DOMAINS, domainOf, langColor } from '../../core/tech-domains';
import type { PortfolioProject } from '../../core/portfolio.models';
import { layoutCompactGraph, type Point } from './compact-graph';

const MAX_INPUTS = 14;
const MAX_OUTPUTS = 8;

/** Below this width the network turns vertical: the forward pass runs top to bottom. */
const COMPACT_QUERY = '(max-width: 720px)';

interface InputNode {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly domain: string;
}

interface HiddenNode {
  readonly id: string;
  readonly label: string;
  readonly size: number;
}

interface OutputNode {
  readonly id: string;
  readonly label: string;
  readonly lang: string | null;
  readonly color: string;
  readonly project: PortfolioProject;
}

interface Link {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly layer: 0 | 1;
  readonly weight: number;
  /** Idle pulse timing, so the network fires asynchronously. */
  readonly pulseDelay: number;
  readonly pulseDuration: number;
}

interface DrawnLink extends Link {
  readonly d: string;
}

interface Focus {
  readonly kind: 'input' | 'hidden' | 'output';
  readonly id: string;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

const px = (n: number): string => n.toFixed(1);

/**
 * The stack as a neural network: technologies (inputs) → domains (hidden layer)
 * → projects (outputs), wired from live GitHub data. Hover traces activations;
 * selecting an input filters the work section. On narrow screens the network
 * runs top to bottom instead, with the labels unfolded into chips and a list.
 */
@Component({
  selector: 'app-stack',
  imports: [NgTemplateOutlet, RevealDirective, TrackSectionDirective, SectionHeadComponent],
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackComponent implements OnDestroy {
  protected readonly store = inject(PortfolioDataStore);
  protected readonly filter = inject(ProjectFilterService);
  private readonly detail = inject(ProjectDetailService);
  private readonly scroll = inject(SmoothScrollService);

  /** Wide layout: columns measured from the DOM. */
  private readonly netRef = viewChild<ElementRef<HTMLElement>>('net');
  /** Compact layout: the whole module, and the graph whose width drives the geometry. */
  private readonly mnetRef = viewChild<ElementRef<HTMLElement>>('mnet');
  private readonly graphRef = viewChild<ElementRef<HTMLElement>>('graphEl');

  protected readonly compact = signal(mediaMatches(COMPACT_QUERY));
  protected readonly inView = signal(false);
  protected readonly graphInView = signal(false);
  protected readonly hover = signal<Focus | null>(null);
  /** A hidden unit tapped on touch screens, which have no hover. */
  protected readonly pinned = signal<Focus | null>(null);
  private readonly ports = signal<ReadonlyMap<string, Point>>(new Map());
  protected readonly size = signal({ w: 0, h: 0 });
  private readonly graphWidth = signal(0);

  /**
   * The most-used technologies — topped up so every displayed project has at
   * least one incoming connection.
   */
  protected readonly inputs = computed((): InputNode[] => {
    const techs = this.store.technologies();
    const chosen = techs.slice(0, MAX_INPUTS);
    for (const p of this.store.projects().slice(0, MAX_OUTPUTS)) {
      if (chosen.some((t) => projectUsesTech(p, t.name))) continue;
      const extra = techs.find((t) => !chosen.includes(t) && projectUsesTech(p, t.name));
      if (extra) chosen.push(extra);
    }
    return chosen
      .sort((a, b) => b.projectCount - a.projectCount || a.name.localeCompare(b.name))
      .map((t) => ({ id: `i:${t.name}`, label: t.name, count: t.projectCount, domain: domainOf(t.name) }));
  });

  protected readonly hidden = computed((): HiddenNode[] => {
    const inputs = this.inputs();
    return DOMAINS.filter((d) => inputs.some((i) => i.domain === d.id)).map((d) => ({
      id: `h:${d.id}`,
      label: d.label,
      size: inputs.filter((i) => i.domain === d.id).length,
    }));
  });

  protected readonly outputs = computed((): OutputNode[] =>
    this.store
      .projects()
      .slice(0, MAX_OUTPUTS)
      .map((p) => ({
        id: `o:${p.id}`,
        label: p.displayName,
        lang: p.primaryLanguage,
        color: langColor(p.primaryLanguage),
        project: p,
      })),
  );

  /** Inputs grouped by domain (in hidden-layer order), so each cluster sits above its unit. */
  protected readonly compactInputs = computed((): InputNode[] => {
    const order = new Map(this.hidden().map((h, i) => [h.id.slice(2), i]));
    return [...this.inputs()].sort(
      (a, b) =>
        (order.get(a.domain) ?? 99) - (order.get(b.domain) ?? 99) ||
        b.count - a.count ||
        a.label.localeCompare(b.label),
    );
  });

  private readonly links = computed((): Link[] => {
    const inputs = this.inputs();
    const links: Link[] = [];
    const make = (from: string, to: string, layer: 0 | 1, weight: number): Link => {
      const h = hash(from + to);
      return {
        id: `${from}>${to}`,
        from,
        to,
        layer,
        weight,
        pulseDelay: Math.round(h * 7000),
        pulseDuration: Math.round(3800 + hash(to + from) * 5200),
      };
    };
    for (const i of inputs) links.push(make(i.id, `h:${i.domain}`, 0, Math.max(1, i.count)));
    for (const o of this.outputs()) {
      const perDomain = new Map<string, number>();
      for (const i of inputs) {
        if (projectUsesTech(o.project, i.label)) {
          perDomain.set(i.domain, (perDomain.get(i.domain) ?? 0) + 1);
        }
      }
      for (const [domain, n] of perDomain) links.push(make(`h:${domain}`, o.id, 1, n));
    }
    return links;
  });

  protected readonly drawn = computed((): DrawnLink[] => {
    const ports = this.ports();
    const out: DrawnLink[] = [];
    for (const l of this.links()) {
      const a = ports.get(l.from);
      const b = ports.get(l.to);
      if (!a || !b) continue;
      const dx = (b.x - a.x) * 0.5;
      const d = `M${px(a.x)} ${px(a.y)} C${px(a.x + dx)} ${px(a.y)} ${px(b.x - dx)} ${px(b.y)} ${px(b.x)} ${px(b.y)}`;
      out.push({ ...l, d });
    }
    return out;
  });

  /** The compact network: three rows — input dots, hidden units, output dots. */
  protected readonly graph = computed(() =>
    layoutCompactGraph(
      this.graphWidth(),
      this.compactInputs(),
      this.hidden(),
      this.outputs().map((o) => o.id),
      this.links(),
    ),
  );

  protected readonly focus = computed((): Focus | null => {
    const hovered = this.hover() ?? this.pinned();
    if (hovered) return hovered;
    const tag = this.filter.selectedTag();
    return tag ? { kind: 'input', id: `i:${tag}` } : null;
  });

  /** Nodes and links lit by the current focus — the forward/backward pass for one node. */
  protected readonly active = computed((): { nodes: Set<string>; links: Set<string> } | null => {
    const f = this.focus();
    if (!f) return null;
    const nodes = new Set<string>([f.id]);
    const links = new Set<string>();
    const inputs = this.inputs();
    const outputs = this.outputs();
    const link = (from: string, to: string): void => {
      nodes.add(from);
      nodes.add(to);
      links.add(`${from}>${to}`);
    };

    if (f.kind === 'input') {
      const input = inputs.find((i) => i.id === f.id);
      if (!input) return null;
      const h = `h:${input.domain}`;
      link(input.id, h);
      for (const o of outputs) if (projectUsesTech(o.project, input.label)) link(h, o.id);
    } else if (f.kind === 'hidden') {
      const domain = f.id.slice(2);
      for (const i of inputs) if (i.domain === domain) link(i.id, f.id);
      for (const l of this.links()) if (l.from === f.id) link(l.from, l.to);
    } else {
      const output = outputs.find((o) => o.id === f.id);
      if (!output) return null;
      for (const i of inputs) {
        if (projectUsesTech(output.project, i.label)) {
          link(i.id, `h:${i.domain}`);
          link(`h:${i.domain}`, output.id);
        }
      }
    }
    return { nodes, links };
  });

  protected readonly readout = computed(() => {
    const f = this.focus();
    if (!f) return null;
    if (f.kind === 'input') {
      const input = this.inputs().find((i) => i.id === f.id);
      if (!input) return null;
      const matches = this.store.projects().filter((p) => projectUsesTech(p, input.label)).length;
      const domain = DOMAINS.find((d) => d.id === input.domain)?.label ?? '';
      return { kind: f.kind, title: input.label, path: [domain, `${matches} project${matches === 1 ? '' : 's'}`], tech: input.label, matches };
    }
    if (f.kind === 'hidden') {
      const node = this.hidden().find((h) => h.id === f.id);
      const outs = this.active()?.nodes ?? new Set<string>();
      const projects = this.outputs().filter((o) => outs.has(o.id)).length;
      const size = node?.size ?? 0;
      return {
        kind: f.kind,
        title: node?.label ?? '',
        path: [`${size} technolog${size === 1 ? 'y' : 'ies'}`, `${projects} project${projects === 1 ? '' : 's'}`],
        tech: null,
        matches: projects,
      };
    }
    const output = this.outputs().find((o) => o.id === f.id);
    if (!output) return null;
    const techs = this.inputs().filter((i) => projectUsesTech(output.project, i.label)).map((i) => i.label);
    return { kind: f.kind, title: output.label, path: techs.length ? techs : ['—'], tech: null, matches: 0 };
  });

  private teardown: (() => void)[] = [];

  constructor() {
    // Re-measure whenever the layout or the node lists re-render, and keep
    // watching whichever layout is on screen.
    afterRenderEffect((onCleanup) => {
      this.inputs();
      this.hidden();
      this.outputs();
      const el = this.compact() ? this.graphRef()?.nativeElement : this.netRef()?.nativeElement;
      if (!el) return;
      this.measure();
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(() => this.measure());
      ro.observe(el);
      onCleanup(() => ro.disconnect());
    });

    afterRenderEffect((onCleanup) => {
      const root = this.compact() ? this.mnetRef()?.nativeElement : this.netRef()?.nativeElement;
      const graph = this.compact() ? this.graphRef()?.nativeElement : undefined;
      if (!root) return;
      if (typeof IntersectionObserver === 'undefined') {
        this.inView.set(true);
        this.graphInView.set(true);
        return;
      }
      const stops = [
        inView(root, () => {
          this.inView.set(true);
          return () => this.inView.set(false);
        }, { amount: 0.15 }),
      ];
      if (graph) {
        stops.push(
          inView(graph, () => {
            this.graphInView.set(true);
            return () => this.graphInView.set(false);
          }, { amount: 0.35 }),
        );
      }
      onCleanup(() => stops.forEach((stop) => stop()));
    });

    afterNextRender(() => {
      this.teardown.push(watchMedia(COMPACT_QUERY, (matches) => this.compact.set(matches)));
      // Labels change size once the web fonts arrive.
      document.fonts?.ready.then(() => this.measure()).catch(() => undefined);
    });
  }

  ngOnDestroy(): void {
    for (const fn of this.teardown) fn();
  }

  protected isLit(id: string): boolean {
    return this.active()?.nodes.has(id) ?? false;
  }

  protected isLinkLit(id: string): boolean {
    return this.active()?.links.has(id) ?? false;
  }

  /** Hover tracing is for mice and pens: a touch fires enter and leave around every tap. */
  protected pointerEnter(event: PointerEvent, kind: Focus['kind'], id: string): void {
    if (event.pointerType !== 'touch') this.hover.set({ kind, id });
  }

  protected pointerLeave(event: PointerEvent): void {
    if (event.pointerType !== 'touch') this.hover.set(null);
  }

  /**
   * Keyboard focus traces like hover. Focus from a tap or click (or restored by
   * the project overlay) must not, or it outranks every later selection until blur.
   */
  protected focusIn(event: FocusEvent, kind: Focus['kind'], id: string): void {
    const el = event.target as HTMLElement;
    if (typeof el.matches !== 'function' || el.matches(':focus-visible')) this.hover.set({ kind, id });
  }

  protected clearHover(): void {
    this.hover.set(null);
  }

  protected toggleTech(tech: string): void {
    this.pinned.set(null);
    this.filter.setTag(tech);
  }

  protected togglePin(id: string): void {
    // A trace left on another node would hide the unit just selected.
    if (this.hover()?.id !== id) this.hover.set(null);
    this.pinned.set(this.pinned()?.id === id ? null : { kind: 'hidden', id });
  }

  protected showMatches(tech: string): void {
    if (this.filter.selectedTag() !== tech) this.filter.setTag(tech);
    // The index's scroll-margin keeps it clear of the nav.
    this.scroll.scrollTo('work-index');
  }

  protected openProject(node: OutputNode, event: Event): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.detail.open(node.project, rect);
  }

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private measure(): void {
    if (this.compact()) {
      const graph = this.graphRef()?.nativeElement;
      if (graph) this.graphWidth.set(Math.round(graph.clientWidth));
      return;
    }
    const net = this.netRef()?.nativeElement;
    if (!net || typeof net.getBoundingClientRect !== 'function') return;
    const box = net.getBoundingClientRect();
    if (!box.width) return;
    // The edge layer fills the padding box, so measure from inside the border.
    // Ports never carry transforms, so their boxes are their resting positions.
    const ox = box.left + net.clientLeft;
    const oy = box.top + net.clientTop;
    const ports = new Map<string, Point>();
    net.querySelectorAll<HTMLElement>('[data-port]').forEach((el) => {
      const r = el.getBoundingClientRect();
      ports.set(el.dataset['port'] ?? '', {
        x: r.left - ox + r.width / 2,
        y: r.top - oy + r.height / 2,
      });
    });
    this.ports.set(ports);
    this.size.set({ w: net.clientWidth, h: net.clientHeight });
  }
}
