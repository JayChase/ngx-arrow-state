import { effect, Injectable } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { ArrowStateManager } from 'ngx-arrow-state';

interface ArrowSignalState {
  history: string[];
}

/**
 * NgRx Signals-backed {@link ArrowStateManager}.
 *
 * Provided at **component level** via `ARROW_STATE_MANAGER_FACTORY` so the
 * directive creates a **new instance per control**.  `init(storageKey)` lazily
 * sets the `localStorage` key and hydrates the initial history, keeping each
 * control's state fully isolated.
 *
 * ```ts
 * @Component({
 *   providers: [{
 *     provide: ARROW_STATE_MANAGER_FACTORY,
 *     useValue: () => new NgrxArrowStateManager(),
 *   }],
 * })
 * ```
 */
@Injectable()
export class NgrxArrowStateManager implements ArrowStateManager<string> {
  private storageKey!: string;

  private readonly state = signalState<ArrowSignalState>({ history: [] });

  constructor() {
    // Effect is tied to the directive's injection context — auto-cleaned on
    // directive destroy.  Guard on storageKey being set by init().
    effect(() => {
      if (!this.storageKey) return;
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.history()));
    });
  }

  /**
   * Called by the directive in ngOnInit.  Sets the storage key and
   * hydrates history from localStorage so state survives page refreshes.
   */
  init(storageKey: string): void {
    this.storageKey = `ngrx-arrow-state:${storageKey}`;
    const saved = this.loadFromStorage();
    if (saved.length) {
      patchState(this.state, { history: saved });
    }
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
      const raw = localStorage.getItem(this.storageKey);
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
