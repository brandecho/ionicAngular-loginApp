import { Component, Input, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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

type Step = 'select' | 'locating' | 'notifying' | 'notified';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [
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
          <ion-back-button defaultHref="/tabs/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Arrive</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        @if (step() === 'select') {
          <p class="lead">Which venue are you headed to?</p>
          @for (v of vip.favoriteVenues(); track v.id) {
            <button class="pick" (click)="start(v.id)">
              <span class="art">{{ v.image }}</span>
              <span class="txt">
                <span class="name">{{ v.name }}</span>
                <span class="dist"><ion-icon name="location-outline"></ion-icon> {{ v.distanceMiles }} mi away</span>
              </span>
              <ion-icon class="go" name="navigate-outline"></ion-icon>
            </button>
          }
        } @else {
          <div class="radar" [class.done]="step() === 'notified'">
            <div class="pulse"></div>
            <div class="pulse d2"></div>
            <div class="dot">
              <ion-icon [name]="step() === 'notified' ? 'checkmark-circle' : 'navigate-outline'"></ion-icon>
            </div>
          </div>

          <h2 class="status">
            @switch (step()) {
              @case ('locating') { Detecting your location… }
              @case ('notifying') { Alerting {{ venueName() }}… }
              @case ('notified') { {{ venueName() }} knows you’re here }
            }
          </h2>

          <div class="steps">
            <div class="s" [class.on]="reached('locating')">
              <ion-icon [name]="reached('locating') ? 'checkmark-circle' : 'location-outline'"></ion-icon>
              GPS confirms you’re {{ dist() }} mi away
            </div>
            <div class="s" [class.on]="reached('notifying')">
              <ion-icon [name]="reached('notifying') ? 'checkmark-circle' : 'notifications-outline'"></ion-icon>
              Push sent to the venue manager
            </div>
            <div class="s" [class.on]="reached('notified')">
              <ion-icon [name]="reached('notified') ? 'checkmark-circle' : 'sparkles-outline'"></ion-icon>
              Your table & your people are notified
            </div>
          </div>

          @if (step() === 'notified') {
            <div class="preview">
              <span class="ptag"><ion-icon name="notifications-outline"></ion-icon> What the manager just received</span>
              <div class="push">
                <div class="push-icon"><ion-icon name="diamond"></ion-icon></div>
                <div>
                  <strong>VIP inbound · {{ vip.currentTier().name }}</strong>
                  <p>{{ vip.member().firstName }} {{ vip.member().lastName }} is {{ dist() }} mi away (~{{ eta() }} min). Tap to view profile.</p>
                </div>
              </div>
              <button class="open" (click)="openManager()">
                <ion-icon name="eye-outline"></ion-icon>
                Open the manager’s view
              </button>
              <p class="note">This is the recognition link the venue opens so they can greet you by name.</p>
            </div>
          }
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 14px 18px 28px; max-width: 560px; margin: 0 auto; text-align: center; }
      .lead { color: var(--vip-muted); text-align: left; margin: 6px 2px 16px; }
      .pick {
        width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; cursor: pointer;
        background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px; padding: 14px; margin-bottom: 12px;
      }
      .art { flex: 0 0 48px; height: 48px; border-radius: 12px; font-size: 26px; display: grid; place-items: center; background: var(--vip-surface-2); }
      .txt { flex: 1; display: flex; flex-direction: column; }
      .name { color: #fff; font-weight: 700; font-size: 16px; }
      .dist { color: var(--vip-muted); font-size: 12px; display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; }
      .dist ion-icon { font-size: 13px; }
      .go { color: var(--vip-gold); font-size: 22px; }

      .radar { position: relative; width: 180px; height: 180px; margin: 30px auto 10px; display: grid; place-items: center; }
      .pulse { position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--vip-gold); opacity: 0; animation: ping 2s ease-out infinite; }
      .pulse.d2 { animation-delay: 1s; }
      .radar.done .pulse { animation: none; opacity: 0; }
      .dot {
        width: 92px; height: 92px; border-radius: 50%; display: grid; place-items: center;
        background: linear-gradient(160deg, #d4af37, #8f7220); box-shadow: 0 12px 40px rgba(212,175,55,0.4);
      }
      .dot ion-icon { font-size: 44px; color: #14131b; }
      @keyframes ping { 0% { transform: scale(0.5); opacity: 0.7; } 100% { transform: scale(1); opacity: 0; } }

      .status { color: #fff; font-size: 20px; font-weight: 800; margin: 8px 0 22px; }
      .steps { text-align: left; display: flex; flex-direction: column; gap: 12px; margin: 0 auto; max-width: 380px; }
      .s { display: flex; align-items: center; gap: 10px; color: var(--vip-muted); font-size: 14px; transition: color 0.3s; }
      .s.on { color: var(--vip-text); }
      .s ion-icon { font-size: 20px; color: var(--vip-muted); transition: color 0.3s; }
      .s.on ion-icon { color: #6fd18f; }

      .preview { margin-top: 26px; text-align: left; }
      .ptag { display: inline-flex; align-items: center; gap: 6px; color: var(--vip-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
      .push { display: flex; gap: 12px; background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px; padding: 14px; margin: 10px 0 16px; }
      .push-icon { flex: 0 0 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; background: var(--vip-gold-tint); }
      .push-icon ion-icon { color: var(--vip-gold); font-size: 20px; }
      .push strong { color: #fff; font-size: 14px; }
      .push p { color: var(--vip-muted); font-size: 13px; margin: 4px 0 0; }
      .open {
        width: 100%; border: none; cursor: pointer; border-radius: 14px; padding: 15px; font-weight: 800; font-size: 15px;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        background: linear-gradient(120deg, #d4af37, #a9861f); color: #14131b;
      }
      .open ion-icon { font-size: 19px; }
      .note { color: var(--vip-muted); font-size: 12px; text-align: center; margin-top: 10px; }
    `,
  ],
})
export class CheckinPage implements OnDestroy {
  vip = inject(VipService);
  private router = inject(Router);

  step = signal<Step>('select');
  private selectedVenueId = signal<string>('');
  private timers: ReturnType<typeof setTimeout>[] = [];

  // Bound from ?venue= query param via withComponentInputBinding.
  @Input() set venue(id: string | undefined) {
    if (id) {
      this.start(id);
    }
  }

  venueName = computed(() => this.vip.venueById(this.selectedVenueId())?.name ?? '');
  dist = computed(() => this.vip.venueById(this.selectedVenueId())?.distanceMiles ?? 0.3);
  eta = computed(() => this.vip.managerAlert()?.etaMinutes ?? 2);

  private order: Step[] = ['locating', 'notifying', 'notified'];
  reached(s: Step): boolean {
    return this.order.indexOf(this.step()) >= this.order.indexOf(s);
  }

  start(venueId: string): void {
    this.selectedVenueId.set(venueId);
    this.step.set('locating');
    this.timers.push(setTimeout(() => this.step.set('notifying'), 1400));
    this.timers.push(
      setTimeout(() => {
        this.vip.checkIn(venueId);
        this.step.set('notified');
      }, 2800),
    );
  }

  openManager(): void {
    this.router.navigate(['/manager', this.vip.member().id], {
      queryParams: { venue: this.selectedVenueId() },
    });
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }
}
