import { Directive, inject } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';

@Directive({
  selector: '[ngxSubmitOnCtrlEnter]',
  host: {
    '(keydown.control.enter)': 'onCtrlEnter($event)',
  },
})
export class SubmitOnCtrlEnter {
  private formGroupDirective = inject(FormGroupDirective, { optional: false });

  onCtrlEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.formGroupDirective.onSubmit(event);
  }
}
