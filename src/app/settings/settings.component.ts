import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  settings = {
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    map: {
      defaultZoom: 12,
      defaultCenter: {
        lat: 51.505,
        lng: -0.09
      }
    },
    theme: 'light'
  };

  saveSettings() {
    // TODO: Implement settings save logic
    console.log('Settings saved:', this.settings);
  }
} 