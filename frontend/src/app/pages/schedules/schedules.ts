import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SchedulesService } from '../../core/services/schedules.service';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './schedules.html'
})
export class Schedules implements OnInit {
  schedules: any[] = [];
  form: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private schedulesService: SchedulesService) {
    this.form = this.fb.group({ titulo: ['', Validators.required], monto: ['', [Validators.required, Validators.min(0.01)]], frecuencia: ['mensual', Validators.required], fechaInicio: ['', Validators.required] });
  }

  ngOnInit(): void { this.load(); }

  load(): void { this.isLoading = true; this.schedulesService.getAll().subscribe({ next: (res: any) => { if (res.success) this.schedules = res.data; this.isLoading = false; }, error: () => this.isLoading = false }); }

  create(): void { if (this.form.invalid) return; const data = { ...this.form.value, monto: Number(this.form.value.monto) }; this.schedulesService.create(data).subscribe({ next: () => { this.form.reset(); this.load(); }, error: () => {} }); }
}
