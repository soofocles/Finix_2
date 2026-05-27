import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FinanceService, FinanceAnalysis, FinanceRecord } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import { SavingsService, SavingsGoal } from '../../core/services/savings.service';
import { DebtsService, Debt } from '../../core/services/debts.service';
import { SchedulesService, Schedule } from '../../core/services/schedules.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  analysis: FinanceAnalysis = {
    totalIngresos: 0,
    totalGastos: 0,
    balance: 0
  };
  recentRecords: FinanceRecord[] = [];
  isLoading = true;
  userName = 'Usuario';

  // Extra stats
  totalSavingsAmount = 0;
  totalSavingsTarget = 0;
  totalDebtsAmount = 0;
  totalScheduledAmount = 0;

  // Actual lists for summary widget
  savingsGoals: SavingsGoal[] = [];
  debts: Debt[] = [];
  schedules: any[] = [];

  constructor(
    private financeService: FinanceService,
    private authService: AuthService,
    private savingsService: SavingsService,
    private debtsService: DebtsService,
    private schedulesService: SchedulesService
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    
    // Refresh user details from backend in background to keep it fresh
    this.authService.getMe().subscribe({
      next: () => {
        this.userName = this.authService.getUserName();
      },
      error: (err) => console.log('Error refreshing user details', err)
    });

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Load Analysis
    this.financeService.getAnalysis().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.analysis = {
            totalIngresos: res.data.totalIngresos || 0,
            totalGastos: res.data.totalGastos || 0,
            balance: res.data.balance || 0,
            categoriaMayorGasto: res.data.categoriaMayorGasto,
            gastoPorCategoria: res.data.gastoPorCategoria
          };
        }
      },
      error: (err: any) => console.error('Error loading analysis', err)
    });

    // Load recent records
    this.financeService.getFinances(1, 5).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.recentRecords = res.data;
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading records', err);
        this.isLoading = false;
      }
    });

    // Load extra statistics
    this.savingsService.getAll().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.savingsGoals = res.data.slice(0, 3); // top 3 for dashboard
          this.totalSavingsAmount = res.data.reduce((sum: number, item: any) => sum + (item.montoActual || 0), 0);
          this.totalSavingsTarget = res.data.reduce((sum: number, item: any) => sum + (item.montoObjetivo || 0), 0);
        }
      }
    });

    this.debtsService.getAll().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.debts = res.data.slice(0, 3); // top 3 for dashboard
          this.totalDebtsAmount = res.data.reduce((sum: number, item: any) => sum + (item.saldo || 0), 0);
        }
      }
    });

    this.schedulesService.getAll().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.schedules = res.data.slice(0, 3); // top 3 for dashboard
          this.totalScheduledAmount = res.data
            .filter((item: any) => item.activa !== false)
            .reduce((sum: number, item: any) => sum + (item.monto || 0), 0);
        }
      }
    });
  }

  getProgress(goal: SavingsGoal): number {
    if (!goal.montoObjetivo || goal.montoObjetivo === 0) return 0;
    const pct = ((goal.montoActual || 0) / goal.montoObjetivo) * 100;
    return Math.min(Math.round(pct), 100);
  }

  getPaidPercent(debt: Debt): number {
    if (!debt.principal || debt.principal === 0) return 0;
    const paid = debt.principal - debt.saldo;
    const pct = (paid / debt.principal) * 100;
    return Math.max(0, Math.min(Math.round(pct), 100));
  }

  /** Returns sorted category keys (by highest spend first) */
  getCategoryKeys(): string[] {
    if (!this.analysis.gastoPorCategoria) return [];
    return Object.keys(this.analysis.gastoPorCategoria)
      .sort((a, b) => this.analysis.gastoPorCategoria![b] - this.analysis.gastoPorCategoria![a]);
  }

  /** Returns width % for a category progress bar relative to the max category */
  getCategoryPercent(cat: string): number {
    if (!this.analysis.gastoPorCategoria || this.analysis.totalGastos === 0) return 0;
    return Math.round((this.analysis.gastoPorCategoria[cat] / this.analysis.totalGastos) * 100);
  }
}
