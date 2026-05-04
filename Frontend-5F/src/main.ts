import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initNotifications } from './app/notifications';

bootstrapApplication(App, appConfig)
  .then(() => {
    // inizializza notifiche (usa http://localhost:4000 come server di default)
    initNotifications().catch((e) => console.warn('initNotifications failed', e));
  })
  .catch((err) => console.error(err));
