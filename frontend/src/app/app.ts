import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.css'
})
export class App {
  title = 'Finix';
  constructor(private theme: ThemeService) {
    // Apply saved theme on app startup
    try { this.theme.applyTheme(); } catch (e) { /* ignore for SSR */ }
  }
}

