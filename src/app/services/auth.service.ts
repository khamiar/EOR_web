// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface RegisterData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
  role: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // Replace with your actual backend URL

  constructor(private http: HttpClient) {
    this.clearExpiredToken();
  }

  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((response: AuthResponse) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  login(credentials: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/authenticate`, credentials).pipe(
      tap((response: AuthResponse) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  // Manual method to clear all auth data (useful for debugging)
  clearAllAuthData(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    console.log('All authentication data cleared');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      this.logout(); // Clear expired token
      return false;
    }
    
    return true;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      this.logout(); // Clear expired token
      return null;
    }
    
    return token;
  }

  private isTokenExpired(token: string): boolean {
    try {
      // Decode JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired (exp is in seconds)
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Treat invalid tokens as expired
    }
  }

  private clearExpiredToken(): void {
    const token = localStorage.getItem('token');
    if (token && this.isTokenExpired(token)) {
      console.log('Clearing expired token');
      localStorage.removeItem('token');
    }
  }
}