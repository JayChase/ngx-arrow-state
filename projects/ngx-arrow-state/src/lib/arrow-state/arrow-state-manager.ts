import { InjectionToken } from '@angular/core';

/**
 * Interface for pluggable state managers used by the ArrowState directive.
 *
 * Implement this interface to integrate a custom state solution (e.g. @ngneat/elf)
 * and provide it via the ARROW_STATE_MANAGER injection token:
 *
 * ```ts
 * providers: [{ provide: ARROW_STATE_MANAGER, useClass: MyElfStateManager }]
 * ```
 *
 * When no provider is configured the directive falls back to DefaultArrowStateManager
 * which keeps an in-memory array per directive instance.
 */
export interface ArrowStateManager<T = unknown> {
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
 * Injection token for the ArrowStateManager.
 * No root factory is registered — the directive creates a DefaultArrowStateManager
 * per-instance when no provider is found.
 */
export const ARROW_STATE_MANAGER = new InjectionToken<ArrowStateManager>('ARROW_STATE_MANAGER');
