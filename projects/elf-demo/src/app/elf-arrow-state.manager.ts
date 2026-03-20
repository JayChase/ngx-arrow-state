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

  ngOnDestroy(): void {
    this.persistence.unsubscribe();
    this.store.destroy();
  }
}
