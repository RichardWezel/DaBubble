import { Component, HostListener, ElementRef, inject, } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { CloudStorageService } from '../../../shared/services/cloud-storage.service';
import { SettingsComponent } from "./settings/settings.component";
import { SearchComponent } from '../navbar/search/search.component';
import { SetMobileViewService, CurrentView } from '../../../shared/services/set-mobile-view.service';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SettingsComponent, SearchComponent, NgIf],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  elementRef: ElementRef = inject(ElementRef);
  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  dropDownOpen: boolean = false;

  // Zustände für die Sichtbarkeit der Elemente
  isLargeScreen: boolean = false;
  currentView: CurrentView = 'workspaceMenu'; // Standardwert

  private subscriptions: Subscription = new Subscription();

  constructor(private viewService: SetMobileViewService) {
    
  }

  ngOnInit(): void {
    // Subscription für currentView
    const viewSub = this.viewService.currentView$.subscribe(view => {
      this.currentView = view;
    });
    this.subscriptions.add(viewSub);
    
    // Subscription für isLargeScreen
    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.querySelector('.current-user').contains(event.target)) {
      this.dropDownOpen = false;
    }
  }

  // Methode zum Wechseln der Ansicht über den Service
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }

}