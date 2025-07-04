import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ReportService, OutageReport } from '../services/report.service';
import { ReportDetailsDialogComponent } from './report-details-dialog/report-details-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogComponent, DialogType } from '../shared/dialog/dialog.component';

interface DialogConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: DialogType;
  confirmText: string;
  onConfirm?: () => void;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DialogComponent
  ] as const,
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  dialogConfig: DialogConfig = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK'
  };

  reports: OutageReport[] = [];
  filteredReports: OutageReport[] = [];
  isLoading = false;
  searchTerm = '';
  selectedStatus = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  statusOptions = [
    { value: '', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  displayedColumns = ['title', 'location', 'status', 'reportedAt', 'actions'];
  selectedFormat: any;

  constructor(
    private reportService: ReportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.reportService.getAllReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.filteredReports = reports;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading reports', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onStatusChange(): void {
    this.filterReports();
  }

  onSearch(): void {
    this.filterReports();
  }

  onDateRangeChange(): void {
    this.filterReports();
  }

  filterReports(): void {
    this.filteredReports = this.reports.filter(report => {
      const matchesSearch = !this.searchTerm || 
        report.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || report.status === this.selectedStatus;
      
      const matchesDateRange = (!this.startDate || new Date(report.reportedAt) >= this.startDate) &&
        (!this.endDate || new Date(report.reportedAt) <= this.endDate);
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return '#ff9800';
      case 'IN_PROGRESS':
        return '#2196f3';
      case 'RESOLVED':
        return '#4caf50';
      case 'CANCELLED':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }

  openReportDetails(report: OutageReport): void {
    const dialogRef = this.dialog.open(ReportDetailsDialogComponent, {
      width: '600px',
      data: report
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadReports();
      }
    });
  }

  deleteReport(report: OutageReport): void {
    this.showDialog(
      'Confirm Delete',
      'Are you sure you want to delete this report?',
      'confirm',
      'Delete',
      () => {
        this.reportService.deleteReport(report.id).subscribe({
          next: () => {
            this.snackBar.open('Report deleted successfully', 'Close', { duration: 3000 });
            this.loadReports();
          },
          error: () => {
            this.snackBar.open('Error deleting report', 'Close', { duration: 3000 });
          }
        });
      }
    );
  }

  async generateReport() {
    if (!this.startDate || !this.endDate) {
      this.showDialog('Error', 'Please select both start and end dates.', 'error');
      return;
    }

    if (!this.selectedFormat) {
      this.showDialog('Error', 'Please select a report format.', 'error');
      return;
    }

    try {
    // Convert Date objects to ISO string format
    const startDateStr = this.startDate.toISOString().split('T')[0];
    const endDateStr = this.endDate.toISOString().split('T')[0];

      await this.reportService.generateReport(this.filteredReports, startDateStr, endDateStr, this.selectedFormat);
        this.showDialog('Success', 'Report generated successfully', 'success');
    } catch (error) {
        console.error('Error generating report:', error);
      let errorMessage = error instanceof Error ? error.message : 'Failed to generate report. Please try again.';
        this.showDialog('Error', errorMessage, 'error');
      }
  }

  // Dialog methods
  showDialog(
    title: string,
    message: string,
    type: DialogType = 'info',
    confirmText: string = 'OK',
    onConfirm?: () => void
  ) {
    this.dialogConfig = {
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      onConfirm
    };
  }

  onDialogClose() {
    this.dialogConfig.isOpen = false;
  }

  onDialogConfirm() {
    if (this.dialogConfig.onConfirm) {
      this.dialogConfig.onConfirm();
    }
    this.dialogConfig.isOpen = false;
  }

  onDialogCancel() {
    this.dialogConfig.isOpen = false;
  }
} 