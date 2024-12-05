import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment.development';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStorage, getStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideRouter(routes),
  importProvidersFrom(provideFirebaseApp(() => initializeApp(environment.firebase))),
  importProvidersFrom(provideAuth(() => getAuth())),
  importProvidersFrom(provideFirestore(() => getFirestore())), provideAnimationsAsync(),
  importProvidersFrom(provideStorage(() => getStorage())),],
};
