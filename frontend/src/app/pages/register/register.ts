import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs';

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
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)]],
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

    const { confirmPassword, name, lastName, ...userData } = this.registerForm.value;
    const fullName = `${name} ${lastName}`.trim();

    this.authService
      .register({ ...userData, name: fullName, passwordConfirm: confirmPassword })
      .pipe(
        // finalize garantiza que isLoading siempre se resetea
        finalize(() => { this.isLoading = false; })
      )
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            // Redirigir a login: el usuario debe iniciar sesión manualmente
            this.router.navigate(['/login']);
          } else {
            this.errorMessage = 'No se pudo completar el registro. Intente de nuevo.';
          }
        },
        error: (err: any) => {
          console.error('Error en registro:', err);
          if (err.name === 'TimeoutError') {
            this.errorMessage = 'El servidor tardó demasiado en responder. ¿Está el backend encendido?';
          } else if (err.status === 0) {
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
