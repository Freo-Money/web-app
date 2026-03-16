import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { FormatNumberPipe } from '../../../pipes/format-number.pipe';
import { YesnoPipe } from '../../../pipes/yesno.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    DateFormatPipe,
    FormatNumberPipe,
    YesnoPipe
  ]
})
export class AccountDetailsComponent {
  loanDetails: any;
  dataObject: {
    property: string;
    value: string;
  }[];

  constructor(private route: ActivatedRoute) {
    this.route.parent.data.subscribe((data: { loanDetailsData: any }) => {
      this.loanDetails = data.loanDetailsData;
    });
  }

  getRepaymentFrequencyCatalogKey(): string {
    const unit: string | undefined = this.loanDetails?.repaymentFrequencyType?.value;
    const every: number | undefined = this.loanDetails?.repaymentEvery;

    if (!unit) {
      return '';
    }

    // If "every 1 X", prefer adjective form (Daily/Weekly/Monthly/Annually).
    if (every === 1) {
      switch (unit) {
        case 'Days':
          return 'Daily';
        case 'Weeks':
          return 'Weekly';
        case 'Months':
          return 'Monthly';
        case 'Years':
          return 'Annually';
        default:
          return unit;
      }
    }

    // Otherwise keep plural unit (Days/Weeks/Months/Years).
    return unit;
  }
}
