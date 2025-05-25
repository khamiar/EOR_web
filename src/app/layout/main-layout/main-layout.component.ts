import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { UserService, User } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    RouterOutlet, 
    MatIcon,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  isSidebarOpen = true;
  currentUser: User | null = null;
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
      title: 'Feedback',
      icon: 'feedback',
      route: '/feedback'
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
    },
    {
      title: 'logout',
      icon: 'logout',
      route: '/login'
    }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Failed to load current user:', error);
        // If unauthorized, redirect to login
        if (error.status === 401) {
          this.logout();
        }
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  viewProfile() {
    // Navigate to profile page or open profile modal
    // For now, we'll just show a console message
    console.log('View profile clicked');
  }
} 