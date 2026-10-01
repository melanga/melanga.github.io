import { PROJECT_OVERRIDES } from './portfolio-overrides.data';
import { fingerprint } from './fingerprint';
import { langColor } from './tech-domains';
import type { PortfolioProject } from './portfolio.models';

/** A real screenshot when one exists. */
export function projectImage(project: PortfolioProject): string | null {
  return PROJECT_OVERRIDES[project.name]?.image ?? null;
}

/** Screenshot, or the repository's generative fingerprint. */
export function projectCover(project: PortfolioProject): string | null {
  return projectImage(project) ?? fingerprint(project.name, langColor(project.primaryLanguage));
}
