// src/app/shared/services/dialog.service.ts
import { Injectable, EnvironmentInjector, ViewContainerRef } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor() {}


  /**
   * Opens a dialog by dynamically creating a component and managing its lifecycle.
   * @param component - The component to be dynamically created and displayed in the dialog.
   * @param viewContainerRef - The "ViewContainerRef" where the component will be injected.
   * @param injector - The "EnvironmentInjector" uesed to provide dependencies for the dynamically created component.
   * @param timeout - The duration (in milliseconds) before the dialog is automatically destroyed.
   * @param navigateTo - Optional. The route to navigate to after the dialog is destroyed.
   * @param router - Optional. The router instance touse for navigation. Required if navigateTo is provided.
   */
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