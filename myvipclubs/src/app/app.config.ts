import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Hash location works from Cordova's file://-style webview origin and keeps
    // deep links (e.g. #/manager/m1) resolvable there and on the web.
    provideRouter(routes, withComponentInputBinding(), withHashLocation()),
    provideIonicAngular({ mode: 'ios' }),
  ],
};
