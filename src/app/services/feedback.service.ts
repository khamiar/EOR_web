import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserFeedback {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
  response?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/feedback`;

  constructor(private http: HttpClient) {}

  getAllFeedback(): Observable<UserFeedback[]> {
    return this.http.get<UserFeedback[]>(this.apiUrl);
  }

  getFeedbackById(id: number): Observable<UserFeedback> {
    return this.http.get<UserFeedback>(`${this.apiUrl}/${id}`);
  }

  updateFeedbackStatus(id: number, status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'): Observable<UserFeedback> {
    return this.http.patch<UserFeedback>(`${this.apiUrl}/${id}/status`, { status });
  }

  respondToFeedback(id: number, response: string): Observable<UserFeedback> {
    return this.http.post<UserFeedback>(`${this.apiUrl}/${id}/respond`, { response });
  }

  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 