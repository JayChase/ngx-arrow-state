import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ArrowState, SubmitOnCtrlEnter } from 'ngx-arrow-state';

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
    SubmitOnCtrlEnter,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private matSnackBar = inject(MatSnackBar);

  formGroup = new FormGroup({
    name: new FormControl<string | null>(null, {
      validators: [],
    }),
    description: new FormControl<string | null>(null, {
      validators: [],
    }),
  });

  go() {
    this.formGroup.setValue({ name: null, description: null });
    this.formGroup.markAsPristine();
    this.formGroup.markAsUntouched();
    this.matSnackBar.open('form submitted and reset ', undefined, { duration: 3000 });
  }
}
