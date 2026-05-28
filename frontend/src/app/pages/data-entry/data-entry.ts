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
  editingRecordId: string | null = null;

  constructor(
    private fb: FormBuilder,
    public financeService: FinanceService
  ) {
    this.financeForm = this.fb.group({
      tipo: ['ingreso', Validators.required],
      monto: ['', Validators.required],
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

  formatCurrencyInput(event: any, controlName: string): void {
    let inputVal = event.target.value;
    // Remove non-digits
    const numericVal = inputVal.replace(/\D/g, '');
    
    let formatted = '';
    if (numericVal) {
      formatted = new Intl.NumberFormat('es-CO').format(Number(numericVal));
    }
    
    this.financeForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  editRecord(record: FinanceRecord): void {
    this.editingRecordId = record._id || null;
    
    let fechaStr = '';
    if (record.fecha) {
      fechaStr = new Date(record.fecha).toISOString().substring(0, 10);
    }

    const formattedMonto = new Intl.NumberFormat('es-CO').format(record.monto);

    this.financeForm.patchValue({
      tipo: record.tipo,
      monto: formattedMonto,
      categoria: record.categoria,
      fecha: fechaStr,
      descripcion: record.descripcion
    });
  }

  cancelEdit(): void {
    this.editingRecordId = null;
    this.financeForm.reset({
      tipo: 'ingreso',
      fecha: new Date().toISOString().substring(0, 10),
      categoria: '',
      monto: '',
      descripcion: ''
    });
  }

  deleteRecord(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este movimiento financiero?')) {
      this.financeService.deleteFinance(id).subscribe({
        next: (res: any) => {
          if (res.success) {
            if (this.editingRecordId === id) this.cancelEdit();
            this.loadRecentRecords();
          }
        },
        error: (err) => console.error('Error deleting record', err)
      });
    }
  }

  onSubmit(): void {
    if (this.financeForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const values = this.financeForm.value;
    
    const montoStr = String(values.monto).replace(/\D/g, '');
    const montoNum = Number(montoStr);
    if (isNaN(montoNum) || montoNum <= 0) {
      this.isSubmitting = false;
      this.errorMessage = 'Monto inválido';
      return;
    }

    const formData = {
      ...values,
      monto: montoNum
    };

    if (this.editingRecordId) {
      this.financeService.updateFinance(this.editingRecordId, formData).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res.success) {
            this.successMessage = 'Registro actualizado exitosamente';
            this.cancelEdit();
            this.loadRecentRecords();
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Error al actualizar el registro';
        }
      });
    } else {
      this.financeService.createFinance(formData).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res.success) {
            this.successMessage = 'Registro guardado exitosamente';
            
            // Actualización optimista de la UI (sin esperar a que recargue la BD)
            if (res.data) {
                this.recentRecords.unshift(res.data);
                if (this.recentRecords.length > 10) this.recentRecords.pop();
            }
            
            this.financeForm.reset({
              tipo: values.tipo,
              fecha: new Date().toISOString().substring(0, 10),
              categoria: '',
              monto: '',
              descripcion: ''
            });
            // Recargar silenciosamente en segundo plano
            this.financeService.getFinances(1, 10).subscribe((resp: any) => {
                if (resp.success) this.recentRecords = resp.data;
            });
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Error al guardar el registro';
        }
      });
    }
  }

  setTipo(tipo: 'ingreso' | 'gasto'): void {
    this.financeForm.patchValue({ tipo });
    this.financeForm.patchValue({ categoria: '' });
  }
}
