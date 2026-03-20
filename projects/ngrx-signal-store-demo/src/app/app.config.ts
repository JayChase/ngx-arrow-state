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
