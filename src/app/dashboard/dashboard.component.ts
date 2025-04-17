import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Map, marker, tileLayer } from 'leaflet';

interface Outage {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'resolved';
  media?: {
    type: 'image' | 'video';
    url: string;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('map') mapContainer!: ElementRef;
  map!: Map;
  
  totalOutages = 0;
  resolvedOutages = 0;
  pendingOutages = 0;
  totalUsers = 0;
  
  selectedOutage: Outage | null = null;
  outages: Outage[] = [];

  constructor() {}

  ngOnInit() {
    this.initializeMap();
    this.loadOutages();
  }

  private initializeMap() {
    this.map = new Map(this.mapContainer.nativeElement).setView([51.505, -0.09], 13);
    
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private loadOutages() {
    // TODO: Replace with actual API call
    this.outages = [
      {
        id: '1',
        title: 'Power Outage in Downtown',
        description: 'Major power outage affecting multiple buildings',
        location: { lat: 51.505, lng: -0.09 },
        status: 'pending',
        media: {
          type: 'image',
          url: 'assets/outage1.jpg'
        }
      }
      // Add more sample outages as needed
    ];

    this.updateStatistics();
    this.addOutageMarkers();
  }

  private updateStatistics() {
    this.totalOutages = this.outages.length;
    this.resolvedOutages = this.outages.filter(o => o.status === 'resolved').length;
    this.pendingOutages = this.outages.filter(o => o.status === 'pending').length;
    // TODO: Add actual user count from API
    this.totalUsers = 100;
  }

  private addOutageMarkers() {
    this.outages.forEach(outage => {
      const markerInstance = marker([outage.location.lat, outage.location.lng])
        .addTo(this.map)
        .bindPopup(outage.title)
        .on('click', () => this.showOutageDetails(outage));
    });
  }

  showOutageDetails(outage: Outage) {
    this.selectedOutage = outage;
  }

  closeModal() {
    this.selectedOutage = null;
  }
}
