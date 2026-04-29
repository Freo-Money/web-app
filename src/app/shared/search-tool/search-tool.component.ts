/** Angular Imports */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SearchDialogComponent } from './search-dialog/search-dialog.component';
import { DEFAULT_SEARCH_RESOURCE, SEARCH_RESOURCE_OPTIONS } from './search-tool.constants';

/**
 * Search Tool Component
 */
@Component({
  selector: 'mifosx-search-tool',
  templateUrl: './search-tool.component.html',
  styleUrls: ['./search-tool.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatIconButton,
    FaIconComponent,
    MatTooltip,
    ReactiveFormsModule
  ]
})
export class SearchToolComponent {
  /** Query Form Control */
  query = new UntypedFormControl('');
  /** Resource Form Control */
  resource = new UntypedFormControl('');

  /** Resource Options */
  resourceOptions = SEARCH_RESOURCE_OPTIONS;

  /**
   * @param {Router} router Router
   * @param {MatDialog} dialog Material Dialog
   */
  constructor(
    private router: Router,
    private dialog: MatDialog
  ) {
    this.resource.patchValue(DEFAULT_SEARCH_RESOURCE);
  }

  /**
   * Opens search dialog in a modal popup
   */
  openSearchDialog(event?: MouseEvent) {
    const viewportWidth = window.innerWidth;
    const dialogWidth = Math.min(600, Math.floor(viewportWidth * 0.95));

    let position: { top: string; left?: string; right?: string } = { top: '72px', right: '16px' };

    if (event?.currentTarget instanceof HTMLElement) {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const top = Math.max(16, Math.round(buttonRect.bottom + 8));
      const maxLeft = Math.max(12, viewportWidth - dialogWidth - 12);
      const rightShiftPx = 20;
      const left = Math.min(Math.max(12, Math.round(buttonRect.right - dialogWidth + rightShiftPx)), maxLeft);
      position = { top: `${top}px`, left: `${left}px` };
    }

    const dialogRef = this.dialog.open(SearchDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'search-dialog-panel',
      backdropClass: 'search-dialog-backdrop',
      position,
      data: {
        query: this.query.value,
        resource: this.resource.value,
        resourceOptions: this.resourceOptions
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.query.patchValue(result.query || '');
        this.resource.patchValue(result.resource || this.resource.value);
        this.search(result);
      }
    });
  }

  /**
   * Searches server for query and resource.
   */
  search(params?: any) {
    const queryParams: any = {
      query: params?.query ?? this.query.value,
      resource: params?.resource ?? this.resource.value
    };
    this.router.navigate(['/search'], { queryParams: queryParams });
  }
}
