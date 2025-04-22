import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Map, marker, tileLayer } from 'leaflet';
import * as L from 'leaflet';



delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/dist/images/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/dist/images/marker-icon.png',
  shadowUrl: 'assets/leaflet/dist/images/marker-shadow.png',
});


interface Outage {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'resolved' | "inprogress";
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
  inprogressOutages= 0;
  // totalUsers = 0;
  
  selectedOutage: Outage | null = null;
  outages: Outage[] = [];
inprogress: any;

  constructor() {}
  

  ngOnInit() {
    // this.initializeMap();
    this.loadOutages();
  }

  ngAfterViewInit() {
    this.initializeMap(); // DOM is ready, ViewChild is set
  }

  private initializeMap() {
    this.map = L.map(this.mapContainer.nativeElement).setView([-6.1798, 39.3123], 8.5); // Center to SUZA
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.addOutageMarkers(); // Only call this after map is ready
  }

  private loadOutages() {
    // TODO: Replace with actual API call
    this.outages = [
      {
        id: '1',
        title: 'Power Outage in Paje',
        description: 'Major power outage affecting multiple buildings',
        location: { lat: -6.2707, lng: 39.5373 },
        status: 'pending',
        media: {
          type: 'image',
          url: 'assets/outage1.jpg'
        }
      },
      {
        id: '2',
        title: 'SUZA Campus Outage',
        description: 'Power outage reported at the SUZA main campus in Tunguu, Zanzibar.',
        location: { lat: -6.1798, lng: 39.3123 },
        status: 'resolved',
        media: {
          type: 'image',
          url: 'assets/suza_outage.jpg' // Make sure to have this image or update the path
        }
      },
      {
        id: '3',
        title: 'CHAKECHAKE  Outage',
        description: 'Power outage reported at the CHAKECHAKE Pemba, Zanzibar.',
        location: { lat: -5.2383, lng: 39.7667 },
        status: 'inprogress',
        media: {
          type: 'image',
          url: 'assets/suza_outage.jpg' // Make sure to have this image or update the path
        }
      }
    ];
    

    this.updateStatistics();
    this.addOutageMarkers();
  }

  private updateStatistics() {
    this.totalOutages = this.outages.length;
    this.resolvedOutages = this.outages.filter(o => o.status === 'resolved').length;
    this.pendingOutages = this.outages.filter(o => o.status === 'pending').length;
    this.inprogressOutages = this.outages.filter(o => o.status === 'inprogress').length;
    // TODO: Add actual user count from API
    // this.totalUsers = 100;
  }

  private addOutageMarkers() {
    if (!this.map) return;

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
