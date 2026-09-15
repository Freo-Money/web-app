import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'accountsFilter' })
export class AccountsFilterPipe implements PipeTransform {
  private dateArrayToValue(dateArr: number[]): number {
    if (!dateArr || dateArr.length < 3) {
      return 0;
    }
    return dateArr[0] * 10000 + dateArr[1] * 100 + dateArr[2];
  }

  transform(accounts: any, type: any, status: any, checkSavings: any): any {
    if (accounts) {
      if (type === 'loan') {
        if (status === 'closed') {
          accounts = accounts.filter((account: any) => {
            return (
              account.status.code === 'loanStatusType.closed.written.off' ||
              account.status.code === 'loanStatusType.closed.obligations.met' ||
              account.status.code === 'loanStatusType.closed.reschedule.outstanding.amount' ||
              account.status.code === 'loanStatusType.withdrawn.by.client' ||
              account.status.code === 'loanStatusType.rejected'
            );
          });
          accounts = accounts.slice().sort((a: any, b: any) => {
            return this.dateArrayToValue(b.timeline?.closedOnDate) - this.dateArrayToValue(a.timeline?.closedOnDate);
          });
        } else {
          accounts = accounts.filter((account: any) => {
            return (
              account.status.code !== 'loanStatusType.closed.written.off' &&
              account.status.code !== 'loanStatusType.closed.obligations.met' &&
              account.status.code !== 'loanStatusType.closed.reschedule.outstanding.amount' &&
              account.status.code !== 'loanStatusType.withdrawn.by.client' &&
              account.status.code !== 'loanStatusType.rejected'
            );
          });
          accounts = accounts.slice().sort((a: any, b: any) => {
            const dateA =
              a.timeline?.actualDisbursementDate || a.timeline?.approvedOnDate || a.timeline?.submittedOnDate;
            const dateB =
              b.timeline?.actualDisbursementDate || b.timeline?.approvedOnDate || b.timeline?.submittedOnDate;
            return this.dateArrayToValue(dateB) - this.dateArrayToValue(dateA);
          });
        }
      }
      if (type === 'saving') {
        if (checkSavings === 'isFixed') {
          accounts = accounts.filter((account: any) => {
            return account.depositType.value === 'Fixed Deposit';
          });
        } else if (checkSavings === 'isRecurring') {
          accounts = accounts.filter((account: any) => {
            return account.depositType.value === 'Recurring Deposit';
          });
        } else if (checkSavings === 'isSavings') {
          accounts = accounts.filter((account: any) => {
            return account.depositType.value === 'Savings';
          });
        }
        if (status === 'closed') {
          accounts = accounts.filter((account: any) => {
            return (
              account.status.code === 'savingsAccountStatusType.withdrawn.by.applicant' ||
              account.status.code === 'savingsAccountStatusType.closed' ||
              account.status.code === 'savingsAccountStatusType.pre.mature.closure' ||
              account.status.code === 'savingsAccountStatusType.rejected'
            );
          });
        } else {
          accounts = accounts.filter((account: any) => {
            return (
              account.status.code !== 'savingsAccountStatusType.withdrawn.by.applicant' &&
              account.status.code !== 'savingsAccountStatusType.closed' &&
              account.status.code !== 'savingsAccountStatusType.pre.mature.closure' &&
              account.status.code !== 'savingsAccountStatusType.rejected'
            );
          });
        }
      }
      if (type === 'share') {
        if (status === 'closed') {
          accounts = accounts.filter((account: any) => {
            return (
              account.status.code === 'shareAccountStatusType.closed' ||
              account.status.code === 'shareAccountStatusType.rejected'
            );
          });
        } else {
          accounts = accounts.filter((account: any) => {
            return (
              account.status.code !== 'shareAccountStatusType.closed' &&
              account.status.code !== 'shareAccountStatusType.rejected'
            );
          });
        }
      }
      if (type === 'guarantor') {
        if (status === false) {
          accounts = accounts.filter((account: any) => {
            return account.status === true;
          });
        } else {
          return accounts;
        }
      }
      if (type === 'clientApproval') {
        accounts = accounts.filter((account: any) => {
          return account.active === false && account.status.value === 'Pending';
        });
      }
      return accounts;
    }
  }
}
