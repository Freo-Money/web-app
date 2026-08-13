/** Angular Imports */
import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

/** Custom Services */
import { LoansService } from 'app/loans/loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { Currency } from 'app/shared/models/general.model';
import { InputAmountComponent } from '../../../../shared/input-amount/input-amount.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Loan Part Payment Component.
 *
 * Submits a prepayment against a loan, after which the backend re-amortises the remaining schedule using the
 * part-payment recalculation strategy configured on the loan (or, failing that, on its product). The strategy itself
 * is not part of this payload - it is resolved server-side - so it is shown here read-only, purely so the user can
 * see whether the payment will shorten the tenure or reduce the EMI before committing.
 */
@Component({
  selector: 'mifosx-part-payment',
  templateUrl: './part-payment.component.html',
  styleUrls: ['./part-payment.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    InputAmountComponent,
    MatSlideToggle,
    CdkTextareaAutosize
  ]
})
export class PartPaymentComponent implements OnInit {
  @Input() dataObject: any;
  /** Loan Id */
  loanId: string;
  /** Payment Type Options */
  paymentTypes: any;
  /** Show payment details */
  showPaymentDetails = false;
  /** Minimum Date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum Date allowed - a part payment cannot be dated in the future. */
  maxDate = new Date();
  /** Part Payment Form */
  partPaymentForm: UntypedFormGroup;
  currency: Currency | null = null;
  /** Strategy the backend will apply, resolved from the loan then its product. Display only. */
  partPaymentRecalculationStrategy: string | null = null;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private loanService: LoansService,
    private route: ActivatedRoute,
    private router: Router,
    private dateUtils: Dates,
    private settingsService: SettingsService
  ) {
    this.loanId = this.route.snapshot.params['loanId'];
  }

  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.createPartPaymentForm();
    this.paymentTypes = this.dataObject.paymentTypeOptions;
    if (this.dataObject.currency) {
      this.currency = this.dataObject.currency;
    }
    this.loadResolvedStrategy();
  }

  /**
   * Reads the effective strategy off the loan account. GET /loans/{id} reports the loan's own snapshot when it has
   * one and the product's configuration otherwise, which is the same precedence the backend applies when the payment
   * is actually processed.
   */
  private loadResolvedStrategy(): void {
    this.loanService.getLoanAccountAssociationDetails(this.loanId).subscribe(
      (loanDetails: any) => {
        this.partPaymentRecalculationStrategy =
          loanDetails?.partPaymentConfig?.partPaymentRecalculationStrategy?.value || null;
      },
      () => {
        // Purely informational - a failure here must not block the payment itself.
        this.partPaymentRecalculationStrategy = null;
      }
    );
  }

  createPartPaymentForm() {
    this.partPaymentForm = this.formBuilder.group({
      transactionDate: [
        this.settingsService.businessDate,
        Validators.required
      ],
      transactionAmount: [
        '',
        [
          Validators.required,
          Validators.min(0.001)]
      ],
      externalId: '',
      paymentTypeId: '',
      note: ''
    });
  }

  /**
   * Add payment detail fields to the UI.
   */
  addPaymentDetails() {
    this.showPaymentDetails = !this.showPaymentDetails;
    if (this.showPaymentDetails) {
      this.partPaymentForm.addControl('accountNumber', new UntypedFormControl(''));
      this.partPaymentForm.addControl('checkNumber', new UntypedFormControl(''));
      this.partPaymentForm.addControl('routingCode', new UntypedFormControl(''));
      this.partPaymentForm.addControl('receiptNumber', new UntypedFormControl(''));
      this.partPaymentForm.addControl('bankNumber', new UntypedFormControl(''));
    } else {
      this.partPaymentForm.removeControl('accountNumber');
      this.partPaymentForm.removeControl('checkNumber');
      this.partPaymentForm.removeControl('routingCode');
      this.partPaymentForm.removeControl('receiptNumber');
      this.partPaymentForm.removeControl('bankNumber');
    }
  }

  /** Submits the part payment form */
  submit() {
    const partPaymentFormData = this.partPaymentForm.value;
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;
    const prevTransactionDate: Date = this.partPaymentForm.value.transactionDate;
    if (partPaymentFormData.transactionDate instanceof Date) {
      partPaymentFormData.transactionDate = this.dateUtils.formatDate(prevTransactionDate, dateFormat);
    }
    const data: any = {
      ...partPaymentFormData,
      dateFormat,
      locale
    };
    data['transactionAmount'] = data['transactionAmount'] * 1;
    this.loanService.submitLoanActionButton(this.loanId, data, 'partPayment').subscribe(() => {
      this.router.navigate(['../../transactions'], { relativeTo: this.route });
    });
  }
}
