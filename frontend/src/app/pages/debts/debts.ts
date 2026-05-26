import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DebtsService, Debt } from '../../core/services/debts.service';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './debts.html'
})
export class Debts implements OnInit {
  debts: Debt[] = [];
  form: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private debtsService: DebtsService) {
    this.form = this.fb.group({ acreedor: ['', Validators.required], principal: ['', [Validators.required, Validators.min(0.01)]] });
  }

  ngOnInit(): void { this.load(); }

  load(): void { this.isLoading = true; this.debtsService.getAll().subscribe({ next: (res: any) => { if (res.success) this.debts = res.data; this.isLoading = false; }, error: () => this.isLoading = false }); }

  create(): void { if (this.form.invalid) return; const data = { ...this.form.value, principal: Number(this.form.value.principal) }; this.debtsService.create(data).subscribe({ next: () => { this.form.reset(); this.load(); }, error: () => {} }); }
}
