import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  showPassword = false;
  showConfirm = false;
  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirm() { this.showConfirm = !this.showConfirm; }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { confirmPassword, ...userData } = this.registerForm.value;

    this.authService.register({ ...userData, passwordConfirm: confirmPassword }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. ¿Está el backend encendido?';
        } else if (err.status === 429) {
          this.errorMessage = err.error?.message || 'Demasiados intentos. Intente más tarde.';
        } else if (err.status === 409) {
          this.errorMessage = err.error?.message || 'El correo ya está registrado.';
        } else {
          this.errorMessage = err.error?.message || 'Error al crear la cuenta. Intente de nuevo.';
        }
      }
    });
  }
}

