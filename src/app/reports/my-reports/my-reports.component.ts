/** Angular Imports */
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton } from '@angular/material/button';

/** Custom Services */
import { ReportsService } from '../reports.service';
import { AlertService } from 'app/core/alert/alert.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ErrorDialogComponent } from 'app/shared/error-dialog/error-dialog.component';

interface AsyncReport {
  id: number | string;
  reportName: string;
  status: string;
  message: string;
}

/**
 * My Reports component.
 */
@Component({
  selector: 'mifosx-my-reports',
  templateUrl: './my-reports.component.html',
  styleUrls: ['./my-reports.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    FaIconComponent,
    MatTooltip,
    MatIconButton
  ]
})
export class MyReportsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'reportName',
    'status',
    'message',
    'download'
  ];
  dataSource = new MatTableDataSource<AsyncReport>([]);
  isLoading = false;
  downloadingReportId: number | string | null = null;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private reportsService: ReportsService,
    private alertService: AlertService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReports(): void {
    this.isLoading = true;
    this.reportsService.getAsyncReports().subscribe({
      next: (response: any) => {
        this.dataSource.data = this.normalizeReports(response);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
        this.alertService.alert({
          type: 'My Reports',
          message: 'Unable to load generated reports'
        });
      }
    });
  }

  isCompleted(status: string): boolean {
    return (status || '').toLowerCase() === 'completed';
  }

  downloadReport(report: AsyncReport): void {
    if (!report.id || !this.isCompleted(report.status)) {
      return;
    }

    this.downloadingReportId = report.id;
    this.reportsService.downloadAsyncReport(report.id).subscribe({
      next: (response) => {
        const blob = response.body as Blob;
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = this.getDownloadFileName(response.headers.get('content-disposition'), report);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
        this.downloadingReportId = null;
      },
      error: () => {
        this.downloadingReportId = null;
        this.alertService.alert({
          type: 'My Reports',
          message: `Unable to download report: ${report.reportName}`
        });
      }
    });
  }

  showMessage(report: AsyncReport): void {
    if (!this.hasMessage(report.message)) {
      return;
    }

    this.dialog.open(ErrorDialogComponent, {
      data: report.message
    });
  }

  hasMessage(message: string): boolean {
    return !!message && message !== '--';
  }

  private normalizeReports(response: any): AsyncReport[] {
    const reports = Array.isArray(response)
      ? response
      : response?.pageItems || response?.content || response?.data || response?.results || [];

    return reports.map((report: any) => ({
      id: report.id ?? report.runReportId ?? report.reportRunId,
      reportName: report.reportName ?? report.reportname ?? report.name ?? '--',
      status: report.status?.value ?? report.status ?? report.reportStatus ?? '--',
      message: report.message ?? report.mesage ?? report.errorMessage ?? report.responseMessage ?? '--'
    }));
  }

  private getDownloadFileName(contentDisposition: string | null, report: AsyncReport): string {
    const matchedName = contentDisposition?.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i)?.[1];
    if (matchedName) {
      return decodeURIComponent(matchedName);
    }

    const sanitizedReportName = (report.reportName || 'report').replace(/[^a-z0-9-_]+/gi, '-');
    return `${sanitizedReportName}-${report.id}`;
  }
}
