import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  step: 'email' | 'otp' | 'reset' = 'email';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: [''],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  // Step 1: Request OTP
  requestReset() {
    if (this.forgotPasswordForm.get('email')?.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const email = this.forgotPasswordForm.get('email')?.value;

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 'otp';
        this.successMessage = 'OTP sent to your email.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to send OTP.';
      }
    });
  }

  // Step 2: Verify OTP
  verifyOtp() {
    if (this.forgotPasswordForm.get('otp')?.invalid) return;
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
    const email = this.forgotPasswordForm.get('email')?.value;
    const otp = this.forgotPasswordForm.get('otp')?.value;

    this.authService.verifyOtp(email, otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 'reset';
        this.successMessage = 'OTP verified. Please enter your new password.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid OTP.';
      }
    });
  }

  // Step 3: Reset Password
  resetPassword() {
    if (
      this.forgotPasswordForm.get('newPassword')?.invalid ||
      this.forgotPasswordForm.get('confirmPassword')?.invalid
    ) return;

    if (
      this.forgotPasswordForm.get('newPassword')?.value !==
      this.forgotPasswordForm.get('confirmPassword')?.value
    ) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const email = this.forgotPasswordForm.get('email')?.value;
    const otp = this.forgotPasswordForm.get('otp')?.value;
    const newPassword = this.forgotPasswordForm.get('newPassword')?.value;

    this.authService.resetPassword(email, otp, newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password reset successful. Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to reset password.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}