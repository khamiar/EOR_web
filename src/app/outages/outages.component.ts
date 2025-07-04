// outages.component.ts
import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReportService, OutageReport } from '../services/report.service'; // adjust the path
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { DialogComponent, DialogType } from '../shared/dialog/dialog.component';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const MATERIAL_MODULES = [
  MatTableModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatIconModule,
  MatButtonModule,
  MatPaginatorModule,
  MatSortModule,
  MatDialogModule,
  MatSnackBarModule
] as const;

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
    ReactiveFormsModule,
    HttpClientModule,
    ...MATERIAL_MODULES,
    DialogComponent
  ],
  templateUrl: './outages.component.html',
  styleUrls: ['./outages.component.css']
})
export class OutagesComponent implements OnInit, OnDestroy {
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
  displayedColumns = ['id', 'title', 'location', 'status', 'reportedAt', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  isMediaLoading: boolean = false;
  showStatusDialog: boolean = false;
  isStatusUpdateOpen: boolean = false;
  
  // Auto-refresh properties
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds
  isRefreshing = false;

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.loadOutages();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      if (!this.isRefreshing) {
        this.refreshData();
      }
    }, this.REFRESH_INTERVAL);
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  refreshData() {
    this.isRefreshing = true;
    this.loadOutages();
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
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

  openStatusUpdateDialog(outage: OutageReport) {
    this.selectedOutageForStatus = outage;
    this.showStatusDialog = true;
  }

  closeStatusDialog() {
    this.showStatusDialog = false;
    this.selectedOutageForStatus = null;
  }

  showStatusSelector(outage: OutageReport) {
    this.selectedOutageForStatus = outage;
  }

  toggleStatusUpdate() {
    this.isStatusUpdateOpen = !this.isStatusUpdateOpen;
  }

  updateOutageStatus(outageId: number | undefined, newStatus: string) {
    if (!outageId) return;

    this.reportService.updateReportStatus(outageId, newStatus).subscribe({
      next: (updatedOutage) => {
        // Update the outage in the data source
        const index = this.outages.findIndex(o => o.id === outageId);
        if (index !== -1) {
          this.outages[index] = updatedOutage;
          this.dataSource.data = [...this.outages];
        }
        
        // Show success message
        this.dialogConfig = {
          isOpen: true,
          title: 'Success',
          message: 'Outage status updated successfully',
          type: 'success',
          confirmText: 'OK'
        };

        // Close the status dialog
        this.closeStatusDialog();
      },
      error: (error) => {
        console.error('Error updating outage status:', error);
        this.dialogConfig = {
          isOpen: true,
          title: 'Error',
          message: 'Failed to update outage status. Please try again.',
          type: 'error',
          confirmText: 'OK'
        };
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

  async generateReport() {
    if (!this.fromDate || !this.toDate) {
      this.showDialog('Error', 'Please select both from and to dates', 'error');
      return;
    }

    // Validate date range
    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);
    
    if (from > to) {
      this.showDialog('Error', 'From date cannot be later than To date', 'error');
      return;
    }

    try {
    // Filter outages based on date range
    const filteredOutages = this.outages.filter(outage => {
      const reportedDate = new Date(outage.reportedAt);
      return reportedDate >= from && reportedDate <= to;
    });

    if (filteredOutages.length === 0) {
        this.showDialog('Warning', 'No outages found in the selected date range', 'info');
      return;
    }

      await this.reportService.generateReport(filteredOutages, this.fromDate, this.toDate, this.reportFormat);
      this.showDialog('Success', 'Report generated successfully', 'success');
    } catch (error) {
      console.error('Error generating report:', error);
      let errorMessage = error instanceof Error ? error.message : 'Failed to generate report. Please try again.';
      this.showDialog('Error', errorMessage, 'error');
    }
  }

  viewOutageDetails(outage: OutageReport) {
    this.selectedOutage = outage;
    this.isMediaLoading = true;
    // Force a reflow to ensure the animation works
    requestAnimationFrame(() => {
      const modal = document.querySelector('.modal');
      if (modal) {
        modal.classList.add('show');
      }
    });
  }

  closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
      modal.classList.remove('show');
      // Wait for animation to complete before removing the modal
      setTimeout(() => {
        this.selectedOutage = null;
      }, 300);
    } else {
      this.selectedOutage = null;
    }
  }

  // Add click outside listener to close selector
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.selectedOutageForStatus) {
      const statusContainer = document.querySelector('.status-container');
      if (statusContainer && !statusContainer.contains(event.target as Node)) {
        this.selectedOutageForStatus = null;
      }
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

  getMediaUrl(mediaUrl: string | undefined): string {
    if (!mediaUrl) return '';
    // If it's already a full URL, return as is
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }
    // Otherwise, construct the full URL with the backend base URL
    return `http://localhost:8080/api/media/${mediaUrl}`;
  }

  onMediaLoad(event: Event) {
    this.isMediaLoading = false;
  }

  onMediaError(event: Event) {
    this.isMediaLoading = false;
    console.error('Error loading media:', event);
    this.showDialog('Error', 'Failed to load media. Please try again.', 'error');
  }

  downloadMedia(url: string | undefined) {
    if (!url) return;
    
    const fullUrl = this.getMediaUrl(url);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = url.split('/').pop() || 'outage-media';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openMediaInNewTab(url: string | undefined) {
    if (!url) return;
    const fullUrl = this.getMediaUrl(url);
    window.open(fullUrl, '_blank');
  }
}
