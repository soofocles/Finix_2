import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SavingsService, SavingsGoal } from '../../core/services/savings.service';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './savings.html'
})
export class Savings implements OnInit {
  goals: SavingsGoal[] = [];
  form: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private savingsService: SavingsService) {
    this.form = this.fb.group({ titulo: ['', Validators.required], montoObjetivo: ['', [Validators.required, Validators.min(0.01)]], fechaObjetivo: [''] });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.savingsService.getAll().subscribe({ next: (res: any) => { if (res.success) this.goals = res.data; this.isLoading = false; }, error: () => this.isLoading = false });
  }

  create(): void {
    if (this.form.invalid) return;
    const data = { ...this.form.value, montoObjetivo: Number(this.form.value.montoObjetivo) };
    this.savingsService.create(data).subscribe({ next: () => { this.form.reset(); this.load(); }, error: () => {} });
  }
}
