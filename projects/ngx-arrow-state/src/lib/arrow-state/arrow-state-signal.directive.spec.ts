import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArrowStateSignal } from './arrow-state-signal.directive';
import {
  ARROW_STATE_MANAGER,
  ARROW_STATE_MANAGER_FACTORY,
  ArrowStateManager,
  DefaultArrowStateManager,
} from './arrow-state-manager';

// ---------------------------------------------------------------------------
// Test host components
// ---------------------------------------------------------------------------

@Component({
  template: `
    <form (submit)="onSubmit()">
      <textarea
        ngxArrowStateSignal
        storageKey="test-key"
        (historyChange)="onHistoryChange($event)"
      ></textarea>
    </form>
  `,
  imports: [ArrowStateSignal],
})
class TestTextareaComponent {
  historyValues: string[] = [];
  submitCount = 0;

  onHistoryChange(value: string) {
    this.historyValues.push(value);
  }

  onSubmit() {
    this.submitCount++;
  }
}

@Component({
  template: `
    <form (submit)="onSubmit()">
      <input
        type="text"
        ngxArrowStateSignal
        storageKey="test-input-key"
        (historyChange)="onHistoryChange($event)"
      />
    </form>
  `,
  imports: [ArrowStateSignal],
})
class TestInputComponent {
  historyValues: string[] = [];
  submitCount = 0;

  onHistoryChange(value: string) {
    this.historyValues.push(value);
  }

  onSubmit() {
    this.submitCount++;
  }
}

// ---------------------------------------------------------------------------
// Spy state manager
// ---------------------------------------------------------------------------

class SpyArrowStateManager<T = unknown> implements ArrowStateManager<T> {
  private _history: T[] = [];

  initSpy = vi.fn((key: string) => {});
  addSpy = vi.fn((value: T) => this._history.push(value));
  previousSpy = vi.fn(() => {
    const last = this._history.pop();
    if (last !== undefined) this._history.unshift(last);
    return last;
  });
  nextSpy = vi.fn(() => {
    const first = this._history.shift();
    if (first !== undefined) this._history.push(first);
    return first;
  });
  destroySpy = vi.fn();

  init(key: string) {
    this.initSpy(key);
  }
  add(value: T) {
    this.addSpy(value);
  }
  previous() {
    return this.previousSpy();
  }
  next() {
    return this.nextSpy();
  }
  destroy() {
    this.destroySpy();
  }
  get history() {
    return this._history;
  }
}

// ---------------------------------------------------------------------------
// Tests — textarea
// ---------------------------------------------------------------------------

describe('ArrowStateSignal — textarea', () => {
  let fixture: ComponentFixture<TestTextareaComponent>;
  let component: TestTextareaComponent;
  let textareaEl: HTMLTextAreaElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTextareaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    textareaEl = fixture.nativeElement.querySelector('textarea');
  });

  it('should create the directive', () => {
    expect(textareaEl).toBeTruthy();
  });

  it('should emit previous value via historyChange on Arrow Up when cursor is at start', () => {
    // Simulate two form submits to build history
    textareaEl.value = 'first';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    textareaEl.value = 'second';
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Position cursor at start
    textareaEl.value = 'second';
    textareaEl.setSelectionRange(0, 0);

    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();

    expect(component.historyValues.length).toBeGreaterThan(0);
    expect(['first', 'second']).toContain(component.historyValues[0]);
  });

  it('should emit next value via historyChange on Arrow Down when cursor is at end', () => {
    textareaEl.value = 'first';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    textareaEl.value = 'second';
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Position cursor at end
    textareaEl.value = 'second';
    const len = textareaEl.value.length;
    textareaEl.setSelectionRange(len, len);

    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    expect(component.historyValues.length).toBeGreaterThan(0);
    expect(['first', 'second']).toContain(component.historyValues[0]);
  });

  it('should NOT emit on Arrow Up when cursor is in middle of text', () => {
    textareaEl.value = 'first';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    textareaEl.value = 'hello world';
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Position cursor in middle
    textareaEl.value = 'hello world';
    textareaEl.setSelectionRange(5, 5);

    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();

    expect(component.historyValues.length).toBe(0);
  });

  it('should NOT emit on Arrow Down when cursor is in middle of text', () => {
    textareaEl.value = 'first';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    textareaEl.value = 'hello world';
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Position cursor in middle
    textareaEl.value = 'hello world';
    textareaEl.setSelectionRange(5, 5);

    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    expect(component.historyValues.length).toBe(0);
  });

  it('should NOT emit when text is selected', () => {
    textareaEl.value = 'first';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    textareaEl.value = 'hello world';
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    textareaEl.value = 'hello world';
    textareaEl.setSelectionRange(0, 5);

    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();

    expect(component.historyValues.length).toBe(0);
  });

  it('should NOT emit when history has less than 2 items', () => {
    textareaEl.value = 'only entry';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    textareaEl.setSelectionRange(0, 0);

    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();

    expect(component.historyValues.length).toBe(0);
  });

  it('should record textarea value into history on native form submit', () => {
    textareaEl.value = 'submitted value';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Now add a second entry so we can navigate
    textareaEl.value = 'second value';
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Navigate up to get the first submitted value back
    textareaEl.value = 'second value';
    textareaEl.setSelectionRange(0, 0);
    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();

    expect(component.historyValues.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tests — input[type="text"]
// ---------------------------------------------------------------------------

describe('ArrowStateSignal — input', () => {
  let fixture: ComponentFixture<TestInputComponent>;
  let component: TestInputComponent;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should create the directive on input', () => {
    expect(inputEl).toBeTruthy();
  });

  it('should emit previous value on Arrow Up when cursor at start', () => {
    inputEl.value = 'first';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    inputEl.value = 'second';
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    inputEl.value = 'second';
    inputEl.setSelectionRange(0, 0);
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();

    expect(component.historyValues.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// IoC — custom state manager via ARROW_STATE_MANAGER
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-custom-manager-signal-test',
  template: `
    <form (submit)="onSubmit()">
      <textarea
        ngxArrowStateSignal
        storageKey="custom-key"
        (historyChange)="onHistoryChange($event)"
      ></textarea>
    </form>
  `,
  imports: [ArrowStateSignal],
})
class TestCustomManagerComponent {
  historyValues: string[] = [];

  onHistoryChange(value: string) {
    this.historyValues.push(value);
  }

  onSubmit() {}
}

describe('ArrowStateSignal — IoC', () => {
  let fixture: ComponentFixture<TestCustomManagerComponent>;
  let component: TestCustomManagerComponent;
  let textareaEl: HTMLTextAreaElement;
  let spyManager: SpyArrowStateManager;

  beforeEach(async () => {
    spyManager = new SpyArrowStateManager();

    await TestBed.configureTestingModule({
      imports: [TestCustomManagerComponent],
      providers: [{ provide: ARROW_STATE_MANAGER, useValue: spyManager }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestCustomManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    textareaEl = fixture.nativeElement.querySelector('textarea');
  });

  it('should call add() on the injected manager when the form is submitted', () => {
    textareaEl.value = 'hello';
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(spyManager.addSpy).toHaveBeenCalledWith('hello');
  });

  it('should call previous() on the injected manager on Arrow Up', () => {
    spyManager.add('first');
    spyManager.add('second');

    textareaEl.value = 'second';
    textareaEl.setSelectionRange(0, 0);
    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();

    expect(spyManager.previousSpy).toHaveBeenCalled();
  });

  it('should call next() on the injected manager on Arrow Down', () => {
    spyManager.add('first');
    spyManager.add('second');

    textareaEl.value = 'second';
    const len = textareaEl.value.length;
    textareaEl.setSelectionRange(len, len);
    textareaEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    expect(spyManager.nextSpy).toHaveBeenCalled();
  });

  it('should call stateManager.destroy() on ngOnDestroy', () => {
    fixture.destroy();
    expect(spyManager.destroySpy).toHaveBeenCalled();
  });

  it('should use DefaultArrowStateManager when no provider is configured', async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [TestCustomManagerComponent] })
      .compileComponents();

    const f = TestBed.createComponent(TestCustomManagerComponent);
    f.detectChanges();
    const directive = f.debugElement
      .query((el) => el.nativeElement.tagName === 'TEXTAREA')
      ?.injector.get(ArrowStateSignal);

    expect(directive?.stateManager).toBeInstanceOf(DefaultArrowStateManager);
  });
});

// ---------------------------------------------------------------------------
// IoC — ARROW_STATE_MANAGER_FACTORY
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-factory-signal-test',
  template: `
    <form>
      <textarea
        ngxArrowStateSignal
        storageKey="factory-key"
        (historyChange)="onHistoryChange($event)"
      ></textarea>
    </form>
  `,
  imports: [ArrowStateSignal],
})
class TestFactoryComponent {
  historyValues: string[] = [];

  onHistoryChange(value: string) {
    this.historyValues.push(value);
  }
}

describe('ArrowStateSignal — ARROW_STATE_MANAGER_FACTORY', () => {
  let spyManager: SpyArrowStateManager;

  beforeEach(async () => {
    spyManager = new SpyArrowStateManager();

    await TestBed.configureTestingModule({
      imports: [TestFactoryComponent],
      providers: [
        {
          provide: ARROW_STATE_MANAGER_FACTORY,
          useValue: () => spyManager,
        },
      ],
    }).compileComponents();
  });

  it('should call stateManager.init() with the storageKey on ngOnInit', () => {
    const fixture = TestBed.createComponent(TestFactoryComponent);
    fixture.detectChanges();

    expect(spyManager.initSpy).toHaveBeenCalledWith('factory-key');
  });

  it('should use the manager produced by the factory', () => {
    const fixture = TestBed.createComponent(TestFactoryComponent);
    fixture.detectChanges();

    const directive = fixture.debugElement
      .query((el) => el.nativeElement.tagName === 'TEXTAREA')
      ?.injector.get(ArrowStateSignal);

    expect(directive?.stateManager).toBe(spyManager);
  });
});
