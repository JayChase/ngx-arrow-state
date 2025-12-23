import { Directive, inject, OnInit } from '@angular/core';
import { FormControlDirective, FormControlName, FormGroupDirective } from '@angular/forms';

@Directive({
  selector: '[ngxArrowState]',
  host: {
    '(keydown.arrowup)': 'onArrowUp($event)',
    '(keydown.arrowdown)': 'onArrowUp($event)',
  },
})
export class ArrowState<T> implements OnInit {
  private formGroupDirective = inject(FormGroupDirective, { optional: false });
  private formControlName = inject(FormControlName, { optional: true });
  private formControlDirective = inject(FormControlDirective, { optional: true });
  private formControl = this.formControlDirective || this.formControlName;

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
    event.preventDefault();
    event.stopPropagation();
    //don't just pop as need to cycle through history with up and down arrows
    // also handle text area (up and down through them)
    if (this.formControl) {
      const last = this.history.pop();

      if (last !== undefined) {
        this.formControl.control.setValue(last);
        this.history.unshift(last);
      }
    }
  }

  onArrowDown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    //don't just pop as need to cycle through history with up and down arrows
    // also handle text area (up and down through them)
    if (this.formControl) {
      const first = this.history.shift();

      if (first !== undefined) {
        this.formControl.control.setValue(first);
        this.history.push(first);
      }
    }
  }
}
