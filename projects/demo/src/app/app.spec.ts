import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
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

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('arrow state');
  });

  it('should have a form group with name and description controls', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app.formGroup).toBeTruthy();
    expect(app.formGroup.get('name')).toBeTruthy();
    expect(app.formGroup.get('description')).toBeTruthy();
  });

  it('should initialize form controls with null values', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app.formGroup.get('name')?.value).toBeNull();
    expect(app.formGroup.get('description')?.value).toBeNull();
  });

  it('should reset form on go()', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Set some values
    app.formGroup.get('name')?.setValue('Test Name');
    app.formGroup.get('description')?.setValue('Test Description');
    app.formGroup.markAsDirty();
    app.formGroup.markAsTouched();

    // Call go()
    app.go();

    // Form should be reset
    expect(app.formGroup.get('name')?.value).toBeNull();
    expect(app.formGroup.get('description')?.value).toBeNull();
    expect(app.formGroup.pristine).toBe(true);
    expect(app.formGroup.touched).toBe(false);
  });

  it('should render the form with input and textarea', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[formControlName="name"]');
    const textarea = compiled.querySelector('textarea[formControlName="description"]');

    expect(input).toBeTruthy();
    expect(textarea).toBeTruthy();
  });

  it('should render submit button', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('button[type="submit"]');

    expect(submitButton).toBeTruthy();
  });

  it('should have ArrowState directive on input', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[ngxArrowState]');

    expect(input).toBeTruthy();
  });

  it('should have ArrowState directive on textarea', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const textarea = compiled.querySelector('textarea[ngxArrowState]');

    expect(textarea).toBeTruthy();
  });

  it('should have SubmitOnCtrlEnter directive on input and textarea', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[ngxSubmitOnCtrlEnter]');
    const textarea = compiled.querySelector('textarea[ngxSubmitOnCtrlEnter]');

    expect(input).toBeTruthy();
    expect(textarea).toBeTruthy();
  });

  it('should show snackbar on form submit', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    // Spy on the snackbar
    const snackBarSpy = vi.spyOn((app as any).matSnackBar, 'open');

    app.go();

    expect(snackBarSpy).toHaveBeenCalledWith('form submitted and reset ', undefined, {
      duration: 3000,
    });
  });
});
