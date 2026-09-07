import { Component, Input, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { AccountService } from '../accounts/account.service';
import { VipService } from '../vip.service';

@Component({
  selector: 'app-staff-status',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>My status</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        @if (membership(); as m) {
          <div class="card" [attr.data-s]="m.status">
            <div class="badge">
              <ion-icon [name]="icon()"></ion-icon>
            </div>
            <h1>{{ title() }}</h1>
            <p class="sub">{{ m.role }} · {{ venueName() }}</p>
            <p class="msg">{{ message() }}</p>
          </div>

          <div class="line"><span>Venue</span><b>{{ venueName() }}</b></div>
          <div class="line"><span>Role</span><b>{{ m.role }}</b></div>
          <div class="line"><span>Status</span><b class="s" [attr.data-s]="m.status">{{ m.status }}</b></div>

          @if (m.status === 'approved') {
            <ion-button expand="block" class="cta" (click)="openVenue(m.venueId)">
              <ion-icon slot="start" name="business-outline"></ion-icon>
              Open {{ venueName() }}
            </ion-button>
          }
        } @else {
          <div class="empty"><p>Membership not found.</p></div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 16px 18px 28px; max-width: 480px; margin: 0 auto; }
      .card { text-align: center; background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 20px; padding: 30px 20px; }
      .card[data-s='approved'] { border-color: rgba(111,209,143,0.4); }
      .badge { width: 76px; height: 76px; margin: 0 auto 14px; border-radius: 50%; display: grid; place-items: center; background: var(--vip-surface-2); }
      .badge ion-icon { font-size: 40px; color: var(--vip-gold); }
      .card[data-s='approved'] .badge ion-icon { color: #6fd18f; }
      h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 800; }
      .sub { color: var(--vip-gold-soft); font-size: 13px; margin: 6px 0 12px; }
      .msg { color: var(--vip-muted); font-size: 14px; margin: 0; }
      .line { display: flex; justify-content: space-between; padding: 14px 4px; border-bottom: 1px solid var(--vip-border); font-size: 14px; }
      .line span { color: var(--vip-muted); }
      .line b { color: #fff; }
      .line b.s { text-transform: capitalize; }
      .line b.s[data-s='approved'] { color: #6fd18f; }
      .line b.s[data-s='pending'] { color: var(--vip-gold-soft); }
      .line b.s[data-s='declined'] { color: #ff8f8f; }
      .cta { margin-top: 22px; --border-radius: 14px; font-weight: 700; height: 50px; }
      .empty { text-align: center; padding: 60px 20px; color: var(--vip-muted); }
    `,
  ],
})
export class StaffStatusPage {
  private accounts = inject(AccountService);
  private vip = inject(VipService);
  private router = inject(Router);

  private _id = signal<string>('');
  @Input() set id(value: string) { this._id.set(value); }

  membership = computed(() => this.accounts.membershipById(this._id()));
  venueName = computed(() => this.vip.venueById(this.membership()?.venueId ?? '')?.name ?? 'the venue');

  icon(): string {
    const s = this.membership()?.status;
    return s === 'approved' ? 'checkmark-circle' : s === 'declined' ? 'close-outline' : 'time-outline';
  }
  title(): string {
    const s = this.membership()?.status;
    return s === 'approved' ? 'You’re on the team' : s === 'declined' ? 'Not approved' : 'Awaiting approval';
  }
  message(): string {
    const s = this.membership()?.status;
    if (s === 'approved') return 'You’ll now receive VIP arrival alerts by text and in your inbox.';
    if (s === 'declined') return 'The venue didn’t approve this request. Contact your manager if you think this is a mistake.';
    return 'Your venue’s owner or a manager needs to confirm you. We’ll text you the moment they do.';
  }

  openVenue(venueId: string): void {
    this.router.navigateByUrl('/venue-portal/' + venueId);
  }
}
