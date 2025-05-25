import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService, User } from '../services/user.service';
import { HttpClientModule } from '@angular/common/http';
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
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    HttpClientModule,
    DialogComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns = ['fullname', 'email', 'phone', 'address', 'role', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  searchTerm = '';
  selectedUser: User | null = null;
  editingUser: Partial<User> | null = null;
  isEditing = false;

  // Dialog properties
  dialogConfig: DialogConfig = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK'
  };

  get totalUsers(): number {
    return this.users.length;
  }

  get adminCount(): number {
    return this.users.filter(user => user.role === 'ADMIN').length;
  }

  get regularUserCount(): number {
    return this.users.filter(user => user.role === 'USER').length;
  }

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'fullname': return item.fullName;
        case 'email': return item.email;
        case 'phone': return item.phoneNumber;
        case 'address': return item.address;
        case 'role': return item.role;
        default: return (item as any)[property];
      }
    };
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.dataSource.data = users;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.showDialog('Error', 'Failed to load users. Please try again.', 'error');
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewUserDetails(user: User) {
    this.selectedUser = user;
  }

  startEditing(user: User) {
    this.editingUser = { ...user };
    this.isEditing = true;
  }

  saveUserChanges() {
    if (this.editingUser && this.editingUser.id) {
      this.userService.updateUser(this.editingUser.id, this.editingUser).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
            this.dataSource.data = [...this.users];
          }
          this.isEditing = false;
          this.editingUser = null;
          this.showDialog('Success', 'User updated successfully', 'success');
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.showDialog('Error', 'Failed to update user. Please try again.', 'error');
        }
      });
    }
  }

  cancelEditing() {
    this.isEditing = false;
    this.editingUser = null;
  }

  deleteUser(id: number) {
    this.showDialog(
      'Confirm Delete',
      'Are you sure you want to delete this user? Their outage reports will be preserved in the system.',
      'confirm',
      'Delete',
      () => {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.users = this.users.filter(user => user.id !== id);
            this.dataSource.data = this.users;
            this.showDialog('Success', 'User deleted successfully. Their outage reports have been preserved.', 'success');
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.showDialog('Error', 'Failed to delete user. Please try again.', 'error');
          }
        });
      }
    );
  }

  closeModal() {
    this.selectedUser = null;
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