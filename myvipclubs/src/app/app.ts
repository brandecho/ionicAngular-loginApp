import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushService } from './native/push.service';
import { GeofenceService } from './native/geofence.service';
import { isCordova } from './native/platform';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class App implements OnInit {
  private push = inject(PushService);
  private geofence = inject(GeofenceService);

  ngOnInit(): void {
    // No-ops on the web; initialise Pushwoosh + geofencing inside Cordova.
    if (!isCordova()) return;
    this.push.init();
    this.geofence.init();
  }
}
