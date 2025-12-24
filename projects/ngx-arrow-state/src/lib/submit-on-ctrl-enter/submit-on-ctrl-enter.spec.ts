import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SubmitOnCtrlEnter } from './submit-on-ctrl-enter';

@Component({
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="onSubmit()">
      <input type="text" formControlName="textInput" ngxSubmitOnCtrlEnter />
    </form>
  `,
  imports: [ReactiveFormsModule, SubmitOnCtrlEnter],
})
class TestInputComponent {
  formGroup = new FormGroup({
    textInput: new FormControl<string | null>(''),
  });
  submitCount = 0;
  onSubmit() {
    this.submitCount++;
  }
}

@Component({
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="onSubmit()">
      <textarea formControlName="textArea" ngxSubmitOnCtrlEnter></textarea>
    </form>
  `,
  imports: [ReactiveFormsModule, SubmitOnCtrlEnter],
})
class TestTextareaComponent {
  formGroup = new FormGroup({
    textArea: new FormControl<string | null>(''),
  });
  submitCount = 0;
  onSubmit() {
    this.submitCount++;
  }
}

describe('SubmitOnCtrlEnter', () => {
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

    it('should submit form on Ctrl+Enter', () => {
      expect(component.submitCount).toBe(0);

      const ctrlEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      });
      inputEl.dispatchEvent(ctrlEnterEvent);
      fixture.detectChanges();

      expect(component.submitCount).toBe(1);
    });

    it('should not submit form on Enter without Ctrl', () => {
      expect(component.submitCount).toBe(0);

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: false,
        bubbles: true,
      });
      inputEl.dispatchEvent(enterEvent);
      fixture.detectChanges();

      expect(component.submitCount).toBe(0);
    });

    it('should not submit form on Ctrl without Enter', () => {
      expect(component.submitCount).toBe(0);

      const ctrlEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
      });
      inputEl.dispatchEvent(ctrlEvent);
      fixture.detectChanges();

      expect(component.submitCount).toBe(0);
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

    it('should submit form on Ctrl+Enter in textarea', () => {
      expect(component.submitCount).toBe(0);

      const ctrlEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      });
      textareaEl.dispatchEvent(ctrlEnterEvent);
      fixture.detectChanges();

      expect(component.submitCount).toBe(1);
    });

    it('should not submit form on Enter without Ctrl in textarea', () => {
      expect(component.submitCount).toBe(0);

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: false,
        bubbles: true,
      });
      textareaEl.dispatchEvent(enterEvent);
      fixture.detectChanges();

      expect(component.submitCount).toBe(0);
    });
  });
});
