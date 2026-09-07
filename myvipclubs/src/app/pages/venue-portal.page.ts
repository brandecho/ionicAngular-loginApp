import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';

@Component({
  selector: 'app-venue-portal',
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Venue Portal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        <div class="intro">
          <div class="crest"><ion-icon name="business-outline"></ion-icon></div>
          <h1>Select your venue</h1>
          <p>Sign in as a venue to see your VIP members, approve access requests, and welcome guests before they reach the door.</p>
        </div>

        @for (v of vip.allVenues(); track v.id) {
          <a class="venue" [routerLink]="['/venue-portal', v.id]">
            <span class="art">{{ v.image }}</span>
            <div class="body">
              <span class="name">{{ v.name }}</span>
              <span class="meta">{{ v.type }} · {{ v.neighborhood }}</span>
              <div class="stats">
                <span><ion-icon name="people-outline"></ion-icon> {{ vip.membersForVenue(v.id).length }} VIPs</span>
                @if (vip.pendingRequestsForVenue(v.id).length) {
                  <span class="pending"><ion-icon name="time-outline"></ion-icon> {{ vip.pendingRequestsForVenue(v.id).length }} requests</span>
                }
              </div>
            </div>
            <ion-icon class="go" name="chevron-forward-outline"></ion-icon>
          </a>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 8px 18px 28px; max-width: 620px; margin: 0 auto; }
      .intro { text-align: center; padding: 6px 0 20px; }
      .crest { width: 60px; height: 60px; margin: 0 auto 14px; border-radius: 16px; display: grid; place-items: center; background: var(--vip-gold-tint); border: 1px solid color-mix(in srgb, var(--vip-gold) 40%, transparent); }
      .crest ion-icon { font-size: 28px; color: var(--vip-gold); }
      .intro h1 { margin: 0; font-size: 24px; font-weight: 800; color: #fff; }
      .intro p { color: var(--vip-muted); font-size: 13.5px; margin: 8px auto 0; max-width: 400px; }

      .venue {
        display: flex; align-items: center; gap: 14px; text-decoration: none;
        background: var(--vip-surface); border: 1px solid var(--vip-border);
        border-radius: 18px; padding: 14px; margin-bottom: 12px;
      }
      .art { flex: 0 0 52px; height: 52px; border-radius: 13px; font-size: 28px; display: grid; place-items: center; background: var(--vip-surface-2); }
      .body { flex: 1; min-width: 0; }
      .name { display: block; color: #fff; font-weight: 700; font-size: 16px; }
      .meta { display: block; color: var(--vip-muted); font-size: 12.5px; margin-top: 1px; }
      .stats { display: flex; gap: 14px; margin-top: 7px; }
      .stats span { display: inline-flex; align-items: center; gap: 4px; color: var(--vip-muted); font-size: 12px; }
      .stats ion-icon { font-size: 14px; }
      .stats .pending { color: var(--vip-gold-soft); }
      .go { color: var(--vip-muted); font-size: 20px; }
    `,
  ],
})
export class VenuePortalPage {
  vip = inject(VipService);
}
