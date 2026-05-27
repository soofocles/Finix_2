import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
declare var Chart: any;
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FinanceService, FinanceAnalysis, FinanceRecord } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import { SavingsService, SavingsGoal } from '../../core/services/savings.service';
import { DebtsService, Debt } from '../../core/services/debts.service';
import { SchedulesService, Schedule } from '../../core/services/schedules.service';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit {
  analysis: FinanceAnalysis = {
    totalIngresos: 0,
    totalGastos: 0,
    balance: 0
  };
  recentRecords: FinanceRecord[] = [];
  
  // Separate loading flags for ultra-fast, independent page loading
  isLoading = true; // global fallback
  isLoadingAnalysis = true;
  isLoadingRecords = true;
  isLoadingSavings = true;
  isLoadingDebts = true;
  isLoadingSchedules = true;

  hasData = false;
  userName = 'Usuario';

  @ViewChild('expenseChart') expenseChartRef!: ElementRef;
  @ViewChild('balanceChart') balanceChartRef!: ElementRef;
  expenseChartInstance: any = null;
  balanceChartInstance: any = null;

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
    private schedulesService: SchedulesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.loadData();
  }

  ngAfterViewInit() {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadData(): void {
    this.isLoading = true;
    this.isLoadingAnalysis = true;
    this.isLoadingRecords = true;
    this.isLoadingSavings = true;
    this.isLoadingDebts = true;
    this.isLoadingSchedules = true;

    // 1. Load Financial Analysis (KPIs + Charts)
    this.financeService.getAnalysis().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.analysis = {
            totalIngresos:       res.data.totalIngresos      ?? 0,
            totalGastos:         res.data.totalGastos        ?? 0,
            balance:             res.data.balance            ?? 0,
            categoriaMayorGasto: res.data.categoriaMayorGasto,
            gastoPorCategoria:   res.data.gastoPorCategoria
          };
          this.hasData = this.analysis.totalIngresos > 0 || this.analysis.totalGastos > 0;
          
          // Render charts immediately after DOM updates
          setTimeout(() => {
            this.renderExpenseChart();
            this.renderBalanceChart();
          }, 100);
        }
        this.isLoadingAnalysis = false;
        this.checkGlobalLoading();
      },
      error: () => {
        this.isLoadingAnalysis = false;
        this.checkGlobalLoading();
      }
    });

    // 2. Load Recent Records
    this.financeService.getFinances(1, 5).subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.recentRecords = res.data;
        }
        this.isLoadingRecords = false;
        this.checkGlobalLoading();
      },
      error: () => {
        this.isLoadingRecords = false;
        this.checkGlobalLoading();
      }
    });

    // 3. Load Savings
    this.savingsService.getAll().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.savingsGoals        = res.data.slice(0, 3);
          this.totalSavingsAmount  = res.data.reduce((s: number, i: any) => s + (i.montoActual  || 0), 0);
          this.totalSavingsTarget  = res.data.reduce((s: number, i: any) => s + (i.montoObjetivo || 0), 0);
        }
        this.isLoadingSavings = false;
        this.checkGlobalLoading();
      },
      error: () => {
        this.isLoadingSavings = false;
        this.checkGlobalLoading();
      }
    });

    // 4. Load Debts
    this.debtsService.getAll().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.debts            = res.data.slice(0, 3);
          this.totalDebtsAmount = res.data.reduce((s: number, i: any) => s + (i.saldo || 0), 0);
        }
        this.isLoadingDebts = false;
        this.checkGlobalLoading();
      },
      error: () => {
        this.isLoadingDebts = false;
        this.checkGlobalLoading();
      }
    });

    // 5. Load Scheduled Payments
    this.schedulesService.getAll().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.schedules             = res.data.slice(0, 3);
          this.totalScheduledAmount  = res.data
            .filter((i: any) => i.activa !== false)
            .reduce((s: number, i: any) => s + (i.monto || 0), 0);
        }
        this.isLoadingSchedules = false;
        this.checkGlobalLoading();
      },
      error: () => {
        this.isLoadingSchedules = false;
        this.checkGlobalLoading();
      }
    });
  }

  private checkGlobalLoading(): void {
    // If key financial analysis has loaded, we can unblock the global state
    if (!this.isLoadingAnalysis) {
      this.isLoading = false;
    }
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

  getCategoryKeys(): string[] {
    if (!this.analysis.gastoPorCategoria) return [];
    return Object.keys(this.analysis.gastoPorCategoria)
      .sort((a, b) => this.analysis.gastoPorCategoria![b] - this.analysis.gastoPorCategoria![a]);
  }

  getCategoryPercent(cat: string): number {
    if (!this.analysis.gastoPorCategoria || this.analysis.totalGastos === 0) return 0;
    return Math.round((this.analysis.gastoPorCategoria[cat] / this.analysis.totalGastos) * 100);
  }

  /** Returns a currency string or '—' when value is zero and no data has been entered */
  formatAmount(value: number): string {
    if (value === 0 && !this.hasAnyFinanceData()) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }

  hasAnyFinanceData(): boolean {
    return this.analysis.totalIngresos > 0 || this.analysis.totalGastos > 0;
  }

  get savingsRate(): string {
    if (this.analysis.totalIngresos === 0) return '—';
    return ((this.analysis.balance / this.analysis.totalIngresos) * 100).toFixed(0) + '%';
  }

  renderExpenseChart(): void {
    if (!this.expenseChartRef?.nativeElement) return;
    const ctx = this.expenseChartRef.nativeElement.getContext('2d');
    if (this.expenseChartInstance) { this.expenseChartInstance.destroy(); }

    const categories = this.getCategoryKeys();
    const data = categories.map(cat => this.analysis.gastoPorCategoria![cat]);
    if (categories.length === 0) return;

    this.expenseChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: data,
          backgroundColor: ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#64748b'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Outfit' } } },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            callbacks: {
              label: (c: any) => {
                let l = c.label ? c.label + ': ' : '';
                if (c.parsed !== null) l += new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(c.parsed);
                return l;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  renderBalanceChart(): void {
    if (!this.balanceChartRef?.nativeElement) return;
    const ctx = this.balanceChartRef.nativeElement.getContext('2d');
    if (this.balanceChartInstance) { this.balanceChartInstance.destroy(); }

    this.balanceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Ingresos', 'Gastos', 'Balance'],
        datasets: [{
          label: 'Monto',
          data: [this.analysis.totalIngresos, this.analysis.totalGastos, this.analysis.balance],
          backgroundColor: ['rgba(16,185,129,0.8)','rgba(239,68,68,0.8)','rgba(59,130,246,0.8)'],
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            callbacks: {
              label: (c: any) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(c.raw)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Outfit' } }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.7)', font: { family: 'Outfit', weight: '500' } }
          }
        }
      }
    });
  }
}
