import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, initializeFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment.development';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStorage, getStorage, connectStorageEmulator } from '@angular/fire/storage';
import { USE_EMULATOR } from '../config/use-emulator';
import { EMULATOR_HOST, EMULATOR_PORTS } from '../config/emulator.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (USE_EMULATOR) {
        connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, { disableWarnings: true });
      }
      return auth;
    }),
    provideFirestore(() => {
      // Firestore prefers a streaming connection and probes for one first.
      // Behind mobile carriers, proxies and some iOS network stacks that probe
      // stalls instead of failing fast, and the first read sits there for
      // tens of seconds before it gives up and falls back. Asking for the
      // detection explicitly lets it switch as soon as the probe looks bad.
      const firestore = initializeFirestore(getApp(), {
        experimentalAutoDetectLongPolling: true,
      });
      if (USE_EMULATOR) {
        connectFirestoreEmulator(firestore, EMULATOR_HOST, EMULATOR_PORTS.firestore);
      }
      return firestore;
    }),
    provideAnimationsAsync(),
    provideStorage(() => {
      const storage = getStorage();
      if (USE_EMULATOR) {
        connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORTS.storage);
      }
      return storage;
    }),
  ],
};
