import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OutboxSms, NotificationType } from './notification.models';
import { TWILIO_CONFIG } from './twilio.config';

/**
 * The SMS delivery channel.
 *
 * - mode 'mock' (default, interim): records the message in an in-app outbox so
 *   you can see exactly what Twilio would send.
 * - mode 'backend' (Phase 2): POSTs to your backend, which calls Twilio with
 *   the secret Auth Token.
 *
 * Swapping from mock to real is a config change (twilio.config.ts) — no page
 * code changes.
 */
@Injectable({ providedIn: 'root' })
export class TwilioSmsChannel {
  private http = inject(HttpClient);
  private _outbox = signal<OutboxSms[]>([]);

  /** Everything the system has "texted" — newest first. */
  readonly outbox = computed(() => [...this._outbox()].sort((a, b) => b.createdAt - a.createdAt));

  async send(to: string, body: string, relatedType: NotificationType): Promise<void> {
    const entry: OutboxSms = {
      id: 'sms_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      to,
      body,
      relatedType,
      createdAt: Date.now(),
      status: 'queued',
    };
    this._outbox.update((o) => [entry, ...o]);

    if (TWILIO_CONFIG.mode === 'backend' && TWILIO_CONFIG.backendSendEndpoint) {
      try {
        await firstValueFrom(
          this.http.post(TWILIO_CONFIG.backendSendEndpoint, { to, body }),
        );
        this.setStatus(entry.id, 'sent');
      } catch (e) {
        console.warn('[Twilio] backend send failed', e);
        this.setStatus(entry.id, 'failed');
      }
      return;
    }

    // Mock mode: pretend it went out.
    console.info(`[Twilio mock] SMS -> ${to}: ${body}`);
    this.setStatus(entry.id, 'sent');
  }

  private setStatus(id: string, status: OutboxSms['status']): void {
    this._outbox.update((o) => o.map((s) => (s.id === id ? { ...s, status } : s)));
  }
}
