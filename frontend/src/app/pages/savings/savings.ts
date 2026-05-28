import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SavingsService, SavingsGoal } from '../../core/services/savings.service';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './savings.html',
  styleUrl: './savings.css'
})
export class Savings implements OnInit {
  goals: SavingsGoal[] = [];
  form: FormGroup;
  contributionForm: FormGroup;
  isLoading = false;
  userName = 'Usuario';
  selectedGoalId: string | null = null;
  contributionAmount: number = 0;
  showContributionModal = false;
  editingGoalId: string | null = null;
  contributionError = '';
  contributionSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private savingsService: SavingsService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      montoObjetivo: ['', Validators.required],
      montoActual: [''],
      fechaObjetivo: ['']
    });
    this.contributionForm = this.fb.group({
      monto: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.savingsService.getAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.goals = res.data;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  formatCurrencyInput(event: any, controlName: string, isContributionForm = false): void {
    let inputVal = event.target.value;
    // Remove non-digits
    const numericVal = inputVal.replace(/\D/g, '');
    
    let formatted = '';
    if (numericVal) {
      formatted = new Intl.NumberFormat('es-CO').format(Number(numericVal));
    }
    
    const targetForm = isContributionForm ? this.contributionForm : this.form;
    targetForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  editGoal(goal: SavingsGoal): void {
    this.editingGoalId = goal._id || null;
    let fechaStr = '';
    if (goal.fechaObjetivo) {
      fechaStr = new Date(goal.fechaObjetivo).toISOString().substring(0, 10);
    }

    const formattedObjetivo = new Intl.NumberFormat('es-CO').format(goal.montoObjetivo);
    const formattedActual = new Intl.NumberFormat('es-CO').format(goal.montoActual || 0);

    this.form.patchValue({
      titulo: goal.titulo,
      montoObjetivo: formattedObjetivo,
      montoActual: formattedActual,
      fechaObjetivo: fechaStr
    });
  }

  cancelEdit(): void {
    this.editingGoalId = null;
    this.form.reset();
  }

  create(): void {
    if (this.form.invalid) return;
    const values = this.form.value;
    
    const objetivoStr = String(values.montoObjetivo).replace(/\D/g, '');
    const objetivoNum = Number(objetivoStr);
    if (isNaN(objetivoNum) || objetivoNum <= 0) return;

    const data: any = {
      titulo: values.titulo,
      montoObjetivo: objetivoNum,
      fechaObjetivo: values.fechaObjetivo || null
    };

    if (values.montoActual !== null && values.montoActual !== undefined && values.montoActual !== '') {
      const actualStr = String(values.montoActual).replace(/\D/g, '');
      const actualNum = Number(actualStr);
      if (!isNaN(actualNum)) {
        data.montoActual = actualNum;
      }
    }

    if (this.editingGoalId) {
      this.savingsService.update(this.editingGoalId, data).subscribe({
        next: () => {
          this.cancelEdit();
          this.load();
        },
        error: (err) => console.error('Error al actualizar meta', err)
      });
    } else {
      this.savingsService.create(data).subscribe({
        next: () => {
          this.form.reset();
          this.load();
        },
        error: (err) => console.error('Error al crear meta', err)
      });
    }
  }

  deleteGoal(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta meta de ahorro?')) {
      this.savingsService.delete(id).subscribe({
        next: () => {
          if (this.editingGoalId === id) this.cancelEdit();
          this.load();
        },
        error: (err) => console.error('Error al eliminar meta', err)
      });
    }
  }

  openContribution(goalId: string): void {
    this.selectedGoalId = goalId;
    this.showContributionModal = true;
    this.contributionError = '';
  }

  closeContribution(): void {
    this.showContributionModal = false;
    this.selectedGoalId = null;
    this.contributionForm.reset();
    this.contributionError = '';
    this.contributionSubmitting = false;
  }

  submitContribution(): void {
    if (this.contributionForm.invalid || !this.selectedGoalId) return;
    
    const montoStr = String(this.contributionForm.value.monto).replace(/\D/g, '');
    const montoNum = Number(montoStr);
    if (isNaN(montoNum) || montoNum <= 0) {
      this.contributionError = 'Monto inválido';
      return;
    }

    this.contributionSubmitting = true;
    this.contributionError = '';

    this.savingsService.contribute(this.selectedGoalId, { monto: montoNum }).subscribe({
      next: () => {
        this.contributionSubmitting = false;
        this.closeContribution();
        this.load();
      },
      error: (err) => {
        this.contributionSubmitting = false;
        this.contributionError = err.error?.message || err.message || 'Error al aportar a la meta';
        console.error('Error al aportar a la meta', err);
      }
    });
  }

  getProgress(goal: SavingsGoal): number {
    if (!goal.montoObjetivo || goal.montoObjetivo === 0) return 0;
    const pct = ((goal.montoActual || 0) / goal.montoObjetivo) * 100;
    return Math.min(Math.round(pct), 100);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
