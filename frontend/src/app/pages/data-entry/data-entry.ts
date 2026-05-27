import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceService, FinanceRecord } from '../../core/services/finance.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-entry',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule, CommonModule],
  templateUrl: './data-entry.html',
  styleUrl: './data-entry.css'
})
export class DataEntry implements OnInit {
  financeForm: FormGroup;
  recentRecords: FinanceRecord[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    public financeService: FinanceService
  ) {
    this.financeForm = this.fb.group({
      tipo: ['ingreso', Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      categoria: ['', Validators.required],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.loadRecentRecords();
  }

  loadRecentRecords(): void {
    this.isLoading = true;
    this.financeService.getFinances(1, 10).subscribe({
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
  }

  onSubmit(): void {
    if (this.financeForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.financeForm.value;
    
    // Ensure monto is a number
    formData.monto = Number(formData.monto);

    this.financeService.createFinance(formData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.success) {
          this.successMessage = 'Registro guardado exitosamente';
          this.financeForm.reset({
            tipo: 'ingreso',
            fecha: new Date().toISOString().substring(0, 10),
            categoria: '',
            monto: '',
            descripcion: ''
          });
          // Reload the table
          this.loadRecentRecords();

          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Error al guardar el registro';
      }
    });
  }

  setTipo(tipo: 'ingreso' | 'gasto'): void {
    this.financeForm.patchValue({ tipo });
    // Reset category when type changes as they are conceptually different
    this.financeForm.patchValue({ categoria: '' });
  }
}
