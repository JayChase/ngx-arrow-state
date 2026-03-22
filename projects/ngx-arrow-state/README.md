# ngx-arrow-state

An Angular library that provides AI chat style input history navigation using arrow keys, plus Ctrl+Enter form submission for textareas.

Improve UX for chat interfaces, command-line style inputs, and AI prompt interfaces by letting users:

- ⬆️ **Arrow Up** - Navigate to previous input values
- ⬇️ **Arrow Down** - Navigate to next input values
- ⌨️ **Ctrl+Enter** - Submit forms from textareas (since Enter creates newlines)

## TL;DR

Go straight to the demo on [StackBlitz](https://stackblitz.com/edit/ngx-arrow-state-demo?file=src%2Fapp%2Fapp.html)

## Features

- Works with both `<input type="text">` and `<textarea>` elements
- Smart cursor detection for textareas (only navigates history when cursor is at start/end)
- Circular history navigation
- Pluggable state management via IoC — use the built-in in-memory store, or bring your own (e.g. `@ngneat/elf`)
- Standalone directives (no module required)
- Fully tested
- Lightweight with no dependencies

## Install

```bash
npm i -S ngx-arrow-state
```

## Compatibility

| Angular Version | Package Version |
| --------------- | --------------- |
| 21.x            | ^1.0.0          |

## Usage

### ArrowState Directive

Add the `ngxArrowState` directive to any text input or textarea within a reactive form to enable arrow key history navigation.

```typescript
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ArrowState } from 'ngx-arrow-state';

@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule, ArrowState],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="send()">
      <input type="text" formControlName="message" ngxArrowState placeholder="Type a message..." />
      <button type="submit">Send</button>
    </form>
  `,
})
export class ChatComponent {
  formGroup = new FormGroup({
    message: new FormControl<string | null>(null),
  });

  send() {
    console.log(this.formGroup.value);
    this.formGroup.reset();
  }
}
```

#### How it works

1. When the form is submitted, the current input value is saved to history
2. Press **Arrow Up** (when cursor is at the start) to cycle backwards through history
3. Press **Arrow Down** (when cursor is at the end) to cycle forwards through history

#### Textarea behavior

For `<textarea>` elements, the directive intelligently detects cursor position:

- **Arrow Up** only navigates history when the cursor is at position 0 (start of text)
- **Arrow Down** only navigates history when the cursor is at the end of the text
- Normal arrow key behavior is preserved when the cursor is in the middle of the text

This allows users to navigate multi-line text normally while still accessing history at the boundaries.

### SubmitOnCtrlEnter Directive

Add the `ngxSubmitOnCtrlEnter` directive to enable form submission with Ctrl+Enter. This is especially useful for textareas where Enter creates a new line.

```typescript
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ArrowState, SubmitOnCtrlEnter } from 'ngx-arrow-state';

@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule, ArrowState, SubmitOnCtrlEnter],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="send()">
      <textarea
        formControlName="message"
        ngxArrowState
        ngxSubmitOnCtrlEnter
        placeholder="Type a message... (Ctrl+Enter to send)"
      ></textarea>
      <button type="submit">Send</button>
    </form>
  `,
})
export class ChatComponent {
  formGroup = new FormGroup({
    message: new FormControl<string | null>(null),
  });

  send() {
    console.log(this.formGroup.value);
    this.formGroup.reset();
  }
}
```

### Using both directives together

For the best chat/prompt experience, use both directives together:

```html
<textarea
  formControlName="prompt"
  ngxArrowState
  ngxSubmitOnCtrlEnter
  placeholder="Enter your prompt..."
></textarea>
```

## State Management

By default the directive creates a **`DefaultArrowStateManager` per directive instance** — a simple in-memory array. History is lost on page reload.

For persistence or integration with an existing state library, provide your own manager via the `ARROW_STATE_MANAGER_FACTORY` token **at component level**.

### How it works

The directive resolves its state manager using this fallback chain:

1. **`ARROW_STATE_MANAGER`** — legacy token; if a pre-built instance is provided it is used as-is (backwards compat).
2. **`ARROW_STATE_MANAGER_FACTORY`** — the factory is called once per directive instance to produce a **fresh, isolated manager**. `init?(storageKey)` is then called in `ngOnInit` so the manager can lazily create its named backing store.
3. **`new DefaultArrowStateManager()`** — used automatically when neither token is provided.

### ArrowStateManager interface

```typescript
export interface ArrowStateManager<T = unknown> {
  /**
   * Optionally called by the directive in ngOnInit with a storage key derived
   * from the form-control name. Use this to lazily create the backing store
   * so every directive instance gets fully isolated, named storage.
   * Not required for in-memory managers that are already isolated per instance.
   */
  init?(storageKey: string): void;

  /** Add a value (called on init and on every form submit). */
  add(value: T): void;

  /** Rotate backwards and return the previous entry (Arrow Up). */
  previous(): T | undefined;

  /** Rotate forwards and return the next entry (Arrow Down). */
  next(): T | undefined;

  /** Optional — expose history entries for display in the template. */
  readonly history?: readonly T[];

  /** Optional cleanup — called when the directive is destroyed. */
  destroy?(): void;
}
```

### Default in-memory state (DefaultArrowStateManager)

Used automatically when no provider is configured. Each directive instance gets its own isolated history.

```typescript
// No configuration needed — this is the default behaviour.
// History lives in memory and is cleared on page reload.
```

You can read `stateManager.history` directly from the template via the exported directive reference:

```html
<input type="text" formControlName="message" ngxArrowState #messageState="ngxArrowState" />

@for (item of messageState.stateManager.history; track $index) {
<div>{{ item }}</div>
}
```

### Custom state manager example — @ngneat/elf with localStorage persistence

Install the elf packages:

```bash
npm i -S @ngneat/elf @ngneat/elf-persist-state
```

Create the manager as a plain class (no `@Injectable` needed):

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

  /**
   * Called by the directive in ngOnInit.
   * Lazily creates a named Elf store + localStorage persistence
   * under `arrow-state:<controlName>` so every control is isolated.
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

Provide it via `ARROW_STATE_MANAGER_FACTORY` at **component level** — not in `app.config.ts`. The factory is called once per directive instance, so every control gets its own isolated store:

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

No changes are needed in the template — the `ngxArrowState` directive resolves the token automatically.

### Custom state manager example — @ngrx/signals with localStorage persistence

Install `@ngrx/signals`:

```bash
npm i -S @ngrx/signals
```

Create the manager:

```typescript
import { effect, Injectable } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { ArrowStateManager } from 'ngx-arrow-state';

@Injectable()
export class NgrxArrowStateManager implements ArrowStateManager<string> {
  private storageKey!: string;

  private readonly state = signalState<{ history: string[] }>({ history: [] });

  constructor() {
    // Effect runs in the directive's injection context — auto-cleaned on destroy.
    // Guards on storageKey being set by init().
    effect(() => {
      if (!this.storageKey) return;
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.history()));
    });
  }

  /**
   * Called by the directive in ngOnInit.
   * Sets a per-control storage key and hydrates history from localStorage.
   */
  init(storageKey: string): void {
    this.storageKey = `ngrx-arrow-state:${controlName}`;
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

Provide it via `ARROW_STATE_MANAGER_FACTORY` at **component level**:

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

No changes are needed in the template — the directive picks up the provider automatically.

## API Reference

### ArrowState

| Selector | `input[type="text"][ngxArrowState], textarea[ngxArrowState]` |
| -------- | ------------------------------------------------------------ |
| Export   | `ngxArrowState`                                              |

| Property       | Type                   | Description                                    |
| -------------- | ---------------------- | ---------------------------------------------- |
| `stateManager` | `ArrowStateManager<T>` | The active state manager (injected or default) |

### SubmitOnCtrlEnter

| Selector | `[ngxSubmitOnCtrlEnter]` |
| -------- | ------------------------ |

Triggers form submission when Ctrl+Enter is pressed. Works on any element within a reactive form.

### DefaultArrowStateManager

In-memory implementation used automatically when neither `ARROW_STATE_MANAGER` nor `ARROW_STATE_MANAGER_FACTORY` is provided. One instance is created per directive instance.

| Member       | Description                               |
| ------------ | ----------------------------------------- |
| `history`    | `readonly T[]` — the current entry array  |
| `add()`      | Appends a value                           |
| `previous()` | Rotates backwards, returns last entry     |
| `next()`     | Rotates forwards, returns first entry     |
| `init()`     | No-op — isolation is already per-instance |

### ARROW_STATE_MANAGER_FACTORY

`InjectionToken<() => ArrowStateManager>` — provide a **factory function** at component level. The directive calls the factory once per instance so every control gets its own isolated manager, then calls `manager.init?(storageKey)` in `ngOnInit`.

```typescript
@Component({
  providers: [{
    provide: ARROW_STATE_MANAGER_FACTORY,
    useValue: () => new MyArrowStateManager(),
  }],
})
```

### ARROW_STATE_MANAGER

`InjectionToken<ArrowStateManager>` — legacy token kept for backwards compatibility. If provided, the directive uses the instance directly and skips the factory. Prefer `ARROW_STATE_MANAGER_FACTORY` for new code.

## Requirements

- Angular 21+
- `@angular/forms` (ReactiveFormsModule)

## Development

To clone this repo and run it locally:

```bash
git clone https://github.com/JayChase/ngx-arrow-state.git
cd ngx-arrow-state
npm install
npm run build
```

### Demos

```bash
# Default in-memory state manager
ng serve demo

# @ngneat/elf state manager with localStorage persistence
ng serve elf-demo

# @ngrx/signals state manager with localStorage persistence
ng serve ngrx-signal-store-demo
```

### Run tests

```bash
npm test
```

## License

MIT
