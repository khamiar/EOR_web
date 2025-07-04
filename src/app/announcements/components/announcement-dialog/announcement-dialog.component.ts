import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Announcement } from '../../../models/announcement.model';
import { AnnouncementService } from '../../../services/announcement.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService, User } from '../../../services/user.service';

@Component({
  selector: 'app-announcement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './announcement-dialog.component.html',
  styleUrls: ['./announcement-dialog.component.scss']
})
export class AnnouncementDialogComponent implements OnInit {
  form: FormGroup;
  categories = ['General', 'News', 'Event', 'Update', 'Other'];
  statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
  isUploading = false;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private announcementService: AnnouncementService,
    private snackBar: MatSnackBar,
    private router: Router,
    public dialogRef: MatDialogRef<AnnouncementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Announcement,
    private userService: UserService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      content: [''],
      category: ['', Validators.required],
      status: ['DRAFT', Validators.required],
      attachmentUrl: [''],
      publishDate: [null],
      sendNotification: [false],
      postedBy: ['', Validators.required],
      postedAt: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.form.patchValue(this.data);
    }
    this.userService.getCurrentUser().subscribe((user: User) => {
      this.form.patchValue({ postedBy: user.fullName });
    });
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        this.isUploading = true;
        let attachmentUrl = this.form.get('attachmentUrl')?.value;

        // Upload file if selected
        if (this.selectedFile) {
          console.log('Uploading file:', this.selectedFile.name);
          try {
            attachmentUrl = await this.announcementService.uploadFile(this.selectedFile).toPromise();
            console.log('File uploaded successfully:', attachmentUrl);
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            this.snackBar.open('File upload failed. Please try again.', 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            return;
          }
        }

        // Prepare form data with proper date formatting
        const formData = {
          ...this.form.value,
          attachmentUrl,
          publishDate: this.form.get('publishDate')?.value ? 
            new Date(this.form.get('publishDate')?.value + 'T00:00:00').toISOString() : null,
          postedAt: new Date().toISOString()
        };

        console.log('Submitting announcement:', formData);

        if (this.data?.id) {
          // Update existing announcement
          await this.announcementService.update(this.data.id, formData).toPromise();
        } else {
          // Create new announcement
          await this.announcementService.create(formData).toPromise();
        }

        this.snackBar.open('Announcement saved successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });

        this.dialogRef.close(true);
      } catch (error: any) {
        console.error('Error saving announcement:', error);
        
        if (error.status === 403) {
          this.snackBar.open('You do not have permission to perform this action', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        } else {
          this.snackBar.open('Error saving announcement. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      } finally {
        this.isUploading = false;
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.form.patchValue({ attachmentUrl: this.selectedFile.name });
    }
  }

  removeAttachment() {
    this.selectedFile = null;
    this.form.patchValue({ attachmentUrl: '' });
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    return '';
  }
} 