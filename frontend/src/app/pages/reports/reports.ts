import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { FinanceService, FinanceRecord } from '../../core/services/finance.service';
declare var Chart: any;

interface MonthData {
  nombre: string;
  ingresos: number;
  gastos: number;
  ahorros: number;
  balance: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit, AfterViewInit {
  hasData = false;
  userName = 'Usuario';
  
  totalIngresos = 0;
  totalGastos = 0;
  balance = 0;

  desgloseMensual: MonthData[] = [];
  selectedYear = 2026;

  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef;
  monthlyChartInstance: any = null;

  constructor(
    private authService: AuthService,
    private financeService: FinanceService
  ) {}

  ngOnInit() {
    this.userName = this.authService.getUserName();
    this.authService.getMe().subscribe({
      next: () => {
        this.userName = this.authService.getUserName();
      },
      error: () => {}
    });
    this.loadData();
  }

  ngAfterViewInit() {
    // La gráfica se renderizará una vez se carguen los datos
  }

  loadData(): void {
    this.financeService.getFinances(1, 1000).subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data.length > 0) {
          this.processRecords(res.data);
        } else {
          this.hasData = false;
        }
      },
      error: () => {
        this.hasData = false;
      }
    });
  }

  processRecords(records: FinanceRecord[]): void {
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Inicializar desglose por meses
    const mesesMap: { [key: number]: MonthData } = {};
    for (let i = 0; i < 12; i++) {
      mesesMap[i] = {
        nombre: nombresMeses[i],
        ingresos: 0,
        gastos: 0,
        ahorros: 0,
        balance: 0
      };
    }

    let recordsFiltrados = 0;
    this.totalIngresos = 0;
    this.totalGastos = 0;

    records.forEach(r => {
      const fecha = new Date(r.fecha);
      // Validar año
      if (fecha.getFullYear() === this.selectedYear) {
        recordsFiltrados++;
        const mesIndex = fecha.getMonth();
        const monto = Number(r.monto);

        if (r.tipo === 'ingreso') {
          mesesMap[mesIndex].ingresos += monto;
          this.totalIngresos += monto;
        } else if (r.tipo === 'gasto') {
          mesesMap[mesIndex].gastos += monto;
          this.totalGastos += monto;
        }
      }
    });

    if (recordsFiltrados > 0) {
      this.hasData = true;
      this.balance = this.totalIngresos - this.totalGastos;

      // Calcular balances y ahorros para cada mes
      this.desgloseMensual = [];
      for (let i = 0; i < 12; i++) {
        const m = mesesMap[i];
        m.balance = m.ingresos - m.gastos;
        m.ahorros = Math.max(0, m.balance); // Ahorro neto estimado del mes
        
        // Solo agregar meses que tengan algún movimiento para no llenar la tabla de ceros,
        // o si es menor que el mes actual para dar contexto.
        const mesActual = new Date().getMonth();
        if (m.ingresos > 0 || m.gastos > 0 || i <= mesActual) {
          this.desgloseMensual.push(m);
        }
      }

      // Renderizar gráfica
      setTimeout(() => this.renderChart(mesesMap), 150);
    } else {
      this.hasData = false;
    }
  }

  onYearChange(event: any): void {
    const year = Number(event.target.value);
    if (year) {
      this.selectedYear = year;
      this.loadData();
    }
  }

  renderChart(mesesMap: { [key: number]: MonthData }) {
    if (!this.monthlyChartRef || !this.monthlyChartRef.nativeElement) return;
    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    
    if (this.monthlyChartInstance) {
      this.monthlyChartInstance.destroy();
    }

    const mesesConDatos = Object.values(mesesMap);
    const labels = mesesConDatos.map(m => m.nombre);
    const ingresosData = mesesConDatos.map(m => m.ingresos);
    const gastosData = mesesConDatos.map(m => m.gastos);

    this.monthlyChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresosData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 4
          },
          {
            label: 'Gastos',
            data: gastosData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Outfit' } }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { 
              color: 'rgba(255, 255, 255, 0.5)', 
              font: { family: 'Outfit' },
              callback: (value: any) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Outfit' } }
          }
        }
      }
    });
  }
}
