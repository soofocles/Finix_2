import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SavingsService, SavingsGoal } from '../../core/services/savings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
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

  constructor(
    private fb: FormBuilder,
    private savingsService: SavingsService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      montoObjetivo: ['', [Validators.required, Validators.min(0.01)]],
      fechaObjetivo: ['']
    });
    this.contributionForm = this.fb.group({
      monto: ['', [Validators.required, Validators.min(0.01)]]
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

  create(): void {
    if (this.form.invalid) return;
    const data = { ...this.form.value, montoObjetivo: Number(this.form.value.montoObjetivo) };
    this.savingsService.create(data).subscribe({
      next: () => {
        this.form.reset();
        this.load();
      },
      error: () => {}
    });
  }

  deleteGoal(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta meta de ahorro?')) {
      this.savingsService.delete(id).subscribe({
        next: () => this.load(),
        error: (err) => console.error('Error al eliminar meta', err)
      });
    }
  }

  openContribution(goalId: string): void {
    this.selectedGoalId = goalId;
    this.showContributionModal = true;
  }

  closeContribution(): void {
    this.showContributionModal = false;
    this.selectedGoalId = null;
    this.contributionForm.reset();
  }

  submitContribution(): void {
    if (this.contributionForm.invalid || !this.selectedGoalId) return;
    const monto = Number(this.contributionForm.value.monto);
    this.savingsService.contribute(this.selectedGoalId, { monto }).subscribe({
      next: () => {
        this.closeContribution();
        this.load();
      },
      error: (err) => console.error('Error al aportar a la meta', err)
    });
  }

  getProgress(goal: SavingsGoal): number {
    if (!goal.montoObjetivo || goal.montoObjetivo === 0) return 0;
    const pct = ((goal.montoActual || 0) / goal.montoObjetivo) * 100;
    return Math.min(Math.round(pct), 100);
  }
}
