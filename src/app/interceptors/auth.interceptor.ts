import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Don't add token to auth endpoints (login, register, etc.)
  const isAuthEndpoint = req.url.includes('/auth/');
  
  let request = req;
  
  if (!isAuthEndpoint) {
  const token = authService.getToken();

  if (token) {
      request = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    }
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle JWT expiration errors
      if (error.status === 401 || 
          (error.error?.message && error.error.message.includes('JWT expired'))) {
        console.log('JWT expired, logging out user');
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}; 