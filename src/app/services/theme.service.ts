import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<Theme>('light');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.setTheme(savedTheme);
    } else {
      // Check user's system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem('app-theme', theme);
    
    // Apply CSS custom properties for immediate theme switching
    this.applyCSSVariables(theme);
    
    console.log('Theme changed to:', theme);
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    this.setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  private applyCSSVariables(theme: Theme): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Dark theme variables
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-secondary', '#2d2d2d');
      root.style.setProperty('--bg-tertiary', '#3d3d3d');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b0b0');
      root.style.setProperty('--text-tertiary', '#888888');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--border-light', '#555555');
      root.style.setProperty('--accent-color', '#5dade2');
      root.style.setProperty('--accent-hover', '#85c1e9');
      root.style.setProperty('--success-color', '#58d68d');
      root.style.setProperty('--warning-color', '#f7dc6f');
      root.style.setProperty('--error-color', '#ec7063');
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--shadow-light', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)');
    } else {
      // Light theme variables
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8f9fa');
      root.style.setProperty('--bg-tertiary', '#e9ecef');
      root.style.setProperty('--text-primary', '#2c3e50');
      root.style.setProperty('--text-secondary', '#7f8c8d');
      root.style.setProperty('--text-tertiary', '#95a5a6');
      root.style.setProperty('--border-color', '#e9ecef');
      root.style.setProperty('--border-light', '#dee2e6');
      root.style.setProperty('--accent-color', '#3498db');
      root.style.setProperty('--accent-hover', '#2980b9');
      root.style.setProperty('--success-color', '#27ae60');
      root.style.setProperty('--warning-color', '#f39c12');
      root.style.setProperty('--error-color', '#e74c3c');
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--shadow-light', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)');
    }
  }

  // Method to listen for system theme changes
  watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const savedTheme = localStorage.getItem('app-theme');
      if (!savedTheme) {
        // Only auto-switch if user hasn't manually set a preference
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
} 