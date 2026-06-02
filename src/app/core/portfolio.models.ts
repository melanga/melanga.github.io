export interface PortfolioProject {
  readonly id: number;
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly htmlUrl: string;
  readonly homepageUrl: string | null;
  readonly primaryLanguage: string | null;
  readonly technologies: readonly string[];
  readonly topics: readonly string[];
  readonly stars: number;
  readonly forks: number;
  readonly updatedAt: string;
  readonly isFork: boolean;
  readonly isArchived: boolean;
  readonly languageBreakdown: ReadonlyMap<string, number>;
}

export interface TechnologyTag {
  readonly name: string;
  readonly source: 'readme' | 'repo-language' | 'repo-topic' | 'curated';
  readonly projectCount: number;
}

export interface PortfolioData {
  readonly projects: readonly PortfolioProject[];
  readonly technologies: readonly TechnologyTag[];
  readonly fetchedAt: number;
}

export type PortfolioLoadingState =
  | { status: 'loading' }
  | { status: 'success'; data: PortfolioData }
  | { status: 'error'; error: string; fallback: PortfolioData };
