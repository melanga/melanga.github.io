import {
  GRAPH,
  labelWidth,
  layoutCompactGraph,
  wrapLabel,
  type GraphInput,
  type GraphLink,
} from './compact-graph';

const DOMAINS: readonly [string, string, number][] = [
  ['ml', 'ML & Data', 2],
  ['mobile', 'Mobile', 5],
  ['web', 'Web & UI', 4],
  ['backend', 'Backend', 2],
  ['systems', 'Systems & Tools', 1],
];

const INPUTS: GraphInput[] = DOMAINS.flatMap(([domain, , n]) =>
  Array.from({ length: n }, (_, i) => ({ id: `i:${domain}${i}`, domain })),
);
const HIDDEN = DOMAINS.map(([id, label, size]) => ({ id: `h:${id}`, label, size }));
const OUTPUTS = Array.from({ length: 8 }, (_, i) => `o:${i}`);
const LINKS: GraphLink[] = [
  ...INPUTS.map((i) => ({ id: `${i.id}>h:${i.domain}`, from: i.id, to: `h:${i.domain}`, layer: 0 as const })),
  ...OUTPUTS.flatMap((o, i) => {
    const a = HIDDEN[i % HIDDEN.length].id;
    const b = HIDDEN[(i + 2) % HIDDEN.length].id;
    return [
      { id: `${a}>${o}`, from: a, to: o, layer: 1 as const },
      { id: `${b}>${o}`, from: b, to: o, layer: 1 as const },
    ];
  }),
];

const layout = (width: number) => layoutCompactGraph(width, INPUTS, HIDDEN, OUTPUTS, LINKS)!;

/** Paths are written to 0.1px, so coordinates may round by up to half of that. */
function expectOnNode(actual: [number, number], x: number, y: number): void {
  expect(Math.abs(actual[0] - x)).toBeLessThanOrEqual(0.051);
  expect(Math.abs(actual[1] - y)).toBeLessThanOrEqual(0.051);
}

/** First and last coordinate pairs of an SVG path. */
function endpoints(d: string): { start: [number, number]; end: [number, number] } {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return { start: [n[0], n[1]], end: [n[n.length - 2], n[n.length - 1]] };
}

describe('compact network layout', () => {
  it('wraps unit labels between words, keeping "&" with the word after it', () => {
    expect(wrapLabel('ML & Data', 7)).toEqual(['ML', '& Data']);
    expect(wrapLabel('Systems & Tools', 7)).toEqual(['Systems', '& Tools']);
    expect(wrapLabel('Web & UI', 8)).toEqual(['Web & UI']);
    expect(wrapLabel('Backend', 4)).toEqual(['Backend']);
  });

  it('starts and ends every edge exactly on its nodes', () => {
    for (const width of [260, 320, 390, 520]) {
      const g = layout(width);
      expect(g.links.length).toBe(LINKS.length);
      for (const l of g.links) {
        const { start, end } = endpoints(l.d);
        if (l.layer === 0) {
          const from = g.inputs.find((n) => n.id === l.from)!;
          const to = g.hidden.find((n) => n.id === l.to)!;
          expectOnNode(start, from.x, from.y);
          expectOnNode(end, to.x, to.y);
        } else {
          const from = g.hidden.find((n) => n.id === l.from)!;
          const to = g.outputs.find((n) => n.id === l.to)!;
          expectOnNode(start, from.x, from.outY);
          expectOnNode(end, to.x, to.y);
        }
      }
    }
  });

  it('keeps unit labels apart and inside the graph at every phone width', () => {
    for (let width = 260; width <= 460; width += 5) {
      const g = layout(width);
      const boxes = g.hidden.map((n) => ({
        drop: n.drop,
        left: n.x - labelWidth(n.lines) / 2,
        right: n.x + labelWidth(n.lines) / 2,
      }));
      for (const [i, a] of boxes.entries()) {
        expect(a.left, `label ${i} at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(a.right, `label ${i} at ${width}px`).toBeLessThanOrEqual(width);
        for (const b of boxes.slice(i + 1)) {
          if (a.drop !== b.drop) continue;
          expect(a.right <= b.left || b.right <= a.left, `labels overlap at ${width}px`).toBe(true);
        }
      }
    }
  });

  it('staggers unit labels only when one row is too tight', () => {
    expect(layout(260).hidden.some((n) => n.drop > 0)).toBe(true);
    expect(layout(360).hidden.every((n) => n.drop === 0)).toBe(true);
  });

  it('clusters input dots by domain, left to right', () => {
    const xs = layout(390).inputs.map((n) => n.x);
    const steps = xs.slice(1).map((x, i) => x - xs[i]);
    expect(steps.every((s) => s > 0)).toBe(true);
    const within = Math.min(...steps);
    const between = steps.filter((_, i) => INPUTS[i].domain !== INPUTS[i + 1].domain);
    expect(between.every((s) => s > within * 1.5)).toBe(true);
  });

  it('places the output row below every unit label', () => {
    for (const width of [260, 390]) {
      const g = layout(width);
      const outY = g.outputs[0].y;
      expect(g.hidden.every((n) => n.outY < outY)).toBe(true);
      expect(g.h).toBe(outY + GRAPH.bottom);
      expect(g.unitTop + g.unitHeight).toBe(Math.max(...g.hidden.map((n) => n.outY)));
    }
  });

  it('waits for a width and data before laying anything out', () => {
    expect(layoutCompactGraph(0, INPUTS, HIDDEN, OUTPUTS, LINKS)).toBeNull();
    expect(layoutCompactGraph(390, [], HIDDEN, OUTPUTS, LINKS)).toBeNull();
  });
});
