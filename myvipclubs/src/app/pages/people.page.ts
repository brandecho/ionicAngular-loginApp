import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';

@Component({
  selector: 'app-people',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonIcon],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>My People</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        <p class="lead">The bartenders, servers and managers who take care of you.</p>

        @for (s of vip.favoriteStaff(); track s.id) {
          <div class="person">
            <div class="avatar" [attr.data-role]="s.role">{{ s.avatar }}</div>
            <div class="body">
              <div class="row1">
                <span class="name">{{ s.name }}</span>
                <span class="role">{{ s.role }}</span>
              </div>
              <span class="venue"><ion-icon name="business-outline"></ion-icon> {{ s.venueName }}</span>
              @if (s.note) {
                <span class="note">“{{ s.note }}”</span>
              }
              <div class="actions">
                <button class="chip"><ion-icon name="chatbubble-ellipses-outline"></ion-icon> Message</button>
                <button class="chip"><ion-icon name="call-outline"></ion-icon> Request</button>
              </div>
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 8px 18px 28px; max-width: 620px; margin: 0 auto; }
      .lead { color: var(--vip-muted); margin: 6px 2px 18px; font-size: 14px; }
      .person {
        display: flex; gap: 14px;
        background: var(--vip-surface); border: 1px solid var(--vip-border);
        border-radius: 18px; padding: 16px; margin-bottom: 14px;
      }
      .avatar {
        flex: 0 0 52px; height: 52px; border-radius: 50%;
        display: grid; place-items: center; font-weight: 800; color: #14131b;
        background: linear-gradient(160deg, #d4af37, #9c7c22);
      }
      .body { flex: 1; min-width: 0; }
      .row1 { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
      .name { color: #fff; font-weight: 700; font-size: 16px; }
      .role { color: var(--vip-gold); font-size: 12px; font-weight: 600; }
      .venue { display: inline-flex; align-items: center; gap: 5px; color: var(--vip-muted); font-size: 12.5px; margin-top: 3px; }
      .venue ion-icon { font-size: 14px; }
      .note { display: block; color: var(--vip-text); font-size: 13px; font-style: italic; opacity: 0.85; margin: 8px 0 12px; }
      .actions { display: flex; gap: 8px; }
      .chip {
        display: inline-flex; align-items: center; gap: 6px;
        background: var(--vip-surface-2); border: 1px solid var(--vip-border); color: var(--vip-text);
        border-radius: 999px; padding: 7px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer;
      }
      .chip ion-icon { font-size: 15px; color: var(--vip-gold); }
    `,
  ],
})
export class PeoplePage {
  vip = inject(VipService);
}
