import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedbackService, UserFeedback } from '../services/feedback.service';
import { DialogComponent, DialogType } from '../shared/dialog/dialog.component';
import { WebSocketService } from '../services/websocket.service'; // adjust path as needed
import { Client, Message, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DialogComponent,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule
  ],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit, OnDestroy {
  feedback: UserFeedback[] = [];
  filteredFeedback = new MatTableDataSource<UserFeedback>([]);
  isLoading = false;
  searchTerm = '';
  selectedFeedback: UserFeedback | null = null;
  selectedStatus: string = '';

  dialogConfig: DialogConfig = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK'
  };

  displayedColumns = ['userName', 'subject', 'status', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private feedbackService: FeedbackService, private ws: WebSocketService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadFeedback();
    this.ws.onFeedback().subscribe((feedback) => {
      // Map the user data to flat properties for display
      const mappedFeedback = {
        ...feedback,
        userName: feedback.user?.fullName || 'Unknown User',
        userEmail: feedback.user?.email || 'Unknown Email'
      };
      
      // Add the new feedback to the top of the list and update the table
      this.feedback.unshift(mappedFeedback);
      this.filteredFeedback.data = this.feedback;
      if (this.paginator) this.filteredFeedback.paginator = this.paginator;
      if (this.sort) this.filteredFeedback.sort = this.sort;
    });
  }

  ngOnDestroy(): void {
    // No auto-refresh to stop
  }

  ngAfterViewInit() {
    if (this.paginator) this.filteredFeedback.paginator = this.paginator;
    if (this.sort) this.filteredFeedback.sort = this.sort;
    this.cdr.detectChanges();

    this.filteredFeedback.filterPredicate = (data: UserFeedback, filter: string) => {
      const searchTerm = filter.toLowerCase();

      if (!searchTerm) return true;

      return data.subject.toLowerCase().includes(searchTerm) ||
        data.message.toLowerCase().includes(searchTerm) ||
        (data.userName?.toLowerCase().includes(searchTerm) ?? false) ||
        (data.user?.fullName?.toLowerCase().includes(searchTerm) ?? false);
    };

    this.filteredFeedback.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'userName': return item.userName;
        default: return (item as any)[property];
      }
    };
  }

  loadFeedback(): void {
    this.isLoading = true;
    this.feedbackService.getAllFeedback().subscribe({
      next: (feedback) => {
        console.log('Raw feedback data:', feedback);
        // Map the nested user data to flat properties for display
        this.feedback = feedback.map(f => {
          console.log('Processing feedback:', f);
          console.log('User data:', f.user);
          return {
            ...f,
            userName: f.user?.fullName || 'Unknown User',
            userEmail: f.user?.email || 'Unknown Email'
          };
        });
        console.log('Mapped feedback:', this.feedback);
        this.filteredFeedback.data = this.feedback;
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
    this.filteredFeedback.filter = this.searchTerm;

    if (this.filteredFeedback.paginator) {
      this.filteredFeedback.paginator.firstPage();
    }
  }

  onSearch(): void {
    this.applyFilter();
  }

  viewFeedbackDetails(feedback: UserFeedback): void {
    this.selectedFeedback = feedback;
    this.selectedStatus = feedback.status;
  }

  closeModal(): void {
    this.selectedFeedback = null;
    this.selectedStatus = '';
  }

  updateFeedbackStatus(): void {
    if (!this.selectedFeedback) return;
    
    this.feedbackService.updateFeedbackStatus(this.selectedFeedback.id, this.selectedStatus as any).subscribe({
      next: (updatedFeedback) => {
        // Update the feedback in the list with complete data
        const index = this.feedback.findIndex(f => f.id === this.selectedFeedback!.id);
        if (index !== -1) {
          // Preserve existing user data and only update status-related fields
          this.feedback[index] = {
            ...this.feedback[index], // Keep existing user data
            status: updatedFeedback.status,
            response: updatedFeedback.response,
            respondedAt: updatedFeedback.respondedAt,
            respondedBy: updatedFeedback.respondedBy
          };
          this.filteredFeedback.data = this.feedback;
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

  deleteFeedback(feedback: UserFeedback): void {
    this.showDialog(
      'Confirm Delete',
      'Are you sure you want to delete this feedback?',
      'confirm',
      'Delete',
      () => {
        this.feedbackService.deleteFeedback(feedback.id).subscribe({
          next: () => {
            // Remove from the main array
            this.feedback = this.feedback.filter(f => f.id !== feedback.id);
            // Update the data source
            this.filteredFeedback.data = this.feedback;
            // Apply any existing filter
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