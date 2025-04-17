import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  reports = [
    {
      id: 1,
      title: 'Monthly Outage Summary',
      type: 'summary',
      date: new Date(),
      status: 'completed'
    },
    {
      id: 2,
      title: 'Area-wise Analysis',
      type: 'analysis',
      date: new Date(),
      status: 'pending'
    }
  ];
} 