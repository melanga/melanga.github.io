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
import { inView } from 'motion';
import { RevealDirective } from '../../core/reveal.directive';
import { TrackSectionDirective } from '../../core/track-section.directive';
import { SectionHeadComponent } from '../../shared/section-head/section-head.component';
import { PortfolioDataStore } from '../../core/portfolio-data.store';
import { ProjectFilterService, projectUsesTech } from '../../core/project-filter.service';
import { ProjectDetailService } from '../../core/project-detail.service';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { DOMAINS, domainOf, langColor } from '../../core/tech-domains';
import type { PortfolioProject } from '../../core/portfolio.models';

const MAX_INPUTS = 14;
const MAX_OUTPUTS = 8;

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

interface Point {
  readonly x: number;
  readonly y: number;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

/**
 * The stack as a neural network: technologies (inputs) → domains (hidden layer)
 * → projects (outputs), wired from live GitHub data. Hover traces activations;
 * selecting an input filters the work section.
 */
@Component({
  selector: 'app-stack',
  imports: [RevealDirective, TrackSectionDirective, SectionHeadComponent],
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackComponent implements OnDestroy {
  protected readonly store = inject(PortfolioDataStore);
  protected readonly filter = inject(ProjectFilterService);
  private readonly detail = inject(ProjectDetailService);
  private readonly scroll = inject(SmoothScrollService);

  private readonly netRef = viewChild.required<ElementRef<HTMLElement>>('net');

  protected readonly inView = signal(false);
  protected readonly hover = signal<Focus | null>(null);
  private readonly ports = signal<ReadonlyMap<string, Point>>(new Map());
  protected readonly size = signal({ w: 0, h: 0 });

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
      const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${(a.x + dx).toFixed(1)} ${a.y.toFixed(1)} ${(b.x - dx).toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      out.push({ ...l, d });
    }
    return out;
  });

  protected readonly focus = computed((): Focus | null => {
    const hovered = this.hover();
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
      return { kind: f.kind, title: node?.label ?? '', path: [`${node?.size ?? 0} technologies`, `${projects} projects`], tech: null, matches: projects };
    }
    const output = this.outputs().find((o) => o.id === f.id);
    if (!output) return null;
    const techs = this.inputs().filter((i) => projectUsesTech(output.project, i.label)).map((i) => i.label);
    return { kind: f.kind, title: output.label, path: techs.length ? techs : ['—'], tech: null, matches: 0 };
  });

  private teardown: (() => void)[] = [];

  constructor() {
    afterRenderEffect(() => {
      // Re-measure whenever the node lists re-render.
      this.inputs();
      this.hidden();
      this.outputs();
      this.measure();
    });

    afterNextRender(() => {
      const net = this.netRef().nativeElement;
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => this.measure());
        ro.observe(net);
        this.teardown.push(() => ro.disconnect());
      }
      if (typeof IntersectionObserver === 'undefined') {
        this.inView.set(true);
      } else {
        this.teardown.push(
          inView(
            net,
            () => {
              this.inView.set(true);
              return () => this.inView.set(false);
            },
            { amount: 0.15 },
          ),
        );
      }
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

  protected setHover(kind: Focus['kind'], id: string): void {
    this.hover.set({ kind, id });
  }

  protected clearHover(): void {
    this.hover.set(null);
  }

  protected toggleTech(tech: string): void {
    this.filter.setTag(tech);
  }

  protected showMatches(tech: string): void {
    if (this.filter.selectedTag() !== tech) this.filter.setTag(tech);
    this.scroll.scrollTo('work-index', { offset: -96 });
  }

  protected openProject(node: OutputNode, event: Event): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.detail.open(node.project, rect);
  }

  private measure(): void {
    const net = this.netRef()?.nativeElement;
    if (!net || typeof net.getBoundingClientRect !== 'function') return;
    const box = net.getBoundingClientRect();
    if (!box.width) return;
    const ports = new Map<string, Point>();
    net.querySelectorAll<HTMLElement>('[data-port]').forEach((el) => {
      const r = el.getBoundingClientRect();
      ports.set(el.dataset['port'] ?? '', {
        x: r.left - box.left + r.width / 2,
        y: r.top - box.top + r.height / 2,
      });
    });
    this.ports.set(ports);
    this.size.set({ w: Math.round(box.width), h: Math.round(box.height) });
  }
}
