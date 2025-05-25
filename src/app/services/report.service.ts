import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map, catchError } from 'rxjs/operators';

export interface OutageReport {
  locationName: string;
  mediaUrl: string;
  id: number;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  reporter: {
    id: number;
    fullName: string;
    email: string;
  };
}
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = "http://localhost:8080/api"; // Replace with your actual backend URL;

  constructor(private http: HttpClient) { }

  // Get all reports
  getAllReports(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get(`${this.apiUrl}/outages`, { headers });
  }
  

  // Get report by ID
  getReportById(id: number): Observable<OutageReport> {
    return this.http.get<OutageReport>(`${this.apiUrl}/${id}`);
  }

  // Update report status
  // Inside ReportService
  updateReportStatus(id: number, status: string): Observable<OutageReport> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    const body = { status }; // ✅ Send status in body
  
    return this.http.put<OutageReport>(`${this.apiUrl}/outages/${id}/status`, body, { headers });
  }
  


  // Delete report
  deleteReport(id: number): Observable<void> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return new Observable(observer => {
        observer.error(new Error('Authentication token not found. Please log in again.'));
      });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.delete<void>(`${this.apiUrl}/outages/${id}`, { headers });
  }
  

  // Get reports by date range
  getReportsByDateRange(start: string, end: string): Observable<OutageReport[]> {
    return this.http.get<OutageReport[]>(`${this.apiUrl}/date-range`, {
      params: { start, end }
    });
  }

  // Search reports by location
  searchReportsByLocation(location: string): Observable<OutageReport[]> {
    return this.http.get<OutageReport[]>(`${this.apiUrl}/search`, {
      params: { location }
    });
  }

  // Generate report
  generateReport(fromDate: string, toDate: string, format: string): Observable<Blob> {
    const token = localStorage.getItem('token');
    if (!token) {
      return new Observable(observer => {
        observer.error(new Error('Authentication token not found. Please log in again.'));
      });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    console.log('Sending report generation request:', {
      fromDate,
      toDate,
      format,
      headers: headers.keys()
    });

    return this.http.get(`${this.apiUrl}/outages/generate`, {
      params: { fromDate, toDate, format },
      headers,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        console.log('Received response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers.keys(),
          body: response.body
        });

        if (!response.body) {
          throw new Error('No data received from server');
        }
        return response.body;
      }),
      catchError(error => {
        console.error('Error in report generation:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });

        if (error.status === 400) {
          throw new Error('Invalid date format or range. Please check your input.');
        } else if (error.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        } else if (error.status === 403) {
          throw new Error('You do not have permission to generate reports. Please contact your administrator.');
        } else if (error.status === 404) {
          throw new Error('No reports found for the selected date range. Please try a different date range.');
        } else if (error.status === 500) {
          throw new Error('Server error occurred while generating report. Please try again later.');
        } else {
          throw new Error('Failed to generate report: ' + (error.message || 'Unknown error occurred. Please try again.'));
        }
      })
    );
  }
}
