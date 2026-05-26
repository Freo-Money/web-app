/** Angular Imports */
import { Component, Inject, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { MatButton, MatIconButton } from '@angular/material/button';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { DEFAULT_SEARCH_RESOURCE, SEARCH_RESOURCE_OPTIONS } from '../search-tool.constants';

/**
 * Search Dialog Component
 */
@Component({
  selector: 'mifosx-search-dialog',
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatIconButton
  ]
})
export class SearchDialogComponent implements AfterViewInit {
  /** Query Form Control */
  query = new UntypedFormControl('');
  /** Resource Form Control */
  resource = new UntypedFormControl('');

  /** Resource Options */
  resourceOptions = SEARCH_RESOURCE_OPTIONS;

  /** Reference to search input */
  @ViewChild('searchInput', { read: ElementRef }) searchInput: ElementRef;

  /**
   * @param {MatDialogRef} dialogRef Dialog Reference
   * @param {any} data Dialog data
   */
  constructor(
    public dialogRef: MatDialogRef<SearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (Array.isArray(data?.resourceOptions) && data.resourceOptions.length) {
      this.resourceOptions = data.resourceOptions;
    }
    this.resource.patchValue(DEFAULT_SEARCH_RESOURCE);
    if (data?.query) {
      this.query.patchValue(data.query);
    }
    if (data?.resource) {
      this.resource.patchValue(data.resource);
    }
  }

  /**
   * Focus on search input after view initialization
   */
  ngAfterViewInit(): void {
    // Use a longer timeout to wait for dialog animation to complete
    setTimeout(() => {
      if (this.searchInput && this.searchInput.nativeElement) {
        this.searchInput.nativeElement.focus();
        this.searchInput.nativeElement.select();
      }
    }, 300);
  }

  /**
   * Closes dialog and returns search parameters
   */
  search() {
    this.dialogRef.close({
      query: this.query.value,
      resource: this.resource.value
    });
  }

  /**
   * Closes the dialog without searching
   */
  closeDialog() {
    this.dialogRef.close();
  }
}
