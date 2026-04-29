import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Profile } from './pages/profile/profile';
import { Reports } from './pages/reports/reports';
import { DataEntry } from './pages/data-entry/data-entry';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'reports', component: Reports, canActivate: [authGuard] },
  { path: 'data-entry', component: DataEntry, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];



