import { effect, Injectable } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { ArrowStateManager } from 'ngx-arrow-state';

interface ArrowSignalState {
  history: string[];
}

const STORAGE_KEY = 'ngrx-arrow-state-history';

/**
 * An {@link ArrowStateManager} backed by the NgRx Signals `signalState` primitive.
 *
 * State is persisted to `localStorage` under the key `ngrx-arrow-state-history`
 * via an Angular {@link effect} that runs whenever the `history` signal changes.
 *
 * **Providing the manager:**
 * ```ts
 * // app.config.ts
 * providers: [
 *   NgrxArrowStateManager,
 *   { provide: ARROW_STATE_MANAGER, useExisting: NgrxArrowStateManager },
 * ]
 * ```
 *
 * @example Read history in a template via the directive reference:
 * ```html
 * <textarea ngxArrowState #controlState="ngxArrowState"></textarea>
 * @for (item of controlState.stateManager.history; track $index) { ... }
 * ```
 */
@Injectable()
export class NgrxArrowStateManager implements ArrowStateManager<string> {
  private readonly state = signalState<ArrowSignalState>({
    history: this.loadFromStorage(),
  });

  constructor() {
    effect(() => {
      const h = this.state.history();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
    });
  }

  get history(): readonly string[] {
    return this.state.history();
  }

  add(value: string): void {
    if (value === null || value === undefined || value === '') return;
    patchState(this.state, { history: [...this.state.history(), value] });
  }

  previous(): string | undefined {
    const h = [...this.state.history()];
    const last = h.pop();
    if (last !== undefined) h.unshift(last);
    patchState(this.state, { history: h });
    return last;
  }

  next(): string | undefined {
    const h = [...this.state.history()];
    const first = h.shift();
    if (first !== undefined) h.push(first);
    patchState(this.state, { history: h });
    return first;
  }

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as string[];
      }
    } catch {
      // ignore malformed storage
    }
    return [];
  }
}
