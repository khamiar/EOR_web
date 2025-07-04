import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AnnouncementService } from '../services/announcement.service';
import { Announcement } from '../models/announcement.model';
import { AnnouncementDialogComponent } from './components/announcement-dialog/announcement-dialog.component';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss']
})
export class AnnouncementsComponent implements OnInit {
  announcements: Announcement[] = [];
  dataSource: MatTableDataSource<Announcement>;
  displayedColumns: string[] = ['title', 'category', 'postedBy', 'status', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private announcementService: AnnouncementService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Announcement>();
  }

  ngOnInit() {
    this.loadAnnouncements();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadAnnouncements() {
    console.log('Loading announcements...');
    console.log('Token in localStorage:', localStorage.getItem('token'));
    
    this.announcementService.getAll().subscribe({
      next: (data) => {
        console.log('Announcements loaded successfully:', data);
        this.announcements = data;
        this.dataSource.data = data;
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.snackBar.open('Error loading announcements', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  openAnnouncementDialog(announcement?: Announcement) {
    const dialogRef = this.dialog.open(AnnouncementDialogComponent, {
      width: '800px',
      data: announcement
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.id) {
          // Update existing announcement
          this.announcementService.update(result.id, result).subscribe({
            next: () => {
              this.loadAnnouncements();
              this.snackBar.open('Announcement updated successfully', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom'
              });
            },
            error: (error) => {
              console.error('Error updating announcement:', error);
              this.snackBar.open('Error updating announcement', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom'
              });
            }
          });
        } else {
          // Create new announcement
          this.announcementService.create(result).subscribe({
            next: () => {
              this.loadAnnouncements();
              this.snackBar.open('Announcement created successfully', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom'
              });
            },
            error: (error) => {
              console.error('Error creating announcement:', error);
              this.snackBar.open('Error creating announcement', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom'
              });
            }
          });
        }
      }
    });
  }

  deleteAnnouncement(id: number) {
    if (confirm('Are you sure you want to delete this announcement?')) {
      this.announcementService.delete(id).subscribe({
        next: () => {
          this.loadAnnouncements();
          this.snackBar.open('Announcement deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        },
        error: (error) => {
          console.error('Error deleting announcement:', error);
          this.snackBar.open('Error deleting announcement', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openDialog(announcement?: any) {
    this.dialog.open(AnnouncementDialogComponent, {
      width: '600px',
      data: announcement
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadAnnouncements();
      }
    });
  }
}