/**
 * Layout for the stack network on narrow screens, where it runs top to bottom:
 * a row of input dots (clustered by domain), a row of hidden units, and a row
 * of output dots. Pure geometry, kept apart from the component so it can be tested.
 */

/** Geometry of the vertical network, in CSS px. */
export const GRAPH = {
  /** Inset of the outermost nodes from the graph edges. */
  pad: 12,
  /** Centre line of the input row. */
  top: 8,
  /** Input row → hidden cores. */
  fanIn: 92,
  /** Hidden out-ports → output row. */
  fanOut: 88,
  /** Gap between a hidden core and its label. */
  labelGap: 7,
  lineHeight: 12,
  /** Vertical padding inside a label (top + bottom). */
  labelPadY: 8,
  /** Horizontal padding inside a label (left + right). */
  labelPadX: 10,
  /** Minimum space between neighbouring labels. */
  labelSpace: 4,
  /** Advance of one glyph of the 10px mono labels, letter-spacing included. */
  charWidth: 6.5,
  /** Extra spacing between input clusters, in node slots. */
  clusterGap: 0.9,
  /** Room below the output dots for their index numbers. */
  bottom: 30,
} as const;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface GraphInput {
  readonly id: string;
  readonly domain: string;
}

export interface GraphUnit {
  readonly id: string;
  readonly label: string;
  /** Number of inputs feeding the unit; sets the size of its core. */
  readonly size: number;
}

export interface GraphLink {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly layer: 0 | 1;
}

export interface GraphPoint extends Point {
  readonly id: string;
}

export interface GraphNeuron extends GraphPoint {
  readonly label: string;
  readonly lines: readonly string[];
  readonly size: number;
  /** Core radius. */
  readonly r: number;
  /** How far the label hangs below the first label row (staggered layouts). */
  readonly drop: number;
  /** Bottom of the label: where the unit's outgoing edges start. */
  readonly outY: number;
}

export interface GraphOutput extends GraphPoint {
  readonly index: string;
}

export interface CompactGraph<L extends GraphLink> {
  readonly w: number;
  readonly h: number;
  readonly inputs: readonly GraphPoint[];
  readonly hidden: readonly GraphNeuron[];
  readonly outputs: readonly GraphOutput[];
  readonly links: readonly (L & { readonly d: string })[];
  /** Hidden units span from their core's top (`unitTop`) down to the lowest out-port. */
  readonly unitTop: number;
  readonly unitHeight: number;
  readonly unitWidth: number;
  readonly rMax: number;
}

const px = (n: number): string => n.toFixed(1);

/** Vertical S-curve between two points — signal flowing down a layer. */
export function verticalCurve(a: Point, b: Point): string {
  const k = (b.y - a.y) * 0.55;
  return `M${px(a.x)} ${px(a.y)} C${px(a.x)} ${px(a.y + k)} ${px(b.x)} ${px(b.y - k)} ${px(b.x)} ${px(b.y)}`;
}

/** Greedy word wrap for the hidden-unit labels; "&" stays with the word after it. */
export function wrapLabel(label: string, maxChars: number): string[] {
  const words = label.split(/\s+/).reduce<string[]>((acc, word) => {
    if (acc.at(-1) === '&') acc[acc.length - 1] = `& ${word}`;
    else acc.push(word);
    return acc;
  }, []);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Rendered size of a hidden-unit label. */
export function labelWidth(lines: readonly string[]): number {
  return Math.max(...lines.map((l) => l.length)) * GRAPH.charWidth + GRAPH.labelPadX;
}

export function labelHeight(lines: readonly string[]): number {
  return lines.length * GRAPH.lineHeight + GRAPH.labelPadY;
}

export function layoutCompactGraph<L extends GraphLink>(
  width: number,
  inputs: readonly GraphInput[],
  hidden: readonly GraphUnit[],
  outputIds: readonly string[],
  links: readonly L[],
): CompactGraph<L> | null {
  const w = width;
  if (w < 160 || !inputs.length || !hidden.length || !outputIds.length) return null;

  const span = w - GRAPH.pad * 2;
  const inPorts = new Map<string, Point>();
  const outPorts = new Map<string, Point>();

  // Inputs: one row, clustered by domain.
  let gaps = 0;
  for (let i = 1; i < inputs.length; i++) if (inputs[i].domain !== inputs[i - 1].domain) gaps++;
  const slots = inputs.length - 1 + gaps * GRAPH.clusterGap;
  const step = slots > 0 ? span / slots : 0;
  let x = slots > 0 ? GRAPH.pad : w / 2;
  const inputPoints = inputs.map((n, i): GraphPoint => {
    if (i > 0) x += step * (1 + (n.domain !== inputs[i - 1].domain ? GRAPH.clusterGap : 0));
    const p = { id: n.id, x, y: GRAPH.top };
    outPorts.set(n.id, p);
    return p;
  });

  // Hidden units: a core that gathers the cluster above, and a label the signal leaves from.
  const unitWidth = span / hidden.length;
  const centres = hidden.map((_, i) => GRAPH.pad + unitWidth * (i + 0.5));
  // Labels wrap to their slot and never cross the graph's edges.
  const roomAt = (i: number, slot: number): number =>
    Math.min(slot, 2 * Math.min(centres[i], w - centres[i]));
  const charsFor = (room: number): number =>
    Math.max(4, Math.floor((room - GRAPH.labelPadX - GRAPH.labelSpace) / GRAPH.charWidth));

  let wrapped = hidden.map((h, i) => wrapLabel(h.label, charsFor(roomAt(i, unitWidth))));
  // Too tight for one row (narrow phones, long words): alternate labels drop to a second row.
  const stagger = wrapped.some(
    (lines, i) =>
      i > 0 && (labelWidth(lines) + labelWidth(wrapped[i - 1])) / 2 + GRAPH.labelSpace > unitWidth,
  );
  if (stagger) wrapped = hidden.map((h, i) => wrapLabel(h.label, charsFor(roomAt(i, unitWidth * 2))));
  const firstRow = Math.max(...wrapped.filter((_, i) => i % 2 === 0).map(labelHeight));
  const dropFor = (i: number): number => (stagger && i % 2 === 1 ? firstRow + GRAPH.labelSpace : 0);

  const rMax = 6 + Math.min(6, Math.max(...hidden.map((h) => h.size)));
  const coreY = GRAPH.top + GRAPH.fanIn;
  const neurons = hidden.map((h, i): GraphNeuron => {
    const nx = centres[i];
    // Each unit's signal leaves from the bottom of its own label.
    const outY = coreY + rMax + GRAPH.labelGap + dropFor(i) + labelHeight(wrapped[i]);
    inPorts.set(h.id, { x: nx, y: coreY });
    outPorts.set(h.id, { x: nx, y: outY });
    return {
      id: h.id,
      label: h.label,
      lines: wrapped[i],
      size: h.size,
      r: 6 + Math.min(6, h.size),
      drop: dropFor(i),
      outY,
      x: nx,
      y: coreY,
    };
  });
  const lowest = Math.max(...neurons.map((n) => n.outY));

  // Outputs: evenly spaced, numbered to match the list below.
  const outY = lowest + GRAPH.fanOut;
  const outStep = span / outputIds.length;
  const outputPoints = outputIds.map((id, i): GraphOutput => {
    const p = { id, x: GRAPH.pad + outStep * (i + 0.5), y: outY, index: String(i + 1).padStart(2, '0') };
    inPorts.set(id, p);
    return p;
  });

  const drawn: (L & { d: string })[] = [];
  for (const l of links) {
    const a = outPorts.get(l.from);
    const b = inPorts.get(l.to);
    if (a && b) drawn.push({ ...l, d: verticalCurve(a, b) });
  }

  return {
    w,
    h: outY + GRAPH.bottom,
    inputs: inputPoints,
    hidden: neurons,
    outputs: outputPoints,
    links: drawn,
    unitTop: coreY - rMax,
    unitHeight: lowest - (coreY - rMax),
    unitWidth,
    rMax,
  };
}
