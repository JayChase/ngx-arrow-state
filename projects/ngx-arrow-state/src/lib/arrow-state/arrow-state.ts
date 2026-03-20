import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';
import { FormControlDirective, FormControlName, FormGroupDirective } from '@angular/forms';
import {
  ARROW_STATE_MANAGER,
  ArrowStateManager,
  DefaultArrowStateManager,
} from './arrow-state-manager';

@Directive({
  selector: 'input[type="text"][ngxArrowState], textarea[ngxArrowState]',
  exportAs: 'ngxArrowState',
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

  /**
   * The state manager used for history navigation.  Falls back to an in-memory
   * DefaultArrowStateManager when no ARROW_STATE_MANAGER provider is configured,
   * keeping one isolated instance per directive instance.
   */
  readonly stateManager: ArrowStateManager<T> =
    (inject(ARROW_STATE_MANAGER, { optional: true }) as ArrowStateManager<T> | null) ??
    new DefaultArrowStateManager<T>();

  moveToStartOnUpArrow = input<boolean, boolean | null>(true, {
    transform: (value: boolean | null) => (value ? value : false),
  });

  moveToEndOnDownArrow = input<boolean, boolean | null>(true, {
    transform: (value: boolean | null) => (value ? value : false),
  });

  saveUnSubmittedValues = input<boolean, boolean | null>(true, {
    transform: (value: boolean | null) => (value ? value : false),
  });

  ngOnInit() {
    if (this.formGroupDirective) {
      if (!this.formControl) {
        throw Error(
          'upArrowHistory can only be applied to an element with with a formControlName or formControl directive',
        );
      }

      const onSubmit = this.formGroupDirective.onSubmit;

      this.formGroupDirective.onSubmit = (event) => {
        if (this.formControl) {
          this.stateManager.add(this.formControl.value);
        }
        return onSubmit.bind(this.formGroupDirective)(event);
      };

      // add the initial value to the history as the starting point
      this.stateManager.add(this.formControl.value);
    }
  }

  onArrowUp(event: Event): void {
    if (this.formControl) {
      if (this.shouldChangeState('UP')) {
        const value = this.stateManager.previous();
        if (value !== undefined) {
          this.formControl.control.setValue(value);
        }
      }
    }
  }

  onArrowDown(event: Event): void {
    if (this.formControl) {
      if (this.shouldChangeState('DOWN')) {
        const value = this.stateManager.next();
        if (value !== undefined) {
          this.formControl.control.setValue(value);
        }
      }
    }
  }

  private shouldChangeState(direction: 'UP' | 'DOWN'): boolean {
    if ((this.stateManager.history?.length ?? 0) < 2) {
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
