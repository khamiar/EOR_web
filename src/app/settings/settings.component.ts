import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeService, Theme } from '../services/theme.service';
import { MapSettingsService, MapSettings } from '../services/map-settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  private themeSubscription?: Subscription;
  private mapSubscription?: Subscription;
  
  settings = {
    theme: 'light' as Theme,
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    map: {
      defaultZoom: 10,
      defaultCenter: {
        lat: -5.6,    // Centered between Unguja and Pemba islands
        lng: 39.5     // Zanzibar archipelago center
      }
    }
  };

  constructor(
    private themeService: ThemeService,
    private mapSettingsService: MapSettingsService
  ) {}

  ngOnInit() {
    // Subscribe to theme changes from the global service
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.settings.theme = theme;
    });

    // Subscribe to map settings changes
    this.mapSubscription = this.mapSettingsService.mapSettings$.subscribe(mapSettings => {
      this.settings.map = { ...mapSettings };
    });

    // Load other settings from localStorage
    this.loadSettings();
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }

  setTheme(theme: Theme) {
    // Use the global theme service to change theme for entire app
    this.themeService.setTheme(theme);
    console.log('Theme changed to:', theme);
  }

  resetMapSettings() {
    // Reset map settings to defaults
    this.mapSettingsService.resetToDefaults();
    console.log('Map settings reset to defaults');
  }

  private loadSettings() {
    // Load other settings (notifications only) from localStorage
    // Map settings are handled by MapSettingsService
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.notifications) {
          this.settings.notifications = { ...this.settings.notifications, ...parsed.notifications };
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }

  saveSettings() {
    // Save map settings to the map settings service
    this.mapSettingsService.updateSettings(this.settings.map);
    
    // Save other settings except theme (theme is handled by ThemeService)
    const settingsToSave = {
      notifications: this.settings.notifications
    };
    
    localStorage.setItem('app-settings', JSON.stringify(settingsToSave));
    console.log('Settings saved:', settingsToSave);
    console.log('Map settings saved:', this.settings.map);
    
    // Show success message
    this.showSuccessMessage();
  }

  private showSuccessMessage() {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
      ">
        <span class="material-icons" style="font-size: 20px;">check_circle</span>
        Settings saved successfully!
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
} 