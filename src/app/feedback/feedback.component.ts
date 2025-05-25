import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FeedbackService, UserFeedback } from '../services/feedback.service';
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
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DialogComponent,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit {
  feedback: UserFeedback[] = [];
  filteredFeedback = new MatTableDataSource<UserFeedback>([]);
  isLoading = false;
  searchTerm = '';
  selectedStatus = '';
  selectedFeedback: UserFeedback | null = null;
  responseText = '';

  dialogConfig: DialogConfig = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK'
  };

  statusOptions = [
    { value: '', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' }
  ];

  displayedColumns = ['userName', 'subject', 'status', 'createdAt', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  ngAfterViewInit() {
    this.filteredFeedback.paginator = this.paginator;
    this.filteredFeedback.sort = this.sort;

    this.filteredFeedback.filterPredicate = (data: UserFeedback, filter: string) => {
      const searchTerms = JSON.parse(filter);
      const searchTerm = searchTerms.searchTerm.toLowerCase();
      const selectedStatus = searchTerms.selectedStatus.toLowerCase();

      const matchesSearch = !searchTerm ||
        data.subject.toLowerCase().includes(searchTerm) ||
        data.message.toLowerCase().includes(searchTerm) ||
        data.userName.toLowerCase().includes(searchTerm);

      const matchesStatus = !selectedStatus || data.status.toLowerCase() === selectedStatus;

      return matchesSearch && matchesStatus;
    };

    this.filteredFeedback.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'userName': return item.userName;
        case 'createdAt': return new Date(item.createdAt);
        default: return (item as any)[property];
      }
    };
  }

  loadFeedback(): void {
    this.isLoading = true;
    this.feedbackService.getAllFeedback().subscribe({
      next: (feedback) => {
        this.feedback = feedback;
        this.filteredFeedback.data = feedback;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading feedback:', error);
        this.showDialog('Error', 'Failed to load feedback', 'error');
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const filterValue = {
      searchTerm: this.searchTerm,
      selectedStatus: this.selectedStatus
    };
    this.filteredFeedback.filter = JSON.stringify(filterValue);

    if (this.filteredFeedback.paginator) {
      this.filteredFeedback.paginator.firstPage();
    }
  }

  onStatusChange(): void {
    this.applyFilter();
  }

  onSearch(): void {
    this.applyFilter();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return '#ff9800';
      case 'IN_PROGRESS':
        return '#2196f3';
      case 'RESOLVED':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  }

  viewFeedbackDetails(feedback: UserFeedback): void {
    this.selectedFeedback = feedback;
    this.responseText = feedback.response || '';
  }

  closeModal(): void {
    this.selectedFeedback = null;
    this.responseText = '';
  }

  updateStatus(feedback: UserFeedback, newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'): void {
    this.feedbackService.updateFeedbackStatus(feedback.id, newStatus).subscribe({
      next: (updatedFeedback) => {
        const index = this.feedback.findIndex(f => f.id === feedback.id);
        if (index !== -1) {
          this.feedback[index] = updatedFeedback;
          this.applyFilter();
        }
        this.showDialog('Success', 'Status updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.showDialog('Error', 'Failed to update status', 'error');
      }
    });
  }

  submitResponse(): void {
    if (!this.selectedFeedback || !this.responseText.trim()) {
      this.showDialog('Error', 'Please enter a response', 'error');
      return;
    }

    this.feedbackService.respondToFeedback(this.selectedFeedback.id, this.responseText).subscribe({
      next: (updatedFeedback) => {
        const index = this.feedback.findIndex(f => f.id === this.selectedFeedback!.id);
        if (index !== -1) {
          this.feedback[index] = updatedFeedback;
          this.applyFilter();
        }
        this.showDialog('Success', 'Response submitted successfully', 'success');
        this.closeModal();
      },
      error: (error) => {
        console.error('Error submitting response:', error);
        this.showDialog('Error', 'Failed to submit response', 'error');
      }
    });
  }

  deleteFeedback(feedback: UserFeedback): void {
    this.showDialog(
      'Confirm Delete',
      'Are you sure you want to delete this feedback?',
      'confirm',
      'Delete',
      () => {
        this.feedbackService.deleteFeedback(feedback.id).subscribe({
          next: () => {
            this.feedback = this.feedback.filter(f => f.id !== feedback.id);
            this.applyFilter();
            this.showDialog('Success', 'Feedback deleted successfully', 'success');
          },
          error: (error) => {
            console.error('Error deleting feedback:', error);
            this.showDialog('Error', 'Failed to delete feedback', 'error');
          }
        });
      }
    );
  }

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