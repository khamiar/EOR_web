import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { map, catchError } from 'rxjs/operators';

export interface Announcement {
  id?: number;
  title: string;
  content?: string;
  category: string;
  attachmentUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishDate?: Date | string | null;
  postedBy?: string;
  postedAt: Date | string;
  updatedAt?: Date;
  sendNotification?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}/announcements`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getById(id: number): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/${id}`);
  }

  create(announcement: Announcement): Observable<Announcement> {
    return this.http.post<Announcement>(this.apiUrl, announcement);
  }

  update(id: number, announcement: Announcement): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.apiUrl}/${id}`, announcement);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByCategory(category: string): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/category/${category}`);
  }

  getByStatus(status: string): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/status/${status}`);
  }

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{filename: string, message: string}>(`${this.apiUrl}/upload`, formData)
      .pipe(
        map(response => response.filename)
      );
  }

  // // Get announcements by status
  // getAnnouncementsByStatus(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'): Observable<Announcement[]> {
  //   return this.http.get<Announcement[]>(`${this.apiUrl}/status/${status}`);
  // }

  // // Get scheduled announcements
  // getScheduledAnnouncements(): Observable<Announcement[]> {
  //   return this.http.get<Announcement[]>(`${this.apiUrl}/scheduled`);
  // }
} 