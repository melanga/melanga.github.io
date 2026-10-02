import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the shell and every section of the page', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    for (const selector of [
      'app-signal-field',
      'app-navbar',
      'app-hero',
      'app-about',
      'app-stack',
      'app-work',
      'app-contact',
      'app-project-detail-overlay',
    ]) {
      expect(el.querySelector(selector), selector).toBeTruthy();
    }
  });

  it('should introduce Melanga in the hero heading', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const heading = (fixture.nativeElement as HTMLElement).querySelector('#hero-title');
    expect(heading?.textContent).toContain('Melanga');
    expect(heading?.textContent).toContain('Dissanayake');
  });

  it('should expose an email link in the contact section', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '#contact a[href^="mailto:"]',
    );
    expect(link?.getAttribute('href')).toBe('mailto:dissanayakedmmb@gmail.com');
  });
});
