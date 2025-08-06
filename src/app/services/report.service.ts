import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map, catchError } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

export interface OutageReport {
  region: string;
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
phoneNumber: any;
    id: number;
    fullName: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = "http://localhost:8080/api"; 

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
  
    const body = { status }; // Send status in body
  
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

  // Generate report client-side
  async generateReport(
    outages: OutageReport[], 
    fromDate: string, 
    toDate: string, 
    format: string, 
    analytics?: {
    mostAffectedRegions: string[],
    mostFrequentTitles: string[]
  }
  ): Promise<void> {
    try {
      if (format === 'pdf') {
        this.generatePDF(outages, fromDate, toDate);
      } else if (format === 'excel') {
        await this.generateExcel(outages, fromDate, toDate);
      } else {
        throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report: ' + (error as Error).message);
    }
  }

  // Generate summary statistics
  private getMostFrequent(items: string[]): string {
  const frequency: Record<string, number> = {};
  items.forEach(item => {
    const normalized = item?.trim().toLowerCase() || 'unknown';
    frequency[normalized] = (frequency[normalized] || 0) + 1;
  });

  const maxItem = Object.entries(frequency).reduce((a, b) => a[1] >= b[1] ? a : b, ['', 0]);
  return `${this.capitalizeWords(maxItem[0])} (${maxItem[1]} reports)`;
}

private capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}


private generatePDF(outages: OutageReport[], fromDate: string, toDate: string): void {
  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Outage Report', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Date Range: ${fromDate} to ${toDate}`, 14, 30);
    
    // Table
    const tableColumn = ['Title', 'Location', 'Status', 'Reported At', 'Resolved At'];
    const tableRows = outages.map(outage => [
      outage.title,
      outage.locationName || 'N/A',
      outage.status,
      new Date(outage.reportedAt).toLocaleString(),
      outage.resolvedAt ? new Date(outage.resolvedAt).toLocaleString() : 'N/A'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;

    // Summaries
    const mostFrequentRegion = this.getMostFrequent(outages.map(o => o.region));
    const mostFrequentType = this.getMostFrequent(outages.map(o => o.title));

    doc.setFontSize(12);
    doc.text(`Total Outages: ${outages.length}`, 14, finalY + 20);
    doc.text(`Most Affected Region: ${mostFrequentRegion}`, 14, finalY + 30);
    doc.text(`Most Frequent Outage Type: ${mostFrequentType}`, 14, finalY + 40);

    // Save
    doc.save(`outage-report-${fromDate}-to-${toDate}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

  private async generateExcel(outages: OutageReport[], fromDate: string, toDate: string): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Outage Report');

    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Outage Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:I2');
    const dateRangeCell = worksheet.getCell('A2');
    dateRangeCell.value = `Date Range: ${fromDate} to ${toDate}`;
    dateRangeCell.font = { size: 12 };
    dateRangeCell.alignment = { horizontal: 'center' };

    worksheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Location', key: 'location', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Reported At', key: 'reportedAt', width: 20 },
      { header: 'Resolved At', key: 'resolvedAt', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Reporter', key: 'reporter', width: 25 },
      { header: 'Reporter Email', key: 'reporterEmail', width: 25 },
      { header: 'Reporter Phone', key: 'reporterPhone', width: 20 }
    ];

    worksheet.getRow(4).font = { bold: true };
    worksheet.getRow(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B82F6' }
    };
    worksheet.getRow(4).font = { color: { argb: 'FFFFFF' } };

    outages.forEach(outage => {
      worksheet.addRow({
        title: outage.title,
        location: outage.locationName || 'N/A',
        status: outage.status,
        reportedAt: new Date(outage.reportedAt).toLocaleString(),
        resolvedAt: outage.resolvedAt ? new Date(outage.resolvedAt).toLocaleString() : 'N/A',
        description: outage.description,
        reporter: outage.reporter.fullName,
        reporterEmail: outage.reporter.email,
        reporterPhone: outage.reporter.phoneNumber
      });
    });

    const lastRow = worksheet.lastRow!.number;

    // Summary section
    worksheet.mergeCells(`A${lastRow + 2}:I${lastRow + 2}`);
    worksheet.getCell(`A${lastRow + 2}`).value = `Total Outages: ${outages.length}`;
    worksheet.getCell(`A${lastRow + 2}`).font = { bold: true };
    worksheet.getCell(`A${lastRow + 2}`).alignment = { horizontal: 'center' };

    const mostFrequentRegion = this.getMostFrequent(outages.map(o => o.region));
    const mostFrequentType = this.getMostFrequent(outages.map(o => o.title));

    worksheet.mergeCells(`A${lastRow + 3}:I${lastRow + 3}`);
    worksheet.getCell(`A${lastRow + 3}`).value = `Most Affected Region: ${mostFrequentRegion}`;

    worksheet.mergeCells(`A${lastRow + 4}:I${lastRow + 4}`);
    worksheet.getCell(`A${lastRow + 4}`).value = `Most Frequent Outage Type: ${mostFrequentType}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `outage-report-${fromDate}-to-${toDate}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate Excel report');
  }
}

}
