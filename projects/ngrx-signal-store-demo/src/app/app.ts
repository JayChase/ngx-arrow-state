import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ARROW_STATE_MANAGER_FACTORY, ArrowState, SubmitOnCtrlEnter } from 'ngx-arrow-state';
import { NgrxArrowStateManager } from './ngrx-arrow-state.manager';

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    ArrowState,
    MatListModule,
    SubmitOnCtrlEnter,
  ],
  // Factory provided at component level.
  // ArrowState calls factory() in its field initialiser (injection context) to
  // get a fresh NgrxArrowStateManager per directive, then calls init(controlName)
  // in ngOnInit so each manager lazily creates its named signalState + storage key.
  providers: [
    {
      provide: ARROW_STATE_MANAGER_FACTORY,
      useValue: () => new NgrxArrowStateManager(),
    },
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private matSnackBar = inject(MatSnackBar);

  formGroup = new FormGroup({
    subject: new FormControl<string | null>(null),
    message: new FormControl<string | null>(null),
  });

  go() {
    this.formGroup.setValue({ subject: null, message: null });
    this.formGroup.markAsPristine();
    this.formGroup.markAsUntouched();
    this.matSnackBar.open('form submitted and reset ', undefined, { duration: 3000 });
  }
}
