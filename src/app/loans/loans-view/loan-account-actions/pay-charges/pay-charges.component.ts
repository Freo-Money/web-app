/** Angular Imports */
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

/** Custom Services */
import { LoansService } from 'app/loans/loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { Currency } from 'app/shared/models/general.model';
import { OptionData } from 'app/shared/models/option-data.model';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { FormatNumberPipe } from 'app/pipes/format-number.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Loan Pay Charges Component
 */
@Component({
  selector: 'mifosx-pay-charges',
  templateUrl: './pay-charges.component.html',
  styleUrls: ['./pay-charges.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatSlideToggle,
    CdkTextareaAutosize,
    FormatNumberPipe
  ]
})
export class PayChargesComponent implements OnInit, OnChanges {
  @Input() dataObject: any;

  /** Loan Id */
  loanId: string;
  /** Minimum Date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum Date allowed. */
  maxDate = new Date();
  /** Show payment details */
  showPaymentDetails = false;

  payChargesForm: UntypedFormGroup;

  chargeOptions: any[] = [];
  filteredChargeOptions: any[] = [];
  paymentModes: OptionData[] = [];
  paymentTypes: any[] = [];
  selectedCharge: any;
  currency: Currency | null = null;
  outstandingAmount: number | null = null;

  readonly defaultPaymentModes: OptionData[] = [
    { id: 0, code: 'chargepaymentmode.regular', value: 'Regular' },
    { id: 1, code: 'chargepaymentmode.accounttransfer', value: 'Account transfer' }
  ];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private loansService: LoansService,
    private route: ActivatedRoute,
    private router: Router,
    private dateUtils: Dates,
    private settingsService: SettingsService
  ) {
    this.loanId = this.route.snapshot.params['loanId'];
  }

  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.createPayChargesForm();

    this.payChargesForm.controls.chargeId.valueChanges.subscribe((selectedChargeId) => {
      this.updateSelectedChargeDetails(selectedChargeId);
    });

    this.payChargesForm.controls.chargePaymentMode.valueChanges.subscribe((selectedPaymentModeId) => {
      this.updateFilteredChargeOptions(selectedPaymentModeId);
    });

    this.payChargesForm.controls.transactionDate.valueChanges.subscribe((transactionDate) => {
      this.reloadTemplateForDate(transactionDate);
    });

    this.initializeTemplateData();
  }

  /**
   * Re-fetches the charge-payment template for the selected date so the
   * charge data (e.g. outstanding amounts) reflects that date.
   */
  reloadTemplateForDate(transactionDate: Date | string): void {
    if (!transactionDate) {
      return;
    }

    this.loansService.getLoanChargePaymentTemplate(this.loanId, transactionDate).subscribe((dataObject: any) => {
      this.dataObject = dataObject;
      this.initializeTemplateData();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataObject'] && this.payChargesForm) {
      this.initializeTemplateData();
    }
  }

  initializeTemplateData() {
    this.chargeOptions = this.dataObject?.charges || [];
    this.paymentTypes = this.dataObject?.paymentTypeOptions || [];
    this.paymentModes = this.getPaymentModes();

    this.populateOutstandingFromLoanChargesIfMissing();

    this.updateFilteredChargeOptions(this.payChargesForm.controls.chargePaymentMode.value);

    if (!this.payChargesForm.controls.chargeId.value && this.filteredChargeOptions.length > 0) {
      const defaultCharge = this.getFirstPayableCharge(this.filteredChargeOptions);
      this.payChargesForm.patchValue({
        chargeId: this.getChargeSelectValue(defaultCharge)
      });
    }

    this.updateSelectedChargeDetails(this.payChargesForm.controls.chargeId.value);
  }

  populateOutstandingFromLoanChargesIfMissing(): void {
    const hasOutstandingFromTemplate = this.chargeOptions.some(
      (charge) => this.getChargeOutstandingAmount(charge) !== null
    );
    if (hasOutstandingFromTemplate) {
      return;
    }

    this.loansService.getLoanAccountResource(this.loanId, 'charges').subscribe((loanAccountData: any) => {
      const loanCharges = Array.isArray(loanAccountData?.charges) ? loanAccountData.charges : [];
      if (loanCharges.length === 0 || this.chargeOptions.length === 0) {
        return;
      }

      this.chargeOptions = this.chargeOptions.map((templateCharge) => {
        const templateChargeId = this.getChargeSelectValue(templateCharge);
        const templateChargeIdAsNumber = Number(templateChargeId);

        const matchingLoanCharge = loanCharges.find((loanCharge: any) => {
          const loanChargeId = this.getChargeSelectValue(loanCharge);
          const loanChargeIdAsNumber = Number(loanChargeId);
          return (
            loanChargeId === templateChargeId ||
            (!Number.isNaN(templateChargeIdAsNumber) &&
              !Number.isNaN(loanChargeIdAsNumber) &&
              loanChargeIdAsNumber === templateChargeIdAsNumber)
          );
        });

        if (!matchingLoanCharge) {
          return templateCharge;
        }

        return {
          ...templateCharge,
          amountOutstanding:
            matchingLoanCharge.amountOutstanding ??
            matchingLoanCharge.amountOutstandingDerived ??
            matchingLoanCharge.amount_outstanding_derived ??
            matchingLoanCharge.outstandingAmount ??
            matchingLoanCharge.outstanding
        };
      });

      this.updateFilteredChargeOptions(this.payChargesForm.controls.chargePaymentMode.value);
      this.updateSelectedChargeDetails(this.payChargesForm.controls.chargeId.value);
    });
  }

  getPaymentModes(): OptionData[] {
    const backendModeOptions = this.dataObject?.chargePaymentModeOptions;
    const normalizedFromTemplate = Array.isArray(backendModeOptions)
      ? backendModeOptions
          .map((mode: any) => this.normalizePaymentMode(mode))
          .filter((mode: OptionData | null): mode is OptionData => !!mode)
      : [];

    const normalizedFromCharges = this.chargeOptions
      .map((charge: any) => this.normalizePaymentMode(charge?.chargePaymentMode || charge?.paymentMode))
      .filter((mode: OptionData | null): mode is OptionData => !!mode);

    const merged = [
      ...normalizedFromTemplate,
      ...normalizedFromCharges
    ].reduce((acc: OptionData[], mode: OptionData) => {
      if (!acc.some((existing) => existing.id === mode.id)) {
        acc.push(mode);
      }
      return acc;
    }, []);

    return merged.length > 0 ? merged : this.defaultPaymentModes;
  }

  updateFilteredChargeOptions(selectedPaymentModeId: number | string | null) {
    const hasPaymentModeFilter =
      selectedPaymentModeId !== null && selectedPaymentModeId !== undefined && selectedPaymentModeId !== '';
    const normalizedPaymentModeId = hasPaymentModeFilter ? Number(selectedPaymentModeId) : null;

    if (hasPaymentModeFilter && normalizedPaymentModeId !== null && !Number.isNaN(normalizedPaymentModeId)) {
      this.filteredChargeOptions = this.chargeOptions.filter((charge) => {
        const chargePaymentModeId = this.extractChargePaymentModeId(charge);
        return chargePaymentModeId === normalizedPaymentModeId;
      });
    } else {
      this.filteredChargeOptions = [
        ...this.chargeOptions
      ];
    }

    if (hasPaymentModeFilter && this.filteredChargeOptions.length === 0) {
      this.filteredChargeOptions = [
        ...this.chargeOptions
      ];
    }

    const selectedChargeId = this.payChargesForm.controls.chargeId.value;
    const selectedChargeIdAsNumber = Number(selectedChargeId);
    const isSelectedChargeValid = this.filteredChargeOptions.some((charge) => {
      const chargeValue = this.getChargeSelectValue(charge);
      return (
        chargeValue === selectedChargeId ||
        (!Number.isNaN(selectedChargeIdAsNumber) && chargeValue === selectedChargeIdAsNumber)
      );
    });

    if (!isSelectedChargeValid) {
      const defaultCharge = this.getFirstPayableCharge(this.filteredChargeOptions);
      this.payChargesForm.patchValue(
        {
          chargeId: this.filteredChargeOptions.length > 0 ? this.getChargeSelectValue(defaultCharge) : ''
        },
        { emitEvent: true }
      );
    }
  }

  getChargeOutstandingAmount(charge: any): number | null {
    const rawOutstandingCandidates = [
      charge?.amountOutstanding,
      charge?.amountOutstandingDerived,
      charge?.amount_outstanding_derived,
      charge?.outstandingAmount,
      charge?.outstanding
    ];

    const rawOutstanding = rawOutstandingCandidates.find(
      (value) => value !== null && value !== undefined && value !== ''
    );

    if (rawOutstanding === null || rawOutstanding === undefined || rawOutstanding === '') {
      return null;
    }

    const value = Number(rawOutstanding);
    return Number.isNaN(value) ? null : value;
  }

  updateSelectedChargeDetails(selectedChargeId: any): void {
    this.selectedCharge = this.findChargeById(selectedChargeId);
    this.currency = this.selectedCharge?.currency || null;
    this.outstandingAmount = this.getChargeOutstandingAmount(this.selectedCharge);

    console.log('=== CHARGE SELECTED ===');
    console.log('Selected Charge Object:', JSON.stringify(this.selectedCharge, null, 2));
    console.log('Outstanding Amount:', this.outstandingAmount);
    console.log('========================');

    const amountControl = this.payChargesForm.controls.transactionAmount;
    const validators = [
      Validators.required,
      Validators.min(0.001)];
    if (this.outstandingAmount !== null) {
      validators.push(Validators.max(this.outstandingAmount));
    }
    amountControl.setValidators(validators);
    amountControl.updateValueAndValidity();
  }

  getFirstPayableCharge(charges: any[]): any {
    if (!Array.isArray(charges) || charges.length === 0) {
      return null;
    }

    return (
      charges.find((charge) => {
        const outstanding = this.getChargeOutstandingAmount(charge);
        return outstanding === null || outstanding > 0;
      }) || charges[0]
    );
  }

  findChargeById(selectedChargeId: any): any {
    const selectedChargeIdAsNumber = Number(selectedChargeId);
    return this.chargeOptions.find((charge) => {
      const chargeValue = this.getChargeSelectValue(charge);
      return (
        chargeValue === selectedChargeId ||
        (!Number.isNaN(selectedChargeIdAsNumber) && chargeValue === selectedChargeIdAsNumber)
      );
    });
  }

  normalizePaymentMode(mode: any): OptionData | null {
    if (mode === null || mode === undefined) {
      return null;
    }

    if (typeof mode === 'number') {
      const fallback = this.defaultPaymentModes.find((item) => item.id === mode);
      return fallback || { id: mode, code: `chargepaymentmode.${mode}`, value: `Mode ${mode}` };
    }

    const id = Number(mode.id ?? mode.value ?? mode.chargePaymentMode);
    if (Number.isNaN(id)) {
      return null;
    }

    return {
      id,
      code: mode.code || this.defaultPaymentModes.find((item) => item.id === id)?.code || `chargepaymentmode.${id}`,
      value: mode.value || mode.name || this.defaultPaymentModes.find((item) => item.id === id)?.value || `Mode ${id}`
    };
  }

  extractChargePaymentModeId(charge: any): number | null {
    const normalized = this.normalizePaymentMode(charge?.chargePaymentMode || charge?.paymentMode);
    return normalized ? normalized.id : null;
  }

  createPayChargesForm() {
    this.payChargesForm = this.formBuilder.group({
      transactionDate: [
        this.settingsService.businessDate,
        Validators.required
      ],
      chargePaymentMode: [
        ''
      ],
      chargeId: [
        '',
        Validators.required
      ],
      transactionAmount: [
        '',
        [
          Validators.required,
          Validators.min(0.001)]
      ],
      paymentTypeId: '',
      externalId: '',
      note: ''
    });
  }

  addPaymentDetails() {
    this.showPaymentDetails = !this.showPaymentDetails;
    if (this.showPaymentDetails) {
      this.payChargesForm.addControl('accountNumber', new UntypedFormControl(''));
      this.payChargesForm.addControl('checkNumber', new UntypedFormControl(''));
      this.payChargesForm.addControl('routingCode', new UntypedFormControl(''));
      this.payChargesForm.addControl('receiptNumber', new UntypedFormControl(''));
      this.payChargesForm.addControl('bankNumber', new UntypedFormControl(''));
    } else {
      this.payChargesForm.removeControl('accountNumber');
      this.payChargesForm.removeControl('checkNumber');
      this.payChargesForm.removeControl('routingCode');
      this.payChargesForm.removeControl('receiptNumber');
      this.payChargesForm.removeControl('bankNumber');
    }
  }

  getChargeSelectValue(charge: any): number {
    return charge?.chargeId || charge?.id;
  }

  submit() {
    const payChargesFormData = this.payChargesForm.value;
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;

    const prevTransactionDate: Date = payChargesFormData.transactionDate;
    if (payChargesFormData.transactionDate instanceof Date) {
      payChargesFormData.transactionDate = this.dateUtils.formatDate(prevTransactionDate, dateFormat);
    }

    const chargeId = payChargesFormData.chargeId;
    const data: any = {
      transactionDate: payChargesFormData.transactionDate,
      transactionAmount: payChargesFormData.transactionAmount * 1,
      locale,
      dateFormat
    };

    const selectedChargePaymentModeId = this.extractChargePaymentModeId(this.selectedCharge);
    const paymentModeId =
      payChargesFormData.chargePaymentMode !== '' && payChargesFormData.chargePaymentMode !== null
        ? Number(payChargesFormData.chargePaymentMode)
        : selectedChargePaymentModeId;
    if (payChargesFormData.paymentTypeId !== '' && payChargesFormData.paymentTypeId !== null) {
      data.paymentTypeId = payChargesFormData.paymentTypeId;
    }
    if (payChargesFormData.externalId !== '' && payChargesFormData.externalId !== null) {
      data.externalId = payChargesFormData.externalId;
    }
    if (payChargesFormData.accountNumber) {
      data.accountNumber = payChargesFormData.accountNumber;
    }
    if (payChargesFormData.checkNumber) {
      data.checkNumber = payChargesFormData.checkNumber;
    }
    if (payChargesFormData.routingCode) {
      data.routingCode = payChargesFormData.routingCode;
    }
    if (payChargesFormData.receiptNumber) {
      data.receiptNumber = payChargesFormData.receiptNumber;
    }
    if (payChargesFormData.bankNumber) {
      data.bankNumber = payChargesFormData.bankNumber;
    }
    if (payChargesFormData.note) {
      data.note = payChargesFormData.note;
    }

    this.loansService.submitLoanChargePayment(this.loanId, chargeId, data).subscribe(() => {
      this.router.navigate(['../../transactions'], { relativeTo: this.route });
    });
  }
}
