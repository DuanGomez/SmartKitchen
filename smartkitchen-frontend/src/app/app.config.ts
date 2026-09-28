import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { demoBackendInterceptor } from './core/demo/demo-backend.interceptor';
import { environment } from '../environments/environment';

// En modo demo (GitHub Pages) el último interceptor responde en lugar del servidor.
const interceptors = environment.demo ? [authInterceptor, demoBackendInterceptor] : [authInterceptor];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors(interceptors)),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'es-CO' },
  ]
};
