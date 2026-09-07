import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonItem,
  IonList,
  IonText,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonInput, IonButton, IonIcon, IonItem, IonList, IonText],
  template: `
    <ion-content class="login" [fullscreen]="true">
      <div class="wrap">
        <div class="brand">
          <div class="crest"><ion-icon name="diamond"></ion-icon></div>
          <h1>My VIP <span>Clubs</span></h1>
          <p class="sub">The hookup. Recognized before you walk in.</p>
        </div>

        <ion-list class="form" lines="none">
          <ion-item>
            <ion-icon slot="start" name="mail-outline"></ion-icon>
            <ion-input
              label="Email"
              labelPlacement="stacked"
              type="email"
              placeholder="you@email.com"
              [(ngModel)]="email"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="lock-closed-outline"></ion-icon>
            <ion-input
              label="Password"
              labelPlacement="stacked"
              type="password"
              placeholder="••••••••"
              [(ngModel)]="password"
            ></ion-input>
          </ion-item>
        </ion-list>

        <ion-button expand="block" class="cta" (click)="signIn()">
          <ion-icon slot="start" name="log-in-outline"></ion-icon>
          Enter the club
        </ion-button>

        <ion-text class="hint">
          <p>Demo: tap “Enter the club” to sign in as Alex Morgan.</p>
        </ion-text>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .login {
        --background:
          radial-gradient(900px 500px at 50% -5%, rgba(212, 175, 55, 0.18), transparent 60%),
          linear-gradient(180deg, #0c0c13 0%, #08080d 100%);
      }
      .wrap {
        max-width: 460px;
        margin: 0 auto;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 32px 22px;
      }
      .brand {
        text-align: center;
        margin-bottom: 34px;
      }
      .crest {
        width: 74px;
        height: 74px;
        margin: 0 auto 18px;
        border-radius: 20px;
        display: grid;
        place-items: center;
        background: linear-gradient(160deg, #d4af37, #8f7220);
        box-shadow: 0 12px 40px rgba(212, 175, 55, 0.35);
      }
      .crest ion-icon {
        font-size: 34px;
        color: #14131b;
      }
      h1 {
        font-size: 30px;
        font-weight: 800;
        letter-spacing: 0.02em;
        margin: 0;
        color: #fff;
      }
      h1 span {
        color: var(--vip-gold);
      }
      .sub {
        color: var(--vip-muted);
        margin-top: 8px;
        font-size: 14px;
      }
      .form {
        background: var(--vip-surface);
        border: 1px solid var(--vip-border);
        border-radius: 18px;
        overflow: hidden;
        padding: 4px 6px;
      }
      ion-item {
        --background: transparent;
      }
      ion-item ion-icon[slot='start'] {
        color: var(--vip-gold);
        margin-inline-end: 12px;
      }
      .cta {
        margin-top: 20px;
        --border-radius: 14px;
        font-weight: 700;
        height: 52px;
      }
      .hint {
        display: block;
        text-align: center;
        margin-top: 18px;
      }
      .hint p {
        color: var(--vip-muted);
        font-size: 12px;
      }
    `,
  ],
})
export class LoginPage {
  private vip = inject(VipService);
  private router = inject(Router);

  email = 'brandechomedia@gmail.com';
  password = '';

  signIn(): void {
    this.vip.login(this.email, this.password);
    this.router.navigateByUrl('/tabs/home');
  }
}
