import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ReportService } from '../../services/report.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-report-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    DatePipe
  ],
  templateUrl: './report-details-dialog.component.html',
  styleUrls: ['./report-details-dialog.component.scss']
})
export class ReportDetailsDialogComponent {
close() {
throw new Error('Method not implemented.');
}
updateStatus() {
throw new Error('Method not implemented.');
}
  selectedStatus: string;
  resolutionNotes: string = '';
  statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ReportDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public report: any,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {
    this.selectedStatus = report.status;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    

    this.reportService.updateReportStatus(this.report.id, this.selectedStatus, ).subscribe({
      next: () => {
        this.snackBar.open('Report updated successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.snackBar.open('Error updating report', 'Close', { duration: 3000 });
      }
    });
  }
} 