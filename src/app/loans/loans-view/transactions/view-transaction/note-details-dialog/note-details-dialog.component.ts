import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-note-details-dialog',
  templateUrl: './note-details-dialog.component.html',
  styleUrls: ['./note-details-dialog.component.scss'],
  imports: [...STANDALONE_SHARED_IMPORTS]
})
export class NoteDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NoteDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
