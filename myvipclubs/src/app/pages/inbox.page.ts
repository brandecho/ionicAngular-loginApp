import { Component, Input, computed, inject, signal } from '@angular/core';
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
import { NotificationService } from '../notify/notification.service';
import { AccountService } from '../accounts/account.service';
import { AppNotification, NotificationType } from '../notify/notification.models';

const ICONS: Record<NotificationType, string> = {
  staff_join_request: 'people-outline',
  staff_approved: 'checkmark-circle-outline',
  staff_declined: 'close-outline',
  venue_pending_review: 'business-outline',
  venue_approved: 'checkmark-circle-outline',
  venue_declined: 'close-outline',
  access_request: 'flash-outline',
  access_approved: 'checkmark-circle-outline',
  access_declined: 'close-outline',
  vip_arriving: 'navigate-outline',
  table_request: 'restaurant-outline',
};

@Component({
  selector: 'app-inbox',
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
          <ion-back-button [defaultHref]="backHref()"></ion-back-button>
        </ion-buttons>
        <ion-title>Inbox</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        @if (items().length) {
          @for (n of items(); track n.id) {
            <button class="ntf" [class.unread]="!n.read" (click)="open(n)">
              <span class="dot" [class.on]="!n.read"></span>
              <span class="ic"><ion-icon [name]="icon(n.type)"></ion-icon></span>
              <div class="body">
                <span class="title">{{ n.title }}</span>
                <span class="text">{{ n.body }}</span>
                <span class="time">{{ ago(n.createdAt) }}</span>
              </div>
              @if (n.deepLink) { <ion-icon class="go" name="chevron-forward-outline"></ion-icon> }
            </button>
          }
        } @else {
          <div class="empty">
            <ion-icon name="notifications-outline"></ion-icon>
            <p>No notifications yet.</p>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 12px 18px 28px; max-width: 620px; margin: 0 auto; }
      .ntf {
        width: 100%; display: flex; align-items: flex-start; gap: 10px; text-align: left; cursor: pointer;
        background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 14px; padding: 14px; margin-bottom: 10px;
      }
      .ntf.unread { border-color: color-mix(in srgb, var(--vip-gold) 40%, transparent); }
      .dot { flex: 0 0 8px; width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; background: transparent; }
      .dot.on { background: var(--vip-gold); }
      .ic { flex: 0 0 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; background: var(--vip-surface-2); }
      .ic ion-icon { font-size: 19px; color: var(--vip-gold); }
      .body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .title { color: #fff; font-weight: 700; font-size: 14.5px; }
      .text { color: var(--vip-text); opacity: 0.85; font-size: 13px; margin-top: 2px; }
      .time { color: var(--vip-muted); font-size: 11px; margin-top: 6px; }
      .go { color: var(--vip-muted); font-size: 18px; align-self: center; }
      .empty { text-align: center; padding: 60px 20px; color: var(--vip-muted); }
      .empty ion-icon { font-size: 44px; opacity: 0.5; }
      .empty p { margin-top: 10px; }
    `,
  ],
})
export class InboxPage {
  private notify = inject(NotificationService);
  private accounts = inject(AccountService);
  private router = inject(Router);

  private _venue = signal<string>('');
  private _account = signal<string>('');
  private _role = signal<string>('');

  @Input() set venue(v: string | undefined) { if (v) this._venue.set(v); }
  @Input() set account(a: string | undefined) { if (a) this._account.set(a); }
  @Input() set role(r: string | undefined) { if (r) this._role.set(r); }

  items = computed<AppNotification[]>(() => {
    if (this._venue()) return this.notify.forVenue(this._venue());
    if (this._role() === 'admin') return this.notify.forRole('admin');
    const acct = this._account() || this.accounts.currentAccount()?.id;
    return acct ? this.notify.forAccount(acct) : [];
  });

  backHref = computed(() => {
    if (this._venue()) return `/venue-portal/${this._venue()}`;
    if (this._role() === 'admin') return '/admin';
    return '/tabs/home';
  });

  icon(t: NotificationType): string {
    return ICONS[t] ?? 'notifications-outline';
  }

  ago(ts: number): string {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  }

  open(n: AppNotification): void {
    this.notify.markRead(n.id);
    if (n.deepLink) this.router.navigateByUrl(n.deepLink);
  }
}
