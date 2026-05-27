import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DebtsService, Debt } from '../../core/services/debts.service';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterLinkActive],
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
  editingDebtId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private debtsService: DebtsService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      acreedor: ['', Validators.required],
      principal: ['', Validators.required],
      saldo: [''],
      descripcion: ['']
    });
    this.paymentForm = this.fb.group({
      monto: ['', Validators.required]
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

  formatCurrencyInput(event: any, controlName: string, isPaymentForm = false): void {
    let inputVal = event.target.value;
    // Remove non-digits
    const numericVal = inputVal.replace(/\D/g, '');
    
    let formatted = '';
    if (numericVal) {
      formatted = new Intl.NumberFormat('es-CO').format(Number(numericVal));
    }
    
    const targetForm = isPaymentForm ? this.paymentForm : this.form;
    targetForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  editDebt(debt: Debt): void {
    this.editingDebtId = debt._id || null;
    
    const formattedPrincipal = new Intl.NumberFormat('es-CO').format(debt.principal);
    const formattedSaldo = new Intl.NumberFormat('es-CO').format(debt.saldo);

    this.form.patchValue({
      acreedor: debt.acreedor,
      principal: formattedPrincipal,
      saldo: formattedSaldo,
      descripcion: debt.descripcion
    });
  }

  cancelEdit(): void {
    this.editingDebtId = null;
    this.form.reset();
  }

  create(): void {
    if (this.form.invalid) return;
    const values = this.form.value;
    
    const principalStr = String(values.principal).replace(/\./g, '');
    const principalNum = Number(principalStr);
    if (isNaN(principalNum) || principalNum <= 0) return;

    const data: any = {
      acreedor: values.acreedor,
      principal: principalNum,
      descripcion: values.descripcion
    };

    if (values.saldo !== null && values.saldo !== undefined && values.saldo !== '') {
      const saldoStr = String(values.saldo).replace(/\./g, '');
      const saldoNum = Number(saldoStr);
      if (!isNaN(saldoNum)) {
        data.saldo = saldoNum;
      }
    }

    if (this.editingDebtId) {
      this.debtsService.update(this.editingDebtId, data).subscribe({
        next: () => {
          this.cancelEdit();
          this.load();
        },
        error: (err) => console.error('Error al actualizar deuda', err)
      });
    } else {
      this.debtsService.create(data).subscribe({
        next: () => {
          this.form.reset();
          this.load();
        },
        error: (err) => console.error('Error al registrar deuda', err)
      });
    }
  }

  deleteDebt(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este registro de deuda?')) {
      this.debtsService.delete(id).subscribe({
        next: () => {
          if (this.editingDebtId === id) this.cancelEdit();
          this.load();
        },
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
    
    const montoStr = String(this.paymentForm.value.monto).replace(/\./g, '');
    const montoNum = Number(montoStr);
    if (isNaN(montoNum) || montoNum <= 0) return;

    this.debtsService.pay(this.selectedDebtId, { monto: montoNum }).subscribe({
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
