# elf-demo

A demo application for [ngx-arrow-state](../../README.md) showing how to replace the default in-memory state manager with a custom `@ngneat/elf` implementation that **persists history to `localStorage`**.

## What this demo shows

- `ngxArrowState` and `ngxSubmitOnCtrlEnter` directives on a `<textarea>`
- History that survives page reloads via `@ngneat/elf` + `@ngneat/elf-persist-state`
- How to implement and provide a custom `ArrowStateManager`

## Run the demo

From the workspace root:

```bash
ng serve elf-demo
```

## How it works

### ElfArrowStateManager

[src/app/elf-arrow-state.manager.ts](src/app/elf-arrow-state.manager.ts) implements the `ArrowStateManager<string>` interface using an elf store:

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { createStore, setProp, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { ArrowStateManager } from 'ngx-arrow-state';

interface ArrowStateProps {
  history: string[];
}

@Injectable({ providedIn: 'root' })
export class ElfArrowStateManager implements ArrowStateManager<string>, OnDestroy {
  private readonly store = createStore(
    { name: 'arrow-state-history' },
    withProps<ArrowStateProps>({ history: [] }),
  );

  private readonly persistence = persistState(this.store, {
    key: 'arrow-state-history',
    storage: localStorageStrategy,
  });

  get history(): readonly string[] {
    return this.store.getValue().history;
  }

  add(value: string): void {
    if (!value) return;
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

  ngOnDestroy(): void {
    this.persistence.unsubscribe();
    this.store.destroy();
  }
}
```

Key points:

- **`add()`** guards against empty/null values (the form's initial `null` state before the user types anything)
- **`previous()` / `next()`** operate on a shallow copy of the array to keep elf's immutability guarantee, then write back via `setProp`
- **`persistState`** subscribes to store changes and syncs to `localStorage` automatically under the key `arrow-state-history`
- **`ngOnDestroy`** unsubscribes from persistence and destroys the store to avoid memory leaks

### Providing the manager

[src/app/app.config.ts](src/app/app.config.ts) registers the manager via the `ARROW_STATE_MANAGER` injection token:

```typescript
import { ApplicationConfig } from '@angular/core';
import { ARROW_STATE_MANAGER } from 'ngx-arrow-state';
import { ElfArrowStateManager } from './elf-arrow-state.manager';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: ARROW_STATE_MANAGER, useClass: ElfArrowStateManager }],
};
```

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

## Comparison with the default demo

| Feature              | `demo`                     | `elf-demo`                                 |
| -------------------- | -------------------------- | ------------------------------------------ |
| State manager        | `DefaultArrowStateManager` | `ElfArrowStateManager`                     |
| Storage              | In-memory (per instance)   | `localStorage` via elf                     |
| Survives page reload | ❌                         | ✅                                         |
| Extra dependencies   | None                       | `@ngneat/elf`, `@ngneat/elf-persist-state` |
