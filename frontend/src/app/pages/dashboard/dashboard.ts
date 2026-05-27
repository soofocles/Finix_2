import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FinanceService, FinanceAnalysis, FinanceRecord } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import { SavingsService } from '../../core/services/savings.service';
import { DebtsService } from '../../core/services/debts.service';
import { SchedulesService } from '../../core/services/schedules.service';
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
          this.totalSavingsAmount = res.data.reduce((sum: number, item: any) => sum + (item.montoActual || 0), 0);
          this.totalSavingsTarget = res.data.reduce((sum: number, item: any) => sum + (item.montoObjetivo || 0), 0);
        }
      }
    });

    this.debtsService.getAll().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.totalDebtsAmount = res.data.reduce((sum: number, item: any) => sum + (item.saldo || 0), 0);
        }
      }
    });

    this.schedulesService.getAll().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.totalScheduledAmount = res.data
            .filter((item: any) => item.activa !== false)
            .reduce((sum: number, item: any) => sum + (item.monto || 0), 0);
        }
      }
    });
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
