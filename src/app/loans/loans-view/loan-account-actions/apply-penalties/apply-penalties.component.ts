import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Dates } from 'app/core/utils/dates';
import { LoansService } from '../../../loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-apply-penalties',
  standalone: true,
  imports: [...STANDALONE_SHARED_IMPORTS],
  templateUrl: './apply-penalties.component.html',
  styleUrls: ['./apply-penalties.component.scss']
})
export class ApplyPenaltiesComponent implements OnInit {
  loanId!: number;
  clientId!: number;

  form: UntypedFormGroup;

  minDate = new Date();
  maxDate = new Date();

  constructor(
    private fb: UntypedFormBuilder,
    private loanService: LoansService,
    private route: ActivatedRoute,
    private router: Router,
    private dateUtils: Dates,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.loanId = +this.route.snapshot.params['loanId'];
    this.clientId = +this.route.snapshot.params['clientId'];
    this.maxDate = this.settingsService.businessDate;
    this.minDate = this.settingsService.businessDate;
    this.form = this.fb.group({
      runAsOnDate: [
        this.maxDate,
        Validators.required
      ]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    let transactionDate = this.form.value.runAsOnDate;
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;

    if (transactionDate instanceof Date) {
      transactionDate = this.dateUtils.formatDate(transactionDate, dateFormat);
    }

    const payload = {
      runAsOnDate: transactionDate,
      dateFormat,
      locale
    };

    this.loanService.applyPenalties(this.loanId).subscribe(() => {
      this.router.navigate([
        '/clients',
        this.clientId,
        'loans-accounts',
        this.loanId
      ]);
    });
  }

  cancel(): void {
    this.router.navigate([
      '/clients',
      this.clientId,
      'loans-accounts',
      this.loanId
    ]);
  }
}
