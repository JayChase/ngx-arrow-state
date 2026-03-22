# ngrx-signal-store-demo

A demo application for [ngx-arrow-state](../../README.md) showing how to replace the default in-memory state manager with a custom `@ngrx/signals` implementation that **persists history to `localStorage`**, with **fully isolated per-control state**.

## What this demo shows

- `ngxArrowState` and `ngxSubmitOnCtrlEnter` directives on multiple controls
- Each control has its own independently persisted history (survives page reloads)
- How to implement and provide a custom `ArrowStateManager` using the factory pattern
- Multiple controls in the same form without any state clashing

## Run the demo

From the workspace root:

```bash
ng serve ngrx-signal-store-demo
```

## How it works

### NgrxArrowStateManager

[src/app/ngrx-arrow-state.manager.ts](src/app/ngrx-arrow-state.manager.ts) implements `ArrowStateManager<string>` using `signalState` from `@ngrx/signals`:

```typescript
import { effect, Injectable } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { ArrowStateManager } from 'ngx-arrow-state';

@Injectable()
export class NgrxArrowStateManager implements ArrowStateManager<string> {
  private storageKey!: string;

  private readonly state = signalState<{ history: string[] }>({ history: [] });

  constructor() {
    // Effect is tied to the directive's injection context — auto-cleaned on
    // directive destroy. Guards on storageKey being set by init().
    effect(() => {
      if (!this.storageKey) return;
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.history()));
    });
  }

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
      const raw = localStorage.getItem(this.storageKey);
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

- **`@Injectable()`** (without `providedIn`) — Angular manages the instance lifetime when the factory runs inside the directive's injection context
- **`init(storageKey)`** is called by the directive in `ngOnInit`. It sets a per-control `localStorage` key (`ngrx-arrow-state:<storageKey>`) and hydrates state from storage — so `subject` and `message` controls each have independent, isolated history
- **`signalState`** creates fine-grained reactive state — `this.state.history()` is a `Signal<string[]>`
- **`effect()`** runs in the directive's injection context and re-executes whenever `history` changes, persisting to `localStorage`. The `storageKey` guard prevents a write before `init()` is called
- **`patchState`** applies immutable updates

### Providing the manager

`ARROW_STATE_MANAGER_FACTORY` is provided at **component level** in [src/app/app.ts](src/app/app.ts) — not in `app.config.ts`. The directive calls the factory once per instance, so every `ngxArrowState` control gets its own fresh `NgrxArrowStateManager`:

```typescript
import { Component } from '@angular/core';
import { ARROW_STATE_MANAGER_FACTORY } from 'ngx-arrow-state';
import { NgrxArrowStateManager } from './ngrx-arrow-state.manager';

@Component({
  providers: [
    {
      provide: ARROW_STATE_MANAGER_FACTORY,
      useValue: () => new NgrxArrowStateManager(),
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

| Feature              | `demo`                     | `elf-demo`                                 | `ngrx-signal-store-demo`                |
| -------------------- | -------------------------- | ------------------------------------------ | --------------------------------------- |
| State manager        | `DefaultArrowStateManager` | `ElfArrowStateManager`                     | `NgrxArrowStateManager`                 |
| Storage              | In-memory (per instance)   | `localStorage` via elf                     | `localStorage` via `effect()`           |
| Survives page reload | ❌                         | ✅                                         | ✅                                      |
| Isolated per control | ✅                         | ✅                                         | ✅                                      |
| Reactive primitives  | Plain array                | elf observable store                       | NgRx `signalState` + Angular `effect()` |
| Extra dependencies   | None                       | `@ngneat/elf`, `@ngneat/elf-persist-state` | `@ngrx/signals`                         |
