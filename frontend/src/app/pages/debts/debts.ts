import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DebtsService, Debt } from '../../core/services/debts.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './debts.html',
  styleUrl: './debts.css'
})
export class Debts implements OnInit {
  debts: Debt[] = [];
  form: FormGroup;
  paymentForm: FormGroup;
  isLoading = false;
  userName = 'Usuario';
  selectedDebtId: string | null = null;
  showPaymentModal = false;

  constructor(
    private fb: FormBuilder,
    private debtsService: DebtsService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      acreedor: ['', Validators.required],
      principal: ['', [Validators.required, Validators.min(0.01)]],
      descripcion: ['']
    });
    this.paymentForm = this.fb.group({
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.debtsService.getAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.debts = res.data;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  create(): void {
    if (this.form.invalid) return;
    const data = { ...this.form.value, principal: Number(this.form.value.principal) };
    this.debtsService.create(data).subscribe({
      next: () => {
        this.form.reset();
        this.load();
      },
      error: () => {}
    });
  }

  deleteDebt(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este registro de deuda?')) {
      this.debtsService.delete(id).subscribe({
        next: () => this.load(),
        error: (err) => console.error('Error al eliminar deuda', err)
      });
    }
  }

  openPayment(debtId: string): void {
    this.selectedDebtId = debtId;
    this.showPaymentModal = true;
  }

  closePayment(): void {
    this.showPaymentModal = false;
    this.selectedDebtId = null;
    this.paymentForm.reset();
  }

  submitPayment(): void {
    if (this.paymentForm.invalid || !this.selectedDebtId) return;
    const monto = Number(this.paymentForm.value.monto);
    this.debtsService.pay(this.selectedDebtId, { monto }).subscribe({
      next: () => {
        this.closePayment();
        this.load();
      },
      error: (err) => console.error('Error al registrar pago de deuda', err)
    });
  }

  getPaidPercent(debt: Debt): number {
    if (!debt.principal || debt.principal === 0) return 0;
    const paid = debt.principal - debt.saldo;
    const pct = (paid / debt.principal) * 100;
    return Math.max(0, Math.min(Math.round(pct), 100));
  }
}
