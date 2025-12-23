import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';
import { FormControlDirective, FormControlName, FormGroupDirective } from '@angular/forms';

@Directive({
  selector: 'input[type="text"][ngxArrowState], textarea[ngxArrowState]',
  host: {
    '(keydown.arrowup)': 'onArrowUp($event)',
    '(keydown.arrowdown)': 'onArrowDown($event)',
  },
})
export class ArrowState<T> implements OnInit {
  private elementRef = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
  private formGroupDirective = inject(FormGroupDirective, { optional: false });
  private formControlName = inject(FormControlName, { optional: true });
  private formControlDirective = inject(FormControlDirective, { optional: true });
  private formControl = this.formControlDirective || this.formControlName;

  moveToStartOnUpArrow = input<boolean, boolean | null>(true, {
    transform: (value: boolean | null) => (value ? value : false),
  });

  moveToEndOnDownArrow = input<boolean, boolean | null>(true, {
    transform: (value: boolean | null) => (value ? value : false),
  });

  saveUnSubmittedValues = input<boolean, boolean | null>(true, {
    transform: (value: boolean | null) => (value ? value : false),
  });

  private history: T[] = [];

  ngOnInit() {
    if (this.formGroupDirective) {
      if (!this.formControl) {
        throw Error(
          'upArrowHistory can only be applied to an element with with a formControlName or formControl directive'
        );
      }

      const onSubmit = this.formGroupDirective.onSubmit;

      this.formGroupDirective.onSubmit = (event) => {
        if (this.formControl) {
          this.history.push(this.formControl.value);
        }
        return onSubmit.bind(this.formGroupDirective)(event);
      };

      //add the initial value to the history as the starting point
      this.history.push(this.formControl.value);
    }
  }

  onArrowUp(event: Event): void {
    //don't just pop as need to cycle through history with up and down arrows
    // also handle text area (up and down through them)
    if (this.formControl) {
      if (this.shouldChangeState('UP')) {
        const last = this.history.pop();

        if (last !== undefined) {
          this.formControl.control.setValue(last);
          this.history.unshift(last);
        }
      }
    }
  }

  onArrowDown(event: Event): void {
    //don't just pop as need to cycle through history with up and down arrows
    // also handle text area (up and down through them)
    if (this.formControl) {
      if (this.shouldChangeState('DOWN')) {
        const first = this.history.shift();

        if (first !== undefined) {
          this.formControl.control.setValue(first);
          this.history.push(first);
        }
      }
    }
  }

  private shouldChangeState(direction: 'UP' | 'DOWN'): boolean {
    if (this.history.length < 2) {
      return false;
    }

    if (this.elementRef.nativeElement.value.length === 0) {
      return true;
    }

    // if the user is selecting text then do not change state
    if (
      this.elementRef.nativeElement.selectionStart !== this.elementRef.nativeElement.selectionEnd
    ) {
      return false;
    }

    //if the selectionEnd is the end length of the value
    if (
      (direction === 'UP' && this.elementRef.nativeElement.selectionStart === 0) ||
      (direction === 'DOWN' &&
        this.elementRef.nativeElement.selectionStart === this.elementRef.nativeElement.value.length)
    ) {
      return true;
    } else {
      return false;
    }
  }
}
