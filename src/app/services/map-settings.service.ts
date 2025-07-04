import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MapSettings {
  defaultZoom: number;
  defaultCenter: {
    lat: number;
    lng: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MapSettingsService {
  private defaultSettings: MapSettings = {
    defaultZoom: 10,
    defaultCenter: {
      lat: -5.6,    // Centered between Unguja and Pemba islands
      lng: 39.5     // Zanzibar archipelago center
    }
  };

  private mapSettingsSubject = new BehaviorSubject<MapSettings>(this.defaultSettings);
  public mapSettings$ = this.mapSettingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    const savedSettings = localStorage.getItem('app-map-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        this.mapSettingsSubject.next({
          ...this.defaultSettings,
          ...parsed
        });
      } catch (error) {
        console.error('Error loading map settings:', error);
        this.mapSettingsSubject.next(this.defaultSettings);
      }
    }
  }

  updateSettings(settings: MapSettings): void {
    // Validate settings
    const validatedSettings: MapSettings = {
      defaultZoom: Math.max(1, Math.min(20, settings.defaultZoom)),
      defaultCenter: {
        lat: Math.max(-90, Math.min(90, settings.defaultCenter.lat)),
        lng: Math.max(-180, Math.min(180, settings.defaultCenter.lng))
      }
    };

    this.mapSettingsSubject.next(validatedSettings);
    localStorage.setItem('app-map-settings', JSON.stringify(validatedSettings));
    console.log('Map settings updated:', validatedSettings);
  }

  getCurrentSettings(): MapSettings {
    return this.mapSettingsSubject.value;
  }

  resetToDefaults(): void {
    this.mapSettingsSubject.next(this.defaultSettings);
    localStorage.removeItem('app-map-settings');
  }
} 