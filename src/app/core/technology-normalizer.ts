import { TECH_ALIASES, NOISY_TOPICS } from './portfolio-overrides.data';
import type { TechnologyTag } from './portfolio.models';

export function normalizeTechName(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return TECH_ALIASES[lower] ?? raw.trim();
}

export function extractReadmeTechnologies(markdown: string): string[] {
  const found = new Set<string>();

  const techSectionMatch = markdown.match(/##[^#]*tools[\s\S]*?(?=\n##|$)/i);
  const sectionText = techSectionMatch ? techSectionMatch[0] : markdown;

  const knownTechs = [
    'Python',
    'JavaScript',
    'TypeScript',
    'Dart',
    'Java',
    'Kotlin',
    'TensorFlow',
    'Scikit-learn',
    'Flutter',
    'Firebase',
    'React',
    'Angular',
    'Django',
    'Node.js',
    'Docker',
    'PostgreSQL',
    'MySQL',
    'Redis',
    'Tailwind CSS',
    'Git',
    'Linux',
    'AWS',
    'GCP',
    'Redux',
    'Socket.io',
  ];

  for (const tech of knownTechs) {
    const pattern = new RegExp(`\\b${tech.replace(/[.+]/g, (c) => `\\${c}`)}\\b`, 'i');
    if (pattern.test(sectionText)) {
      found.add(tech);
    }
  }

  return [...found];
}

export function buildTechnologyTags(
  repoTechnologies: Map<number, readonly string[]>,
  readmeTechs: readonly string[],
): TechnologyTag[] {
  const tagProjectCounts = new Map<string, number>();
  const tagSources = new Map<string, TechnologyTag['source']>();

  for (const [, techs] of repoTechnologies) {
    for (const raw of techs) {
      const normalized = normalizeTechName(raw);
      tagProjectCounts.set(normalized, (tagProjectCounts.get(normalized) ?? 0) + 1);
      if (!tagSources.has(normalized)) {
        tagSources.set(normalized, 'repo-language');
      }
    }
  }

  for (const tech of readmeTechs) {
    const normalized = normalizeTechName(tech);
    if (!tagSources.has(normalized)) {
      tagSources.set(normalized, 'readme');
      tagProjectCounts.set(normalized, 0);
    }
  }

  return [...tagProjectCounts.entries()]
    .map(([name, projectCount]) => ({
      name,
      source: tagSources.get(name) ?? 'curated',
      projectCount,
    }))
    .sort((a, b) => {
      if (b.projectCount !== a.projectCount) return b.projectCount - a.projectCount;
      return a.name.localeCompare(b.name);
    }) as TechnologyTag[];
}

export function filterNoisyTopics(topics: readonly string[]): string[] {
  return topics
    .filter((t) => !NOISY_TOPICS.has(t.toLowerCase()))
    .map((t) => normalizeTechName(t));
}
