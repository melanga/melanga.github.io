import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render portfolio sections', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-top-section')).toBeTruthy();
    expect(compiled.querySelector('app-about-me-section')).toBeTruthy();
    expect(compiled.querySelector('app-projects-section')).toBeTruthy();
    expect(compiled.querySelector('app-contact-me-section')).toBeTruthy();
  });
});
