import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Map as LeafletMap, marker, tileLayer } from 'leaflet';
import * as L from 'leaflet';
import { ReportService } from '../services/report.service.js';
import { MapSettingsService } from '../services/map-settings.service';
import { Subscription } from 'rxjs';



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
  locationName?: string;
  status: 'pending' | 'resolved' | 'inprogress';
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  reporter?: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  isRecent?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map') mapContainer!: ElementRef;
  map!: LeafletMap;
  
  totalOutages = 0;
  resolvedOutages = 0;
  pendingOutages = 0;
  inprogressOutages = 0;
  
  selectedOutage: Outage | null = null;
  outages: Outage[] = [];
  private locationCache = new Map<string, string>();
  private mapSettingsSubscription?: Subscription;

constructor(
  private reportService: ReportService,
  private mapSettingsService: MapSettingsService
) {}

  ngOnInit() {
    this.loadOutages();
  }

  ngAfterViewInit() {
    this.initializeMap();
    
    // Subscribe to map settings changes and update map accordingly
    this.mapSettingsSubscription = this.mapSettingsService.mapSettings$.subscribe(settings => {
      if (this.map) {
        this.map.setView([settings.defaultCenter.lat, settings.defaultCenter.lng], settings.defaultZoom);
      }
    });
  }

  ngOnDestroy() {
    if (this.mapSettingsSubscription) {
      this.mapSettingsSubscription.unsubscribe();
    }
  }

  private initializeMap() {
    const currentSettings = this.mapSettingsService.getCurrentSettings();
    this.map = L.map(this.mapContainer.nativeElement).setView(
      [currentSettings.defaultCenter.lat, currentSettings.defaultCenter.lng], 
      currentSettings.defaultZoom
    );
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.addOutageMarkers();
  }

  private loadOutages() {
    this.reportService.getAllReports().subscribe((reports) => {
      console.log('Reports:', reports);
      this.outages = reports.map((report: any) => ({
        id: report.id.toString(),
        title: report.title,
        description: report.description,
        location: {
          lat: report.latitude,
          lng: report.longitude
        },
        status: this.mapStatus(report.status),
        reportedAt: report.reportedAt,
        resolvedAt: report.resolvedAt,
        resolutionNotes: report.resolutionNotes,
        reporter: report.reporter,
        media: report.mediaUrl ? { type: 'image', url: report.mediaUrl } : undefined
      }));
  
      this.updateStatistics();
      this.addOutageMarkers();
      
      // Get location names for all outages
      this.outages.forEach(outage => {
        this.getLocationName(outage.location.lat, outage.location.lng);
      });
    });
  }

  private getLocationName(latitude: number, longitude: number): void {
    const cacheKey = `${latitude},${longitude}`;
    
    if (this.locationCache.has(cacheKey)) {
      const outage = this.outages.find(o => 
        o.location.lat === latitude && o.location.lng === longitude
      );
      if (outage) {
        outage.locationName = this.locationCache.get(cacheKey);
      }
      return;
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'EOReporter/1.0'
      }
    })
    .then(response => response.json())
    .then(data => {
      const locationName = data.display_name || 'Unknown Location';
      this.locationCache.set(cacheKey, locationName);
      
      const outage = this.outages.find(o => 
        o.location.lat === latitude && o.location.lng === longitude
      );
      if (outage) {
        outage.locationName = locationName;
      }
    })
    .catch(error => {
      console.error('Error getting location name:', error);
      this.locationCache.set(cacheKey, 'Location lookup failed');
    });
  }
  
  // Add a helper method to map the status string to the expected value
 private mapStatus(status: string): 'pending' | 'resolved' | 'inprogress' {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'pending';
    case 'IN_PROGRESS':
      return 'inprogress';
    case 'RESOLVED':
      return 'resolved';
    default:
      return 'pending';
  }
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
  
    // Remove all existing markers before adding new ones
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });
  
    // Filter outages to show pending and in-progress outages
    const activeOutages = this.outages.filter(outage => 
      outage.status === 'pending' || outage.status === 'inprogress'
    );

    activeOutages.forEach(outage => {
      const markerInstance = marker([outage.location.lat, outage.location.lng])
        .addTo(this.map)
        .bindPopup(outage.title)
        .on('click', () => this.showOutageDetails(outage));
    });
  }
  
  // Add a method to check if an outage is recent
  isRecentOutage(outage: Outage): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const reportedDate = new Date(outage.reportedAt);
    return reportedDate >= oneWeekAgo;
  }

  // Update the showOutageDetails method to include a "recent" indicator
  showOutageDetails(outage: Outage) {
    this.selectedOutage = {
      ...outage,
      isRecent: this.isRecentOutage(outage)
    };
  }

  closeModal() {
    this.selectedOutage = null;
  }
}
