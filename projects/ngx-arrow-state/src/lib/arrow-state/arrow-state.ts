import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { FormControlDirective, FormControlName, FormGroupDirective } from '@angular/forms';
import {
  ARROW_STATE_MANAGER,
  ARROW_STATE_MANAGER_FACTORY,
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
export class ArrowState<T> implements OnInit, OnDestroy {
  private elementRef = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
  private formGroupDirective = inject(FormGroupDirective, { optional: false });
  private formControlName = inject(FormControlName, { optional: true });
  private formControlDirective = inject(FormControlDirective, { optional: true });
  private formControl = this.formControlDirective || this.formControlName;

  /**
   * The resolved state manager for this directive instance.
   *
   * Resolution order (both evaluated during field initialisation, inside the
   * Angular injection context):
   * 1. Legacy `ARROW_STATE_MANAGER` token — if a pre-built instance is provided
   *    at component/root level, it is used as-is (backwards compat).
   * 2. `ARROW_STATE_MANAGER_FACTORY` — the factory is called to produce a
   *    **fresh instance per directive**.  `init?(storageKey)` is then called in
   *    `ngOnInit` so the manager can lazily create its named backing store.
   */
  stateManager: ArrowStateManager<T> =
    (inject(ARROW_STATE_MANAGER, { optional: true }) as ArrowStateManager<T> | null) ??
    (
      inject(ARROW_STATE_MANAGER_FACTORY, { optional: true }) as (() => ArrowStateManager<T>) | null
    )?.() ??
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

      // Initialise the manager with a storage key derived from the control name
      // so it can lazily create its named backing store.
      const storageKey =
        this.formControlName?.name != null ? String(this.formControlName.name) : null;
      if (storageKey) {
        this.stateManager.init?.(storageKey);
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

  ngOnDestroy(): void {
    this.stateManager.destroy?.();
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
