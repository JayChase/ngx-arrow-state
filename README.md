# ngx-arrow-state

An Angular library that provides terminal/shell-like input history navigation using arrow keys, plus Ctrl+Enter form submission for textareas.

Improve UX for chat interfaces, command-line style inputs, and AI prompt interfaces by letting users:

- ⬆️ **Arrow Up** - Navigate to previous input values
- ⬇️ **Arrow Down** - Navigate to next input values
- ⌨️ **Ctrl+Enter** - Submit forms from textareas (since Enter creates newlines)

## Features

- Works with both `<input type="text">` and `<textarea>` elements
- Smart cursor detection for textareas (only navigates history when cursor is at start/end)
- Circular history navigation
- Standalone directives (no module required)
- Fully tested
- Lightweight with no dependencies

## Install

```bash
npm install ngx-arrow-state
```

## Compatibility

| Angular Version | Package Version |
| --------------- | --------------- |
| 21.x            | 0.0.x           |

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

Add the `ngxSubmitOnCtrlEnter` directive to enable form submission with Ctrl+Enter. This is especially useful for textarea inputs where Enter creates a new line.

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

## API Reference

### ArrowState

| Selector | `input[type="text"][ngxArrowState], textarea[ngxArrowState]` |
| -------- | ------------------------------------------------------------ |

The directive automatically:

- Captures values on form submission
- Provides circular navigation through history
- Respects cursor position in textareas

### SubmitOnCtrlEnter

| Selector | `[ngxSubmitOnCtrlEnter]` |
| -------- | ------------------------ |

Triggers form submission when Ctrl+Enter is pressed. Works on any element within a reactive form.

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

### Demo

```bash
ng serve demo
```

### Run tests

```bash
npm test
```

## License

MIT
