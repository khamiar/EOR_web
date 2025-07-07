import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client;
  private outageSubject = new Subject<any>();
  private feedbackSubject = new Subject<any>();
  private announcementSubject = new Subject<any>();
  private outageStatusSubject = new Subject<any>();
  private outageDeletedSubject = new Subject<any>();

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws')
    });
    this.client.onConnect = (frame) => {
      this.client.subscribe('/topic/outages', (msg: Message) => this.outageSubject.next(JSON.parse(msg.body)));
      this.client.subscribe('/topic/feedback', (msg: Message) => this.feedbackSubject.next(JSON.parse(msg.body)));
      this.client.subscribe('/topic/announcements', (msg: Message) => this.announcementSubject.next(JSON.parse(msg.body)));
      this.client.subscribe('/topic/outage-status', (msg: Message) => this.outageStatusSubject.next(JSON.parse(msg.body)));
      this.client.subscribe('/topic/outage-deleted', (msg: Message) => this.outageDeletedSubject.next(JSON.parse(msg.body)));
    };
    this.client.activate();
  }

  onOutage(): Observable<any> { return this.outageSubject.asObservable(); }
  onFeedback(): Observable<any> { return this.feedbackSubject.asObservable(); }
  onAnnouncement(): Observable<any> { return this.announcementSubject.asObservable(); }
  onOutageStatus(): Observable<any> { return this.outageStatusSubject.asObservable(); }
  onOutageDeleted(): Observable<any> { return this.outageDeletedSubject.asObservable(); }
} 