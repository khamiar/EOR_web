import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit
} from '@angular/core';
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
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { FeedbackService, UserFeedback } from '../services/feedback.service';
import { DialogComponent, DialogType } from '../shared/dialog/dialog.component';
import { WebSocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';

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
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit, OnDestroy, AfterViewInit {
  feedback: UserFeedback[] = [];
  filteredFeedback = new MatTableDataSource<UserFeedback>([]);
  isLoading = false;
  searchTerm = '';
  selectedFeedback: UserFeedback | null = null;
  selectedStatus: string = '';
  displayedColumns = ['userName', 'subject', 'status', 'actions'];

  dialogConfig: DialogConfig = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK'
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private feedbackSub?: Subscription;

  constructor(
    private feedbackService: FeedbackService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFeedback();

    this.feedbackSub = this.ws.onFeedback().subscribe((feedback) => {
      const mapped = {
        ...feedback,
        userName: feedback.user?.fullName || 'Unknown User',
        userEmail: feedback.user?.email || 'Unknown Email'
      };
      this.feedback.unshift(mapped);
      this.filteredFeedback.data = this.feedback;

      this.attachPaginatorAndSort();

      this.snackbar.open(`📨 New feedback from ${mapped.userName}`, 'Close', {
        duration: 4000,
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });
    });
  }

  ngAfterViewInit(): void {
    this.attachPaginatorAndSort();

    this.filteredFeedback.filterPredicate = (data, filter) => {
      const term = filter.trim().toLowerCase();
      return data.subject.toLowerCase().includes(term) ||
        data.message.toLowerCase().includes(term) ||
        (data.userName?.toLowerCase().includes(term) ?? false);
    };

    this.filteredFeedback.sortingDataAccessor = (item, property) =>
      property === 'userName' ? item.userName : (item as any)[property];

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.feedbackSub?.unsubscribe();
  }

  private attachPaginatorAndSort(): void {
    this.filteredFeedback.paginator = this.paginator;
    this.filteredFeedback.sort = this.sort;
  }

  loadFeedback(): void {
    this.isLoading = true;
    this.feedbackService.getAllFeedback().subscribe({
      next: (feedback) => {
        this.feedback = feedback.map(f => ({
          ...f,
          userName: f.user?.fullName || 'Unknown User',
          userEmail: f.user?.email || 'Unknown Email'
        }));
        this.filteredFeedback.data = this.feedback;
        this.attachPaginatorAndSort();
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
    this.filteredFeedback.filter = this.searchTerm.trim().toLowerCase();
    if (this.filteredFeedback.paginator) this.filteredFeedback.paginator.firstPage();
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
      next: (updated) => {
        const index = this.feedback.findIndex(f => f.id === this.selectedFeedback!.id);
        if (index !== -1) {
          this.feedback[index] = {
            ...this.feedback[index],
            status: updated.status,
            response: updated.response,
            respondedAt: updated.respondedAt,
            respondedBy: updated.respondedBy
          };
          this.filteredFeedback.data = this.feedback;
          this.applyFilter();
        }
        this.showDialog('Success', 'Status updated successfully', 'success');
      },
      error: () => this.showDialog('Error', 'Failed to update status', 'error')
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
            this.filteredFeedback.data = this.feedback;
            this.applyFilter();
            this.showDialog('Success', 'Feedback deleted successfully', 'success');
          },
          error: () => this.showDialog('Error', 'Failed to delete feedback', 'error')
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
  ): void {
    this.dialogConfig = {
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      onConfirm
    };
  }

  onDialogClose(): void {
    this.dialogConfig.isOpen = false;
  }

  onDialogConfirm(): void {
    if (this.dialogConfig.onConfirm) this.dialogConfig.onConfirm();
    this.dialogConfig.isOpen = false;
  }

  onDialogCancel(): void {
    this.dialogConfig.isOpen = false;
  }
}
