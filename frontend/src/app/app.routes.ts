import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing').then(m => m.Landing) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.Profile), canActivate: [authGuard] },
  { path: 'savings', loadComponent: () => import('./pages/savings/savings').then(m => m.Savings), canActivate: [authGuard] },
  { path: 'debts', loadComponent: () => import('./pages/debts/debts').then(m => m.Debts), canActivate: [authGuard] },
  { path: 'schedules', loadComponent: () => import('./pages/schedules/schedules').then(m => m.Schedules), canActivate: [authGuard] },
  { path: 'reports', loadComponent: () => import('./pages/reports/reports').then(m => m.Reports), canActivate: [authGuard] },
  { path: 'data-entry', loadComponent: () => import('./pages/data-entry/data-entry').then(m => m.DataEntry), canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
