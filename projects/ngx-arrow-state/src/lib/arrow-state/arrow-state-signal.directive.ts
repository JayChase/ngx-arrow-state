import { Directive, ElementRef, inject, input, OnDestroy, OnInit, output } from '@angular/core';
import {
  ARROW_STATE_MANAGER,
  ARROW_STATE_MANAGER_FACTORY,
  ArrowStateManager,
  DefaultArrowStateManager,
} from './arrow-state-manager';
import { shouldChangeState } from './arrow-state-utils';

@Directive({
  selector: 'input[type="text"][ngxArrowStateSignal], textarea[ngxArrowStateSignal]',
  exportAs: 'ngxArrowStateSignal',
  host: {
    '(keydown.arrowup)': 'onArrowUp($event)',
    '(keydown.arrowdown)': 'onArrowDown($event)',
  },
})
export class ArrowStateSignal<T> implements OnInit, OnDestroy {
  private elementRef = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);

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

  storageKey = input.required<string>();

  historyChange = output<T>();

  private submitListener: (() => void) | null = null;

  ngOnInit(): void {
    this.stateManager.init?.(this.storageKey());

    const form = this.elementRef.nativeElement.form;
    if (form) {
      this.submitListener = () => {
        const value = this.elementRef.nativeElement.value;
        if (value) {
          this.stateManager.add(value as unknown as T);
        }
      };
      form.addEventListener('submit', this.submitListener);
    }
  }

  onArrowUp(event: Event): void {
    if (shouldChangeState(this.elementRef.nativeElement, this.stateManager.history?.length ?? 0, 'UP')) {
      const value = this.stateManager.previous();
      if (value !== undefined) {
        this.historyChange.emit(value);
      }
    }
  }

  onArrowDown(event: Event): void {
    if (shouldChangeState(this.elementRef.nativeElement, this.stateManager.history?.length ?? 0, 'DOWN')) {
      const value = this.stateManager.next();
      if (value !== undefined) {
        this.historyChange.emit(value);
      }
    }
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.form?.removeEventListener('submit', this.submitListener!);
    this.stateManager.destroy?.();
  }
}
