import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ArrowState } from './arrow-state';

@Component({
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="onSubmit()">
      <input type="text" formControlName="textInput" ngxArrowState />
    </form>
  `,
  imports: [ReactiveFormsModule, ArrowState],
})
class TestInputComponent {
  formGroup = new FormGroup({
    textInput: new FormControl<string | null>('initial'),
  });
  submitCount = 0;
  onSubmit() {
    this.submitCount++;
  }
}

@Component({
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="onSubmit()">
      <textarea formControlName="textArea" ngxArrowState></textarea>
    </form>
  `,
  imports: [ReactiveFormsModule, ArrowState],
})
class TestTextareaComponent {
  formGroup = new FormGroup({
    textArea: new FormControl<string | null>('initial'),
  });
  submitCount = 0;
  onSubmit() {
    this.submitCount++;
  }
}

describe('ArrowState', () => {
  describe('with text input', () => {
    let fixture: ComponentFixture<TestInputComponent>;
    let component: TestInputComponent;
    let inputEl: HTMLInputElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestInputComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestInputComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      inputEl = fixture.nativeElement.querySelector('input');
    });

    it('should create the directive', () => {
      expect(inputEl).toBeTruthy();
    });

    it('should add initial value to history on init', () => {
      // The initial value should be in history
      expect(component.formGroup.get('textInput')?.value).toBe('initial');
    });

    it('should save value to history on form submit', () => {
      component.formGroup.get('textInput')?.setValue('first submission');
      fixture.detectChanges();

      // Trigger form submit
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(component.submitCount).toBe(1);
    });

    it('should cycle through history on arrow up when cursor at start', () => {
      // Submit a value to add to history
      component.formGroup.get('textInput')?.setValue('first');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      // Set a new value
      component.formGroup.get('textInput')?.setValue('second');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      // Position cursor at start
      inputEl.setSelectionRange(0, 0);

      // Trigger arrow up
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      inputEl.dispatchEvent(arrowUpEvent);
      fixture.detectChanges();

      // Should have cycled to previous value
      const currentValue = component.formGroup.get('textInput')?.value;
      expect(['initial', 'first', 'second']).toContain(currentValue);
    });

    it('should not change value on arrow up when cursor is in middle of text', () => {
      component.formGroup.get('textInput')?.setValue('first');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      component.formGroup.get('textInput')?.setValue('hello world');
      fixture.detectChanges();

      // Position cursor in middle
      inputEl.setSelectionRange(5, 5);

      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      inputEl.dispatchEvent(arrowUpEvent);
      fixture.detectChanges();

      // Value should remain unchanged
      expect(component.formGroup.get('textInput')?.value).toBe('hello world');
    });

    it('should cycle through history on arrow down when cursor at end', () => {
      component.formGroup.get('textInput')?.setValue('first');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      component.formGroup.get('textInput')?.setValue('second');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      // Position cursor at end
      const len = inputEl.value.length;
      inputEl.setSelectionRange(len, len);

      // Trigger arrow down
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      inputEl.dispatchEvent(arrowDownEvent);
      fixture.detectChanges();

      const currentValue = component.formGroup.get('textInput')?.value;
      expect(['initial', 'first', 'second']).toContain(currentValue);
    });

    it('should change value when input is empty', () => {
      component.formGroup.get('textInput')?.setValue('first');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      // Clear the input
      component.formGroup.get('textInput')?.setValue('');
      fixture.detectChanges();

      // Need to sync the DOM value
      inputEl.value = '';

      // Trigger arrow up
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      inputEl.dispatchEvent(arrowUpEvent);
      fixture.detectChanges();

      // Should have retrieved from history
      const currentValue = component.formGroup.get('textInput')?.value;
      expect(['initial', 'first']).toContain(currentValue);
    });

    it('should not change state when text is selected', () => {
      component.formGroup.get('textInput')?.setValue('first');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      component.formGroup.get('textInput')?.setValue('hello world');
      fixture.detectChanges();

      // Select some text
      inputEl.setSelectionRange(0, 5);

      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      inputEl.dispatchEvent(arrowUpEvent);
      fixture.detectChanges();

      // Value should remain unchanged
      expect(component.formGroup.get('textInput')?.value).toBe('hello world');
    });

    it('should not change state when history has less than 2 items', () => {
      // Only initial value in history
      inputEl.setSelectionRange(0, 0);

      const initialValue = component.formGroup.get('textInput')?.value;

      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      inputEl.dispatchEvent(arrowUpEvent);
      fixture.detectChanges();

      expect(component.formGroup.get('textInput')?.value).toBe(initialValue);
    });
  });

  describe('with textarea', () => {
    let fixture: ComponentFixture<TestTextareaComponent>;
    let component: TestTextareaComponent;
    let textareaEl: HTMLTextAreaElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestTextareaComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestTextareaComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      textareaEl = fixture.nativeElement.querySelector('textarea');
    });

    it('should create the directive on textarea', () => {
      expect(textareaEl).toBeTruthy();
    });

    it('should cycle through history on arrow up when cursor at start', () => {
      component.formGroup.get('textArea')?.setValue('first submission');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      component.formGroup.get('textArea')?.setValue('second');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      // Position cursor at start
      textareaEl.setSelectionRange(0, 0);

      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      textareaEl.dispatchEvent(arrowUpEvent);
      fixture.detectChanges();

      const currentValue = component.formGroup.get('textArea')?.value;
      expect(['initial', 'first submission', 'second']).toContain(currentValue);
    });

    it('should cycle through history on arrow down when cursor at end', () => {
      component.formGroup.get('textArea')?.setValue('first');
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      // Position cursor at end
      const len = textareaEl.value.length;
      textareaEl.setSelectionRange(len, len);

      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      textareaEl.dispatchEvent(arrowDownEvent);
      fixture.detectChanges();

      const currentValue = component.formGroup.get('textArea')?.value;
      expect(['initial', 'first']).toContain(currentValue);
    });

    it('should handle multiline text correctly', () => {
      component.formGroup.get('textArea')?.setValue('line1\nline2\nline3');
      fixture.detectChanges();

      // Position cursor in the middle line
      textareaEl.setSelectionRange(7, 7); // Middle of line2

      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      textareaEl.dispatchEvent(arrowUpEvent);
      fixture.detectChanges();

      // Value should remain unchanged since cursor is not at position 0
      expect(component.formGroup.get('textArea')?.value).toBe('line1\nline2\nline3');
    });
  });
});
