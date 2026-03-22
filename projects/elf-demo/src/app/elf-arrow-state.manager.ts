import { createStore, setProp, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { ArrowStateManager } from 'ngx-arrow-state';

interface ArrowStateProps {
  history: string[];
}

/**
 * Elf-backed {@link ArrowStateManager}.
 *
 * Provided at **component level** via `ARROW_STATE_MANAGER_FACTORY` so the
 * directive creates a **new instance per control**.  `init(storageKey)` lazily
 * creates a named Elf store + localStorage persistence so each control has
 * fully isolated, independently persisted history.
 *
 * `destroy()` is called automatically by the directive's `ngOnDestroy` to
 * unsubscribe persistence and destroy the store.
 *
 * ```ts
 * @Component({
 *   providers: [{
 *     provide: ARROW_STATE_MANAGER_FACTORY,
 *     useValue: () => new ElfArrowStateManager(),
 *   }],
 * })
 * ```
 */
export class ElfArrowStateManager implements ArrowStateManager<string> {
  private store!: ReturnType<typeof createStore>;
  private persistence!: ReturnType<typeof persistState>;

  /**
   * Called by the directive in ngOnInit.  Lazily creates a named Elf store
   * and wires up localStorage persistence under `arrow-state:<storageKey>`.
   */
  init(storageKey: string): void {
    this.store = createStore(
      { name: `arrow-state:${storageKey}` },
      withProps<ArrowStateProps>({ history: [] }),
    );
    this.persistence = persistState(this.store, {
      key: `arrow-state:${storageKey}`,
      storage: localStorageStrategy,
    });
  }

  get history(): readonly string[] {
    return this.store?.getValue().history ?? [];
  }

  add(value: string): void {
    if (value === null || value === undefined || value === '') return;
    this.store.update(setProp('history', [...this.store.getValue().history, value]));
  }

  previous(): string | undefined {
    const h = [...this.store.getValue().history];
    const last = h.pop();
    if (last !== undefined) h.unshift(last);
    this.store.update(setProp('history', h));
    return last;
  }

  next(): string | undefined {
    const h = [...this.store.getValue().history];
    const first = h.shift();
    if (first !== undefined) h.push(first);
    this.store.update(setProp('history', h));
    return first;
  }

  destroy(): void {
    this.persistence?.unsubscribe();
    this.store?.destroy();
  }
}
