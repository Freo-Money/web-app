import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
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
import { NgClass, NgIf } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCard } from '@angular/material/card';

import { AccountNumberComponent } from '../../shared/account-number/account-number.component';
import { LongTextComponent } from '../../shared/long-text/long-text.component';
import { StatusLookupPipe } from '../../pipes/status-lookup.pipe';
import { AccountsFilterPipe } from '../../pipes/accounts-filter.pipe';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-loan-accounts-list',
  templateUrl: './loan-accounts-list.component.html',
  styleUrls: ['./loan-accounts-list.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    NgClass,
    NgIf,
    MatCard,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    AccountNumberComponent,
    LongTextComponent,
    MatTooltip,
    StatusLookupPipe,
    AccountsFilterPipe,
    DateFormatPipe,
    FormatNumberPipe
  ]
})
export class LoanAccountsListComponent {
  openLoansColumns: string[] = [
    'Account No',
    'Loan Account',
    'Original Loan',
    'Loan Balance',
    'Amount Paid',
    'Type',
    'Actions'
  ];
  closedLoansColumns: string[] = [
    'Account No',
    'Loan Account',
    'Original Loan',
    'Loan Balance',
    'Amount Paid',
    'Type',
    'Closed Date'
  ];

  loanAccounts: any;
  showClosedLoanAccounts = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.data.subscribe((data: { accountsData: any }) => {
      this.loanAccounts = data.accountsData.loanAccounts;
    });
  }

  toggleLoanAccountsOverview() {
    this.showClosedLoanAccounts = !this.showClosedLoanAccounts;
  }

  routeEdit($event: MouseEvent) {
    $event.stopPropagation();
  }

  routeTransferFund(loanId: any) {
    const queryParams: any = { loanId: loanId, accountType: 'fromloans' };
    this.router.navigate(
      [
        '../',
        loanId,
        'transfer-funds',
        'make-account-transfer'
      ],
      {
        relativeTo: this.route,
        queryParams: queryParams
      }
    );
  }

  viewAccountsLabel(closed: boolean): string {
    if (closed) {
      return 'labels.buttons.View Active Accounts';
    } else {
      return 'labels.buttons.View Closed Accounts';
    }
  }
}
