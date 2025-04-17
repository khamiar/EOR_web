import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  isSidebarOpen = true;
  menuItems = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      title: 'Outages',
      icon: 'warning',
      route: '/outages'
    },
    {
      title: 'Reports',
      icon: 'assessment',
      route: '/reports'
    },
    {
      title: 'Users',
      icon: 'people',
      route: '/users'
    },
    {
      title: 'Settings',
      icon: 'settings',
      route: '/settings'
    }
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
} 