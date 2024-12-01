// src/app/shared/services/dialog.service.ts
import { Injectable, EnvironmentInjector, ViewContainerRef } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor() {}

  openDialog(component: any, viewContainerRef: ViewContainerRef, injector: EnvironmentInjector, timeout = 3000, navigateTo?: string, router?: any): void {
    const componentRef = viewContainerRef.createComponent(component, {
      environmentInjector: injector,
    });

    setTimeout(() => {
      componentRef.destroy();
      if (navigateTo && router) {
        router.navigate([navigateTo]).catch((err: any) => console.error('Navigation Error:', err));
      }
    }, timeout);
  }
}