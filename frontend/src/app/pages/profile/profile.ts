import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService, ThemePrefs } from '../../core/services/theme.service';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  theme: ThemePrefs = { primaryColor: '', background: '', fontSize: '' };

  constructor(private themeService: ThemeService) {
    const saved = this.themeService.getTheme();
    if (saved) this.theme = saved;
  }

  saveTheme(): void {
    this.themeService.saveTheme(this.theme);
  }
}
