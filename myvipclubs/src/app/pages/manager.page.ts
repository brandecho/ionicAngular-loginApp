import { Component, Input, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { TierBadgeComponent } from '../components/tier-badge.component';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CurrencyPipe, IonContent, IonIcon, TierBadgeComponent],
  template: `
    <ion-content [fullscreen]="true" class="mgr">
      <div class="page">
        <div class="topbar">
          <span class="brand"><ion-icon name="diamond"></ion-icon> My VIP Clubs</span>
          <span class="role">Venue view</span>
        </div>

        <div class="alert" [class.on]="!welcomed()">
          <ion-icon [name]="welcomed() ? 'checkmark-circle' : 'notifications-outline'"></ion-icon>
          {{ welcomed() ? 'Guest welcomed' : 'VIP arriving now' }}
        </div>

        <div class="card" [style.--tier-color]="vip.currentTier().color">
          <div class="who">
            <div class="photo">{{ vip.member().photo }}</div>
            <div class="id">
              <h1>{{ vip.member().firstName }} {{ vip.member().lastName }}</h1>
              <app-tier-badge [tier]="vip.currentTier()"></app-tier-badge>
            </div>
          </div>

          <div class="facts">
            <div class="fact">
              <span class="f-val">{{ vip.lifetimeValue() | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
              <span class="f-lab">Lifetime</span>
            </div>
            <div class="fact">
              <span class="f-val">{{ dist() }} mi</span>
              <span class="f-lab">Away</span>
            </div>
            <div class="fact">
              <span class="f-val">~{{ eta() }} min</span>
              <span class="f-lab">ETA</span>
            </div>
          </div>

          @if (venueName()) {
            <div class="arriving-at"><ion-icon name="location"></ion-icon> Arriving at {{ venueName() }}</div>
          }
        </div>

        <div class="section">How to take care of {{ vip.member().firstName }}</div>
        <div class="prefs">
          <div class="pref"><ion-icon name="wine-outline"></ion-icon><span><em>Go-to drink</em>{{ prefs().favoriteDrink }}</span></div>
          <div class="pref"><ion-icon name="sparkles-outline"></ion-icon><span><em>Celebration</em>{{ prefs().secondDrink }}</span></div>
          <div class="pref"><ion-icon name="flash-outline"></ion-icon><span><em>Spirit</em>{{ prefs().spirit }}</span></div>
          <div class="pref"><ion-icon name="restaurant-outline"></ion-icon><span><em>Seating</em>{{ prefs().seating }}</span></div>
          <div class="pref"><ion-icon name="musical-notes-outline"></ion-icon><span><em>Music</em>{{ prefs().music }}</span></div>
          <div class="pref warn"><ion-icon name="shield-checkmark-outline"></ion-icon><span><em>Allergies</em>{{ prefs().allergies }}</span></div>
          <div class="pref"><ion-icon name="gift-outline"></ion-icon><span><em>Occasion</em>{{ prefs().celebration }}</span></div>
          <div class="pref"><ion-icon name="ribbon-outline"></ion-icon><span><em>Notes</em>{{ prefs().notes }}</span></div>
        </div>

        @if (!welcomed()) {
          <button class="welcome" (click)="welcome()">
            <ion-icon name="checkmark-outline"></ion-icon>
            Welcome {{ vip.member().firstName }}
          </button>
        } @else {
          <div class="welcomed-box">
            <ion-icon name="checkmark-circle"></ion-icon>
            <div>
              <strong>{{ vip.member().firstName }} has been welcomed</strong>
              <p>The host, bar and floor have been notified. No line, no wait.</p>
            </div>
          </div>
        }

        <p class="foot">Recognition link · confidential to venue staff</p>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .mgr { --background: linear-gradient(180deg, #0c0c13, #08080d); }
      .page { padding: 18px; max-width: 560px; margin: 0 auto; }
      .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .brand { display: inline-flex; align-items: center; gap: 7px; color: var(--vip-gold); font-weight: 800; font-size: 15px; }
      .role { color: var(--vip-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }

      .alert {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        border-radius: 12px; padding: 10px; font-weight: 700; font-size: 14px; margin-bottom: 16px;
        background: rgba(111, 209, 143, 0.14); color: #6fd18f; border: 1px solid rgba(111, 209, 143, 0.4);
      }
      .alert.on { background: var(--vip-gold-tint); color: var(--vip-gold-soft); border-color: color-mix(in srgb, var(--vip-gold) 45%, transparent); animation: glow 1.8s ease-in-out infinite; }
      @keyframes glow { 0%,100% { box-shadow: 0 0 0 rgba(212,175,55,0); } 50% { box-shadow: 0 0 22px rgba(212,175,55,0.35); } }
      .alert ion-icon { font-size: 18px; }

      .card {
        border-radius: 22px; padding: 20px;
        background:
          radial-gradient(360px 150px at 100% 0%, color-mix(in srgb, var(--tier-color) 22%, transparent), transparent 70%),
          linear-gradient(160deg, #1d1c28, #131219);
        border: 1px solid color-mix(in srgb, var(--tier-color) 35%, var(--vip-border));
      }
      .who { display: flex; align-items: center; gap: 16px; }
      .photo { width: 68px; height: 68px; border-radius: 50%; display: grid; place-items: center; font-size: 34px; background: var(--vip-surface-2); border: 2px solid var(--tier-color); }
      .id h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #fff; }
      .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 18px; }
      .fact { background: rgba(255,255,255,0.04); border-radius: 12px; padding: 12px 8px; text-align: center; }
      .f-val { display: block; color: #fff; font-weight: 800; font-size: 16px; }
      .f-lab { display: block; color: var(--vip-muted); font-size: 11px; margin-top: 2px; }
      .arriving-at { margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; color: var(--vip-gold-soft); font-size: 13px; font-weight: 600; }
      .arriving-at ion-icon { font-size: 15px; }

      .section { color: var(--vip-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin: 22px 4px 12px; }
      .prefs { display: flex; flex-direction: column; gap: 2px; background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px; overflow: hidden; }
      .pref { display: flex; align-items: flex-start; gap: 12px; padding: 13px 16px; border-bottom: 1px solid var(--vip-border); }
      .pref:last-child { border-bottom: none; }
      .pref ion-icon { font-size: 20px; color: var(--vip-gold); margin-top: 1px; flex-shrink: 0; }
      .pref span { display: flex; flex-direction: column; color: #fff; font-size: 14px; }
      .pref em { color: var(--vip-muted); font-size: 11px; font-style: normal; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
      .pref.warn ion-icon { color: #ff8f8f; }

      .welcome {
        width: 100%; margin-top: 20px; border: none; cursor: pointer; border-radius: 16px; padding: 17px; font-weight: 800; font-size: 17px;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        background: linear-gradient(120deg, #d4af37, #a9861f); color: #14131b;
        box-shadow: 0 12px 34px rgba(212, 175, 55, 0.30);
      }
      .welcome ion-icon { font-size: 22px; }
      .welcomed-box { margin-top: 20px; display: flex; gap: 12px; align-items: center; background: rgba(111, 209, 143, 0.12); border: 1px solid rgba(111, 209, 143, 0.4); border-radius: 16px; padding: 16px; }
      .welcomed-box ion-icon { font-size: 30px; color: #6fd18f; }
      .welcomed-box strong { color: #fff; }
      .welcomed-box p { color: var(--vip-muted); font-size: 13px; margin: 3px 0 0; }
      .foot { text-align: center; color: var(--vip-muted); font-size: 11px; margin-top: 20px; }
    `,
  ],
})
export class ManagerPage {
  vip = inject(VipService);

  private venueId = signal<string>('');
  welcomed = signal(false);

  // member id from the route path (/manager/:id)
  @Input() id?: string;
  // venue from ?venue=
  @Input() set venue(v: string | undefined) {
    if (v) this.venueId.set(v);
  }

  prefs = computed(() => this.vip.member().preferences);
  venueName = computed(() => this.vip.venueById(this.venueId())?.name ?? this.vip.managerAlert()?.venueName ?? '');
  dist = computed(() => this.vip.venueById(this.venueId())?.distanceMiles ?? this.vip.managerAlert()?.distanceMiles ?? 0.3);
  eta = computed(() => this.vip.managerAlert()?.etaMinutes ?? Math.max(1, Math.round(this.dist() * 4)));

  welcome(): void {
    if (this.venueId()) this.vip.markWelcomed(this.venueId());
    this.welcomed.set(true);
  }
}
