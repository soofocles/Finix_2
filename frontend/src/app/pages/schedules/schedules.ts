import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SchedulesService } from '../../core/services/schedules.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './schedules.html',
  styleUrl: './schedules.css'
})
export class Schedules implements OnInit {
  schedules: any[] = [];
  form: FormGroup;
  isLoading = false;
  userName = 'Usuario';

  constructor(
    private fb: FormBuilder,
    private schedulesService: SchedulesService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      frecuencia: ['mensual', Validators.required],
      fechaInicio: ['', Validators.required]
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

  create(): void {
    if (this.form.invalid) return;
    const data = { ...this.form.value, monto: Number(this.form.value.monto) };
    this.schedulesService.create(data).subscribe({
      next: () => {
        this.form.reset({ frecuencia: 'mensual', fechaInicio: '' });
        this.load();
      },
      error: () => {}
    });
  }

  deleteSchedule(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este pago programado?')) {
      this.schedulesService.delete(id).subscribe({
        next: () => this.load(),
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
}
