import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FinanceService, FinanceAnalysis, FinanceRecord } from '../../core/services/finance.service';
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
  userName = 'Usuario'; // To be updated when user profile is integrated

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadData();
    // In the future, fetch user profile to set this.userName
  }

  loadData(): void {
    this.isLoading = true;

    // Load Analysis
    this.financeService.getAnalysis().subscribe({
      next: (res) => {
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
      error: (err) => console.error('Error loading analysis', err)
    });

    // Load recent records
    this.financeService.getFinances(1, 5).subscribe({
      next: (res) => {
        if (res.success) {
          this.recentRecords = res.data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading records', err);
        this.isLoading = false;
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
