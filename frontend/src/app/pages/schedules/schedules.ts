import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SchedulesService, Schedule } from '../../core/services/schedules.service';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './schedules.html',
  styleUrl: './schedules.css'
})
export class Schedules implements OnInit {
  schedules: Schedule[] = [];
  form: FormGroup;
  isLoading = false;
  userName = 'Usuario';
  editingScheduleId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private schedulesService: SchedulesService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      monto: ['', Validators.required],
      frecuencia: ['mensual', Validators.required],
      fechaInicio: ['', Validators.required],
      activa: [true]
    });
  }

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.schedulesService.getAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.schedules = res.data;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
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
    
    this.form.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  editSchedule(schedule: Schedule): void {
    this.editingScheduleId = schedule._id || null;
    let fechaStr = '';
    if (schedule.fechaInicio) {
      fechaStr = new Date(schedule.fechaInicio).toISOString().substring(0, 10);
    }

    const formattedMonto = new Intl.NumberFormat('es-CO').format(schedule.monto);

    this.form.patchValue({
      titulo: schedule.titulo,
      monto: formattedMonto,
      frecuencia: schedule.frecuencia || 'mensual',
      fechaInicio: fechaStr,
      activa: schedule.activa !== false
    });
  }

  cancelEdit(): void {
    this.editingScheduleId = null;
    this.form.reset({ frecuencia: 'mensual', fechaInicio: '', activa: true });
  }

  create(): void {
    if (this.form.invalid) return;
    const values = this.form.value;
    
    const montoStr = String(values.monto).replace(/\./g, '');
    const montoNum = Number(montoStr);
    if (isNaN(montoNum) || montoNum <= 0) return;

    const data = {
      titulo: values.titulo,
      monto: montoNum,
      frecuencia: values.frecuencia,
      fechaInicio: values.fechaInicio,
      activa: values.activa
    };

    if (this.editingScheduleId) {
      this.schedulesService.update(this.editingScheduleId, data).subscribe({
        next: () => {
          this.cancelEdit();
          this.load();
        },
        error: (err) => console.error('Error al actualizar programación', err)
      });
    } else {
      this.schedulesService.create(data).subscribe({
        next: () => {
          this.form.reset({ frecuencia: 'mensual', fechaInicio: '', activa: true });
          this.load();
        },
        error: (err) => console.error('Error al crear programación', err)
      });
    }
  }

  deleteSchedule(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este pago programado?')) {
      this.schedulesService.delete(id).subscribe({
        next: () => {
          if (this.editingScheduleId === id) this.cancelEdit();
          this.load();
        },
        error: (err) => console.error('Error al eliminar programación', err)
      });
    }
  }

  executeSchedule(id: string): void {
    this.schedulesService.execute(id).subscribe({
      next: (res: any) => {
        alert('Pago programado ejecutado con éxito y registrado en tus movimientos.');
        this.load();
      },
      error: (err) => {
        console.error('Error al ejecutar pago', err);
        alert('Ocurrió un error al intentar registrar el pago programado.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
