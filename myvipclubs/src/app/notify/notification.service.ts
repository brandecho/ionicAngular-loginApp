import { Injectable, inject, signal } from '@angular/core';
import { AppNotification, Audience, NotificationType } from './notification.models';
import { TwilioSmsChannel } from './twilio-sms.channel';

export interface NotifyParams {
  audience: Audience;
  type: NotificationType;
  title: string;
  body: string;
  deepLink?: string;
  /** SMS recipients (phone numbers) + the text to send. Caller resolves phones. */
  sms?: { to: string[]; body: string };
}

/**
 * Central notification hub. Every notification lands in the in-app inbox (the
 * source of truth); SMS via Twilio is the nudge that pulls people back to it.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private sms = inject(TwilioSmsChannel);
  private _items = signal<AppNotification[]>([]);

  readonly items = this._items.asReadonly();
  readonly outbox = this.sms.outbox;

  notify(params: NotifyParams): AppNotification {
    const n: AppNotification = {
      id: 'ntf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      audience: params.audience,
      type: params.type,
      title: params.title,
      body: params.body,
      deepLink: params.deepLink,
      read: false,
      createdAt: Date.now(),
    };
    this._items.update((list) => [n, ...list]);

    if (params.sms) {
      const body = params.sms.body;
      for (const to of params.sms.to) {
        if (to) this.sms.send(to, body, params.type);
      }
    }
    return n;
  }

  // ----- queries -----
  private sorted(list: AppNotification[]): AppNotification[] {
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }

  forVenue(venueId: string): AppNotification[] {
    return this.sorted(
      this._items().filter((n) => n.audience.kind === 'venue' && n.audience.venueId === venueId),
    );
  }

  forAccount(accountId: string): AppNotification[] {
    return this.sorted(
      this._items().filter(
        (n) => n.audience.kind === 'account' && n.audience.accountId === accountId,
      ),
    );
  }

  forRole(role: 'admin'): AppNotification[] {
    return this.sorted(
      this._items().filter((n) => n.audience.kind === 'role' && n.audience.role === role),
    );
  }

  unreadForVenue(venueId: string): number {
    return this.forVenue(venueId).filter((n) => !n.read).length;
  }

  unreadForAccount(accountId: string): number {
    return this.forAccount(accountId).filter((n) => !n.read).length;
  }

  markRead(id: string): void {
    this._items.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
}
