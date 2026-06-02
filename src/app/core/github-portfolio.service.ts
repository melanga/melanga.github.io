import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  catchError,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  toArray,
  from,
} from 'rxjs';
import {
  normalizeTechName,
  extractReadmeTechnologies,
  buildTechnologyTags,
  filterNoisyTopics,
} from './technology-normalizer';
import {
  PROJECT_OVERRIDES,
} from './portfolio-overrides.data';
import { FALLBACK_PORTFOLIO_DATA } from './portfolio-fallback.data';
import type { PortfolioData, PortfolioProject } from './portfolio.models';

interface GithubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
  archived: boolean;
}

const GITHUB_USER = 'melanga';
const CACHE_KEY = 'portfolio.github.melanga.v2';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const LANGUAGE_CONCURRENCY = 4;

@Injectable({ providedIn: 'root' })
export class GitHubPortfolioService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  loadPortfolio(): Observable<PortfolioData> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(FALLBACK_PORTFOLIO_DATA);
    }

    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }

    return this.fetchFromGitHub().pipe(
      catchError(() => of(FALLBACK_PORTFOLIO_DATA)),
    );
  }

  private fetchFromGitHub(): Observable<PortfolioData> {
    const repos$ = this.http
      .get<GithubRepo[]>(
        `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
      )
      .pipe(
        map((repos) =>
          repos.filter((r) => {
            const override = PROJECT_OVERRIDES[r.name];
            if (override?.hidden) return false;
            if (r.archived) return false;
            return true;
          }),
        ),
        catchError(() => of([] as GithubRepo[])),
      );

    const readme$ = this.http
      .get(
        `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_USER}/main/README.md`,
        { responseType: 'text' },
      )
      .pipe(catchError(() => of('')));

    return forkJoin({ repos: repos$, readme: readme$ }).pipe(
      switchMap(({ repos, readme }) => {
        if (repos.length === 0) {
          return of(FALLBACK_PORTFOLIO_DATA);
        }

        const readmeTechs = extractReadmeTechnologies(readme);

        const reposWithLanguages$ = from(repos).pipe(
          mergeMap(
            (repo) =>
              this.http
                .get<Record<string, number>>(
                  `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/languages`,
                )
                .pipe(
                  map((langs) => ({ repo, langs })),
                  catchError(() => of({ repo, langs: {} as Record<string, number> })),
                ),
            LANGUAGE_CONCURRENCY,
          ),
          toArray(),
        );

        return reposWithLanguages$.pipe(
          map((repoWithLangs) => {
            const repoTechMap = new Map<number, readonly string[]>();
            const projects: PortfolioProject[] = [];

            for (const { repo, langs } of repoWithLangs) {
              const override = PROJECT_OVERRIDES[repo.name];
              const languageNames = Object.keys(langs).map(normalizeTechName);
              const topicNames = filterNoisyTopics(repo.topics ?? []);
              const extraTechs = (override?.extraTechnologies ?? []).map(normalizeTechName);

              const allTechs = [...new Set([...languageNames, ...topicNames, ...extraTechs])];
              repoTechMap.set(repo.id, allTechs);

              const totalBytes = Object.values(langs).reduce((a, b) => a + b, 0);
              const breakdown = new Map<string, number>(
                Object.entries(langs).map(([lang, bytes]) => [
                  normalizeTechName(lang),
                  totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
                ]),
              );

              const primaryLanguage = repo.language ? normalizeTechName(repo.language) : null;

              projects.push({
                id: repo.id,
                name: repo.name,
                displayName: override?.displayName ?? formatRepoName(repo.name),
                description:
                  override?.descriptionOverride ??
                  repo.description ??
                  'No description available.',
                htmlUrl: repo.html_url,
                homepageUrl: repo.homepage || null,
                primaryLanguage,
                technologies: allTechs,
                topics: topicNames,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                updatedAt: repo.updated_at,
                isFork: repo.fork,
                isArchived: repo.archived,
                languageBreakdown: breakdown,
              });
            }

            const sortedProjects = sortProjects(projects);
            const technologies = buildTechnologyTags(repoTechMap, readmeTechs);
            const data: PortfolioData = {
              projects: sortedProjects,
              technologies,
              fetchedAt: Date.now(),
            };

            this.writeCache(data);
            return data;
          }),
        );
      }),
    );
  }

  private readCache(): PortfolioData | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { fetchedAt: number; projects: unknown[]; technologies: unknown[] };
      if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return deserializePortfolioData(parsed);
    } catch {
      return null;
    }
  }

  private writeCache(data: PortfolioData): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(serializePortfolioData(data)));
    } catch {
      // storage quota exceeded — silently skip
    }
  }
}

function formatRepoName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sortProjects(projects: PortfolioProject[]): PortfolioProject[] {
  return [...projects].sort((a, b) => {
    const overrideA = PROJECT_OVERRIDES[a.name];
    const overrideB = PROJECT_OVERRIDES[b.name];

    const weightA = overrideA?.sortWeight ?? 0;
    const weightB = overrideB?.sortWeight ?? 0;
    if (weightB !== weightA) return weightB - weightA;

    const featuredA = overrideA?.featured ? 1 : 0;
    const featuredB = overrideB?.featured ? 1 : 0;
    if (featuredB !== featuredA) return featuredB - featuredA;

    const scoreA = (a.isFork ? 0 : 2) + (a.description ? 1 : 0) + (a.stars > 0 ? 1 : 0);
    const scoreB = (b.isFork ? 0 : 2) + (b.description ? 1 : 0) + (b.stars > 0 ? 1 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function serializePortfolioData(data: PortfolioData): object {
  return {
    ...data,
    projects: data.projects.map((p) => ({
      ...p,
      languageBreakdown: [...p.languageBreakdown.entries()],
    })),
  };
}

function deserializePortfolioData(raw: { fetchedAt: number; projects: unknown[]; technologies: unknown[] }): PortfolioData {
  return {
    fetchedAt: raw.fetchedAt,
    technologies: raw.technologies as PortfolioData['technologies'],
    projects: (raw.projects as Array<Record<string, unknown>>).map((p) => {
      const { languageBreakdown, ...rest } = p;
      return {
        ...(rest as Omit<PortfolioProject, 'languageBreakdown'>),
        languageBreakdown: new Map(languageBreakdown as [string, number][]),
      };
    }) as PortfolioData['projects'],
  };
}
