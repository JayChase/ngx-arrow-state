import { InjectionToken } from '@angular/core';

/**
 * Interface for pluggable state managers used by the ArrowState directive.
 */
export interface ArrowStateManager<T = unknown> {
  /**
   * Optionally called by the directive in `ngOnInit` with a storage key derived
   * from the form-control name.  Use this to lazily create the backing store
   * (e.g. a named Elf store or a `signalState` keyed by storage key) so every
   * directive instance gets fully isolated, named storage with zero clashing.
   * Not required for in-memory managers that are already isolated per instance.
   */
  init?(storageKey: string): void;

  /** Add a value (called on init with the initial value, and on every form submit). */
  add(value: T): void;

  /**
   * Return the "previous" entry and rotate it to the front of the history
   * (called on Arrow Up).  Return `undefined` when there is nothing to cycle to.
   */
  previous(): T | undefined;

  /**
   * Return the "next" entry and rotate it to the back of the history
   * (called on Arrow Down).  Return `undefined` when there is nothing to cycle to.
   */
  next(): T | undefined;

  /** The current history entries. Optional — implementors may choose not to expose internal state. */
  readonly history?: readonly T[];

  /**
   * Optional cleanup hook — called when the host `ArrowState` directive is
   * destroyed.  Implement this to tear down stores that need explicit cleanup
   * (e.g. Elf `store.destroy()`).
   */
  destroy?(): void;
}

/**
 * Default in-memory implementation — mirrors the original behaviour of the directive.
 * The array is rotated on `previous()` / `next()` so circular navigation works the
 * same way as before.
 */
export class DefaultArrowStateManager<T = unknown> implements ArrowStateManager<T> {
  readonly history: T[] = [];

  add(value: T): void {
    this.history.push(value);
  }

  previous(): T | undefined {
    const last = this.history.pop();
    if (last !== undefined) {
      this.history.unshift(last);
    }
    return last;
  }

  next(): T | undefined {
    const first = this.history.shift();
    if (first !== undefined) {
      this.history.push(first);
    }
    return first;
  }
}

/**
 * Injection token for a pre-built ArrowStateManager instance.
 * Kept for backwards compatibility — prefer `ARROW_STATE_MANAGER_FACTORY` for
 * new code so every `ngxArrowState` directive gets its own isolated store.
 */
export const ARROW_STATE_MANAGER = new InjectionToken<ArrowStateManager>('ARROW_STATE_MANAGER');

/**
 * Factory function token provided at **component level** (never root).
 *
 * Return a **new** `ArrowStateManager` instance on every call — the directive
 * calls this factory once per instance during construction, then immediately
 * calls `manager.init?(storageKey)` in `ngOnInit` so the manager can lazily
 * create its named backing store (e.g. a named Elf store or a `signalState`
 * keyed by storage key).
 *
 * The root default creates a `DefaultArrowStateManager` (in-memory, no
 * persistence).  Override at component level with your own implementation:
 *
 * ```ts
 * @Component({
 *   providers: [{
 *     provide: ARROW_STATE_MANAGER_FACTORY,
 *     useValue: () => new MyArrowStateManager(),
 *   }],
 * })
 * ```
 */
export const ARROW_STATE_MANAGER_FACTORY = new InjectionToken<() => ArrowStateManager>(
  'ARROW_STATE_MANAGER_FACTORY',
);
