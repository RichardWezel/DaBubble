import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type CurrentView = 'workspaceMenu' | 'channel' | 'thread';

@Injectable({
  providedIn: 'root' // Stellt sicher, dass der Service global verfügbar ist
})

export class SetMobileViewService {

  private currentViewSubject: BehaviorSubject<CurrentView> = new BehaviorSubject<CurrentView>('workspaceMenu');
  public currentView$: Observable<CurrentView> = this.currentViewSubject.asObservable();

  private isLargeScreenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isLargeScreen$: Observable<boolean> = this.isLargeScreenSubject.asObservable();
 
   constructor() { }
 
   // Methode zum Setzen des aktuellen Views
   setCurrentView(view: CurrentView): void {
     this.currentViewSubject.next(view);
   }
 
   // Methode zum Abrufen des aktuellen Views
   getCurrentView(): CurrentView {
     return this.currentViewSubject.value;
   }

   // Methode zum Setzen von isLargeScreen
  setIsLargeScreen(isLarge: boolean): void {
    this.isLargeScreenSubject.next(isLarge);
  }

  // Methode zum Abrufen von isLargeScreen
  getIsLargeScreen(): boolean {
    return this.isLargeScreenSubject.value;
  }
}
