import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { registerAppIcons } from './app/icons';

registerAppIcons();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
