// outages.component.ts
import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, OutageReport } from '../services/report.service'; // adjust the path
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { DialogComponent, DialogType } from '../shared/dialog/dialog.component';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface DialogConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: DialogType;
  confirmText: string;
  onConfirm?: () => void;
}

@Component({
  selector: 'app-outages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatIconModule,
    DialogComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './outages.component.html',
  styleUrls: ['./outages.component.css']
})
export class OutagesComponent implements OnInit {
  outages: OutageReport[] = [];
  fromDate: string = '';
  toDate: string = '';
  reportFormat: string = 'pdf';
  locationCache: Map<string, string> = new Map();
  selectedOutage: OutageReport | null = null;
  selectedOutageForStatus: OutageReport | null = null;
  dialogConfig: DialogConfig = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK'
  };
  
  // Add properly typed status array
  readonly statusOptions: Array<'PENDING' | 'IN_PROGRESS' | 'RESOLVED'> = [
    'PENDING',
    'IN_PROGRESS',
    'RESOLVED'
  ];

  dataSource = new MatTableDataSource<OutageReport>([]);
  displayedColumns = ['title', 'location', 'status', 'reportedAt', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.loadOutages();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'title': return item.title;
        case 'location': return item.locationName || '';
        case 'status': return item.status;
        case 'reportedAt': return new Date(item.reportedAt);
        default: return (item as any)[property];
      }
    };
  }

  loadOutages() {
    this.reportService.getAllReports().subscribe({
      next: (data) => {
        this.outages = data;
        this.dataSource.data = data;
        // Get location names for all outages
        this.outages.forEach(outage => {
          if (outage.latitude && outage.longitude) {
            this.getLocationName(outage.latitude, outage.longitude);
          }
        });
      },
      error: (error) => {
        console.error('Failed to load outages:', error);
      }
    });
  }

  getLocationName(latitude: number, longitude: number): string {
    const cacheKey = `${latitude},${longitude}`;
    
    // Check if we already have this location in cache
    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey) || 'Unknown Location';
    }

    // Use OpenStreetMap Nominatim API for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'EOReporter/1.0'
      }
    })
    .then(response => response.json())
    .then(data => {
      const locationName = data.display_name || 'Unknown Location';
      this.locationCache.set(cacheKey, locationName);
      
      // Update the outage with the location name
      const outage = this.outages.find(o => 
        o.latitude === latitude && o.longitude === longitude
      );
      if (outage) {
        outage.locationName = locationName;
      }
    })
    .catch(error => {
      console.error('Error getting location name:', error);
      this.locationCache.set(cacheKey, 'Location lookup failed');
    });

    return 'Loading location...';
  }

  toggleStatusDropdown(outage: OutageReport) {
    if (this.selectedOutageForStatus === outage) {
      this.selectedOutageForStatus = null;
    } else {
      this.selectedOutageForStatus = outage;
    }
  }

  updateOutageStatus(id: number, newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') {
    this.reportService.updateReportStatus(id, newStatus).subscribe({
      next: () => {
        // Update the status locally
        const outage = this.outages.find(o => o.id === id);
        if (outage) {
          outage.status = newStatus;
        }
        this.selectedOutageForStatus = null; // Close the dropdown
        this.showDialog('Success', 'Status updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.showDialog('Error', 'Failed to update status. Please try again.', 'error');
      }
    });
  }

  deleteOutage(id: number) {
    this.showDialog(
      'Confirm Delete',
      'Are you sure you want to delete this outage report? This action cannot be undone.',
      'confirm',
      'Delete',
      () => {
        this.reportService.deleteReport(id).subscribe({
          next: () => {
            this.outages = this.outages.filter(outage => outage.id !== id);
            this.showDialog('Success', 'Outage report deleted successfully', 'success');
          },
          error: (error) => {
            console.error('Error deleting outage report:', error);
            
            let errorMessage = 'Failed to delete outage report. Please try again.';
            if (error.status === 403) {
              errorMessage = 'You do not have permission to delete outage reports. Please contact your administrator.';
            } else if (error.message && error.message.includes('token')) {
              errorMessage = 'Your session has expired. Please log in again.';
            }
            
            this.showDialog('Error', errorMessage, 'error');
          }
        });
      }
    );
  }

  generateReport() {
    if (!this.fromDate || !this.toDate) {
      this.showDialog('Error', 'Please select both start and end dates.', 'error');
      return;
    }

    this.reportService.generateReport(this.fromDate, this.toDate, this.reportFormat).subscribe({
      next: (response) => {
        // Handle successful report generation
        this.showDialog('Success', 'Report generated successfully', 'success');
      },
      error: (error) => {
        console.error('Error generating report:', error);
        
        let errorMessage = error.error?.message;
        
        if (!errorMessage) {
          switch (error.status) {
            case 400:
              errorMessage = 'Invalid date format or range. Please check your input.';
              break;
            case 401:
              errorMessage = 'Your session has expired. Please log in again.';
              break;
            case 403:
              errorMessage = 'You do not have permission to generate reports. Please contact your administrator.';
              break;
            case 404:
              errorMessage = 'No reports found for the selected date range. Please try a different date range.';
              break;
            case 500:
              errorMessage = 'Server error occurred while generating report. Please try again later.';
              break;
            default:
              errorMessage = 'Failed to generate report. Please try again.';
          }
        }
        
        this.showDialog('Error', errorMessage, 'error');
      }
    });
  }

  viewOutageDetails(outage: OutageReport) {
    this.selectedOutage = outage;
  }

  closeModal() {
    this.selectedOutage = null;
  }

  // Add click outside handler to close dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-container')) {
      this.selectedOutageForStatus = null;
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
