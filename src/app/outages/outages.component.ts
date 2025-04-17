import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-outages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outages.component.html',
  styleUrls: ['./outages.component.css']
})
export class OutagesComponent {
  outages = [
    {
      id: 1,
      title: 'Power Outage in Downtown',
      location: 'Main Street',
      status: 'pending',
      reportedAt: new Date(),
      description: 'Major power outage affecting multiple buildings'
    },
    {
      id: 2,
      title: 'Water Supply Issue',
      location: 'West District',
      status: 'resolved',
      reportedAt: new Date(),
      description: 'Water pressure drop in residential area'
    }
  ];
} 