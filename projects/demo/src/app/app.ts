import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
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
    MatListModule,
    SubmitOnCtrlEnter,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss',
})
export class App {
  private matSnackBar = inject(MatSnackBar);

  formGroup = new FormGroup({
    message: new FormControl<string | null>(null, {
      validators: [],
    }),
  });

  go() {
    this.formGroup.setValue({ message: null });
    this.formGroup.markAsPristine();
    this.formGroup.markAsUntouched();
    this.matSnackBar.open('form submitted and reset ', undefined, { duration: 3000 });
  }
}
