import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  ToastController,
} from '@ionic/angular/standalone';
import { AccountService } from '../accounts/account.service';
import { NotificationService } from '../notify/notification.service';

type Tab = 'venues' | 'sms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    DatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>My VIP Clubs · Admin</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))">
          <ion-segment-button value="venues">
            <ion-label>Venue review{{ pending().length ? ' (' + pending().length + ')' : '' }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="sms">
            <ion-label>SMS outbox</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        @switch (tab()) {
          @case ('venues') {
            <p class="lead">New venues awaiting vetting before they go live.</p>
            @for (r of regs(); track r.id) {
              <div class="reg" [class.done]="r.status !== 'pending'">
                <div class="top">
                  <div>
                    <span class="name">{{ r.name }}</span>
                    <span class="meta">{{ r.type }} · {{ r.neighborhood }}, {{ r.city }}</span>
                  </div>
                  <span class="status" [attr.data-s]="r.status">{{ r.status }}</span>
                </div>
                <div class="addr"><ion-icon name="location-outline"></ion-icon> {{ r.address }}</div>
                <div class="owner"><ion-icon name="person-circle-outline"></ion-icon> {{ r.ownerName }}</div>
                @if (r.status === 'pending') {
                  <div class="actions">
                    <button class="btn decline" (click)="decline(r.id)"><ion-icon name="close-outline"></ion-icon> Decline</button>
                    <button class="btn approve" (click)="approve(r.id, r.name)"><ion-icon name="checkmark-outline"></ion-icon> Approve & go live</button>
                  </div>
                }
              </div>
            }
          }

          @case ('sms') {
            <p class="lead">Every text the system has sent (Twilio). Mock mode records the exact payload — swap to your backend to send for real.</p>
            @if (outbox().length) {
              @for (s of outbox(); track s.id) {
                <div class="sms">
                  <div class="sms-top">
                    <span class="to"><ion-icon name="chatbubble-ellipses-outline"></ion-icon> {{ s.to }}</span>
                    <span class="s-status" [attr.data-s]="s.status">{{ s.status }}</span>
                  </div>
                  <p class="sms-body">{{ s.body }}</p>
                  <span class="sms-time">{{ s.createdAt | date: 'short' }} · {{ s.relatedType }}</span>
                </div>
              }
            } @else {
              <div class="empty"><ion-icon name="chatbubble-ellipses-outline"></ion-icon><p>No messages sent yet.</p></div>
            }
          }
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 12px 18px 28px; max-width: 620px; margin: 0 auto; }
      .lead { color: var(--vip-muted); font-size: 13px; margin: 4px 2px 16px; }

      .reg { background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px; padding: 15px; margin-bottom: 12px; }
      .reg.done { opacity: 0.6; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
      .name { display: block; color: #fff; font-weight: 700; font-size: 16px; }
      .meta { display: block; color: var(--vip-muted); font-size: 12.5px; margin-top: 2px; }
      .status { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
      .status[data-s='pending'] { color: var(--vip-gold-soft); background: var(--vip-gold-tint); }
      .status[data-s='approved'] { color: #6fd18f; background: rgba(111,209,143,0.14); }
      .status[data-s='declined'] { color: var(--vip-muted); background: var(--vip-surface-2); }
      .addr, .owner { display: flex; align-items: center; gap: 7px; color: var(--vip-text); opacity: 0.85; font-size: 13px; margin-top: 10px; }
      .addr ion-icon, .owner ion-icon { color: var(--vip-gold); font-size: 16px; }
      .actions { display: flex; gap: 10px; margin-top: 14px; }
      .btn { flex: 1; border: none; cursor: pointer; border-radius: 12px; padding: 11px; font-weight: 700; font-size: 13.5px; display: flex; align-items: center; justify-content: center; gap: 6px; }
      .btn ion-icon { font-size: 17px; }
      .approve { background: linear-gradient(120deg, #d4af37, #a9861f); color: #14131b; }
      .decline { background: var(--vip-surface-2); color: var(--vip-muted); border: 1px solid var(--vip-border); }

      .sms { background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 14px; padding: 13px 14px; margin-bottom: 10px; }
      .sms-top { display: flex; justify-content: space-between; align-items: center; }
      .to { display: inline-flex; align-items: center; gap: 6px; color: #fff; font-weight: 700; font-size: 13.5px; }
      .to ion-icon { color: var(--vip-gold); font-size: 15px; }
      .s-status { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #6fd18f; }
      .s-status[data-s='failed'] { color: #ff8f8f; }
      .sms-body { color: var(--vip-text); font-size: 13.5px; margin: 8px 0 0; line-height: 1.4; }
      .sms-time { display: block; color: var(--vip-muted); font-size: 11px; margin-top: 8px; }

      .empty { text-align: center; padding: 50px 20px; color: var(--vip-muted); }
      .empty ion-icon { font-size: 42px; opacity: 0.5; }
      .empty p { margin-top: 10px; }
    `,
  ],
})
export class AdminPage {
  private accounts = inject(AccountService);
  private notify = inject(NotificationService);
  private toast = inject(ToastController);

  tab = signal<Tab>('venues');
  regs = computed(() => this.accounts.venueRegs());
  pending = this.accounts.pendingVenues;
  outbox = this.notify.outbox;

  async approve(id: string, name: string): Promise<void> {
    await this.accounts.approveVenue(id);
    const t = await this.toast.create({
      message: `${name} is now live on My VIP Clubs.`,
      duration: 2200,
      position: 'top',
      color: 'primary',
    });
    await t.present();
  }

  async decline(id: string): Promise<void> {
    this.accounts.declineVenue(id);
    const t = await this.toast.create({ message: 'Venue declined.', duration: 1600, position: 'top' });
    await t.present();
  }
}
