# ngrx-signal-store-demo

A demo application for [ngx-arrow-state](../../README.md) showing how to replace the default in-memory state manager with a custom `@ngrx/signals` implementation that **persists history to `localStorage`**.

## What this demo shows

- `ngxArrowState` and `ngxSubmitOnCtrlEnter` directives on a `<textarea>`
- History that survives page reloads via `@ngrx/signals` `signalState` + Angular `effect()`
- How to implement and provide a custom `ArrowStateManager`

## Run the demo

From the workspace root:

```bash
ng serve ngrx-signal-store-demo
```

## How it works

### NgrxArrowStateManager

[src/app/ngrx-arrow-state.manager.ts](src/app/ngrx-arrow-state.manager.ts) implements the `ArrowStateManager<string>` interface using `signalState` from `@ngrx/signals`:

```typescript
import { effect, Injectable } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { ArrowStateManager } from 'ngx-arrow-state';

const STORAGE_KEY = 'ngrx-arrow-state-history';

@Injectable()
export class NgrxArrowStateManager implements ArrowStateManager<string> {
  private readonly state = signalState<{ history: string[] }>({
    history: this.loadFromStorage(),
  });

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.history()));
    });
  }

  get history(): readonly string[] {
    return this.state.history();
  }

  add(value: string): void {
    if (!value) return;
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
      /* ignore malformed storage */
    }
    return [];
  }
}
```

Key points:

- **`signalState`** creates a fine-grained reactive state object — `this.state.history()` is a `Signal<string[]>`
- **`patchState`** applies immutable updates, triggering any downstream signals or effects
- **`effect()`** runs in the constructor's injection context and re-executes automatically whenever `this.state.history()` changes, persisting the new value to `localStorage`
- **`loadFromStorage()`** initialises the state from `localStorage` so history survives page reloads
- **`@Injectable()`** (without `providedIn`) keeps instantiation explicitly under app control

### Providing the manager

[src/app/app.config.ts](src/app/app.config.ts) registers the manager via the `ARROW_STATE_MANAGER` injection token using `useExisting` to avoid double-instantiation:

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ARROW_STATE_MANAGER } from 'ngx-arrow-state';
import { NgrxArrowStateManager } from './ngrx-arrow-state.manager';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    NgrxArrowStateManager,
    { provide: ARROW_STATE_MANAGER, useExisting: NgrxArrowStateManager },
  ],
};
```

`useExisting` ensures that the single `NgrxArrowStateManager` instance is shared between both direct injection and `ARROW_STATE_MANAGER` token resolution — so the `effect()` only runs once.

No changes are needed in the template — the `ngxArrowState` directive resolves the token automatically via Angular's DI.

### Displaying history

The template exports the directive reference to render the live history list:

```html
<textarea
  formControlName="message"
  ngxArrowState
  #controlState="ngxArrowState"
  ngxSubmitOnCtrlEnter
></textarea>

@for (item of controlState.stateManager.history; track $index) {
<mat-list-item>{{ item }}</mat-list-item>
}
```

## Comparison with other demos

| Feature              | `demo`                     | `elf-demo`                                 | `ngrx-signal-store-demo`                |
| -------------------- | -------------------------- | ------------------------------------------ | --------------------------------------- |
| State manager        | `DefaultArrowStateManager` | `ElfArrowStateManager`                     | `NgrxArrowStateManager`                 |
| Storage              | In-memory (per instance)   | `localStorage` via elf                     | `localStorage` via `effect()`           |
| Survives page reload | ❌                         | ✅                                         | ✅                                      |
| Reactive primitives  | Plain array                | elf observable store                       | NgRx `signalState` + Angular `effect()` |
| Extra dependencies   | None                       | `@ngneat/elf`, `@ngneat/elf-persist-state` | `@ngrx/signals`                         |
