import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ARROW_STATE_MANAGER } from 'ngx-arrow-state';
import { ElfArrowStateManager } from './elf-arrow-state.manager';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ARROW_STATE_MANAGER, useClass: ElfArrowStateManager },
  ],
};
