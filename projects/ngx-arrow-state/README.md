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

By default the directive keeps an **in-memory array per directive instance** (`DefaultArrowStateManager`). History is lost on page reload.

For more advanced scenarios you can provide your own state manager via the `ARROW_STATE_MANAGER` injection token.

### ArrowStateManager interface

```typescript
export interface ArrowStateManager<T = unknown> {
  /** Called on init (initial value) and on every form submit. */
  add(value: T): void;

  /** Rotate backwards and return the previous entry (Arrow Up). */
  previous(): T | undefined;

  /** Rotate forwards and return the next entry (Arrow Down). */
  next(): T | undefined;

  /** Optional — expose history entries for display in the template. */
  readonly history?: readonly T[];
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
<textarea formControlName="message" ngxArrowState #controlState="ngxArrowState"></textarea>

@for (item of controlState.stateManager.history; track $index) {
<div>{{ item }}</div>
}
```

### Custom state manager example — @ngneat/elf with localStorage persistence

Install the elf packages:

```bash
npm i -S @ngneat/elf @ngneat/elf-persist-state
```

Create the manager:

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

Provide it in `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { ARROW_STATE_MANAGER } from 'ngx-arrow-state';
import { ElfArrowStateManager } from './elf-arrow-state.manager';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: ARROW_STATE_MANAGER, useClass: ElfArrowStateManager }],
};
```

No changes are needed to the template — the directive picks up the provider automatically.

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

const STORAGE_KEY = 'ngrx-arrow-state-history';

@Injectable()
export class NgrxArrowStateManager implements ArrowStateManager<string> {
  private readonly state = signalState<{ history: string[] }>({
    history: this.loadFromStorage(),
  });

  constructor() {
    // Automatically persists to localStorage whenever the history signal changes
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

Provide it in `app.config.ts` using `useExisting` so the single instance is shared between direct injection and the token — preventing a duplicate `effect()` from running:

```typescript
import { ApplicationConfig } from '@angular/core';
import { ARROW_STATE_MANAGER } from 'ngx-arrow-state';
import { NgrxArrowStateManager } from './ngrx-arrow-state.manager';

export const appConfig: ApplicationConfig = {
  providers: [
    NgrxArrowStateManager,
    { provide: ARROW_STATE_MANAGER, useExisting: NgrxArrowStateManager },
  ],
};
```

No changes are needed to the template — the directive picks up the provider automatically.

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

In-memory implementation used automatically when no `ARROW_STATE_MANAGER` provider is configured.

| Member       | Description                              |
| ------------ | ---------------------------------------- |
| `history`    | `readonly T[]` — the current entry array |
| `add()`      | Appends a value                          |
| `previous()` | Rotates backwards, returns last entry    |
| `next()`     | Rotates forwards, returns first entry    |

### ARROW_STATE_MANAGER

An `InjectionToken<ArrowStateManager>` with no root factory. Provide your own implementation at the application, component, or directive injector level.

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
