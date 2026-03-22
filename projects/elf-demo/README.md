# elf-demo

A demo application for [ngx-arrow-state](../../README.md) showing how to replace the default in-memory state manager with a custom `@ngneat/elf` implementation that **persists history to `localStorage`**, with **fully isolated per-control stores**.

## What this demo shows

- `ngxArrowState` and `ngxSubmitOnCtrlEnter` directives on multiple controls
- Each control has its own independently persisted history (survives page reloads)
- How to implement and provide a custom `ArrowStateManager` using the factory pattern
- Multiple controls in the same form without any state clashing

## Run the demo

From the workspace root:

```bash
ng serve elf-demo
```

## How it works

### ElfArrowStateManager

[src/app/elf-arrow-state.manager.ts](src/app/elf-arrow-state.manager.ts) implements `ArrowStateManager<string>`. It is a plain class (no `@Injectable`) — it is instantiated by the factory, not Angular's DI:

```typescript
import { createStore, setProp, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { ArrowStateManager } from 'ngx-arrow-state';

interface ArrowStateProps {
  history: string[];
}

export class ElfArrowStateManager implements ArrowStateManager<string> {
  private store!: ReturnType<typeof createStore>;
  private persistence!: ReturnType<typeof persistState>;

  init(controlName: string): void {
    this.store = createStore(
      { name: `arrow-state:${controlName}` },
      withProps<ArrowStateProps>({ history: [] }),
    );
    this.persistence = persistState(this.store, {
      key: `arrow-state:${controlName}`,
      storage: localStorageStrategy,
    });
  }

  get history(): readonly string[] {
    return this.store?.getValue().history ?? [];
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

  destroy(): void {
    this.persistence?.unsubscribe();
    this.store?.destroy();
  }
}
```

Key points:

- **No `@Injectable`** — it is a plain class instantiated by the factory function, not Angular's injector
- **`init(controlName)`** is called by the directive in `ngOnInit`. It lazily creates a named Elf store and wires up `persistState` under `arrow-state:<controlName>` — so `subject` and `message` controls each get their own independent store and `localStorage` key
- **`previous()` / `next()`** operate on a shallow copy to preserve Elf's immutability guarantee
- **`destroy()`** is called by the directive's `ngOnDestroy` to unsubscribe persistence and destroy the store

### Providing the manager

`ARROW_STATE_MANAGER_FACTORY` is provided at **component level** in [src/app/app.ts](src/app/app.ts) — not in `app.config.ts`. The directive calls the factory once per instance, so every `ngxArrowState` control gets its own fresh `ElfArrowStateManager`:

```typescript
import { Component } from '@angular/core';
import { ARROW_STATE_MANAGER_FACTORY } from 'ngx-arrow-state';
import { ElfArrowStateManager } from './elf-arrow-state.manager';

@Component({
  providers: [
    {
      provide: ARROW_STATE_MANAGER_FACTORY,
      useValue: () => new ElfArrowStateManager(),
    },
  ],
})
export class AppComponent {}
```

No changes are needed in the template — the `ngxArrowState` directive resolves the token automatically via Angular's DI.

### Displaying history

The template exports each directive reference to render a live history list per control:

```html
<input type="text" formControlName="subject" ngxArrowState #subjectState="ngxArrowState" />
<input type="text" formControlName="message" ngxArrowState #messageState="ngxArrowState" />

@for (item of subjectState.stateManager.history; track $index) {
<mat-list-item>{{ item }}</mat-list-item>
} @for (item of messageState.stateManager.history; track $index) {
<mat-list-item>{{ item }}</mat-list-item>
}
```

## Comparison with other demos

| Feature              | `demo`                     | `elf-demo`                                 | `ngrx-signal-store-demo`      |
| -------------------- | -------------------------- | ------------------------------------------ | ----------------------------- |
| State manager        | `DefaultArrowStateManager` | `ElfArrowStateManager`                     | `NgrxArrowStateManager`       |
| Storage              | In-memory (per instance)   | `localStorage` via elf                     | `localStorage` via `effect()` |
| Survives page reload | ❌                         | ✅                                         | ✅                            |
| Isolated per control | ✅                         | ✅                                         | ✅                            |
| Extra dependencies   | None                       | `@ngneat/elf`, `@ngneat/elf-persist-state` | `@ngrx/signals`               |
