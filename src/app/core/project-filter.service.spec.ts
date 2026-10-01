import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectFilterService, projectUsesTech } from './project-filter.service';
import { FALLBACK_PORTFOLIO_DATA } from './portfolio-fallback.data';

describe('ProjectFilterService', () => {
  let service: ProjectFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectFilterService);
  });

  it('shows every project until a technology is selected', () => {
    expect(service.filteredProjects().length).toBe(FALLBACK_PORTFOLIO_DATA.projects.length);
  });

  it('filters by technology, case-insensitively, and toggles off on re-select', () => {
    service.setTag('react');
    expect(service.filteredProjects().map((p) => p.name)).toEqual(['event-portal']);
    service.setTag('react');
    expect(service.selectedTag()).toBeNull();
  });

  it('matches technologies exactly', () => {
    const portal = FALLBACK_PORTFOLIO_DATA.projects[1];
    expect(projectUsesTech(portal, 'Node.js')).toBe(true);
    expect(projectUsesTech(portal, 'Node')).toBe(false);
  });
});
