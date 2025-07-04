import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserFeedback {
  id: number;
  subject: string;
  message: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  response?: string;
  createdAt: string;
  updatedAt?: string;
  respondedAt?: string;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
  respondedBy?: {
    id: number;
    fullName: string;
    email: string;
  };
  // Computed properties for display
  userName?: string;
  userEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/feedback`;

  constructor(private http: HttpClient) {}

  getAllFeedback(): Observable<UserFeedback[]> {
    return this.http.get<UserFeedback[]>(`${this.apiUrl}/all`);
  }

  getFeedbackById(id: number): Observable<UserFeedback> {
    return this.http.get<UserFeedback>(`${this.apiUrl}/${id}`);
  }

  updateFeedbackStatus(id: number, status: 'PENDING' | 'REVIEWED' | 'RESOLVED'): Observable<UserFeedback> {
    return this.http.put<UserFeedback>(`${this.apiUrl}/${id}/respond`, { 
      status: status,
      response: null 
    });
  }

  respondToFeedback(id: number, response: string): Observable<UserFeedback> {
    return this.http.put<UserFeedback>(`${this.apiUrl}/${id}/respond`, { 
      status: 'REVIEWED',
      response: response 
    });
  }

  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 