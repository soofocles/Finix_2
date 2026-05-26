import { Injectable } from '@angular/core';

export interface ThemePrefs {
  primaryColor?: string;
  background?: string;
  fontSize?: string;
}

const STORAGE_KEY = 'finix_theme_prefs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor() {}

  saveTheme(prefs: ThemePrefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    this.applyTheme(prefs);
  }

  getTheme(): ThemePrefs | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  applyTheme(prefs?: ThemePrefs) {
    const p = prefs || this.getTheme();
    if (!p) return;
    const root = document.documentElement;
    if (p.primaryColor) root.style.setProperty('--finix-primary', p.primaryColor);
    if (p.background) root.style.setProperty('--finix-background', p.background);
    if (p.fontSize) root.style.setProperty('--finix-font-size', p.fontSize);
  }
}
