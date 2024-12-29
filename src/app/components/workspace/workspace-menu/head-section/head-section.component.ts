import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { SearchComponent } from '../../navbar/search/search.component'; 
import { SetMobileViewService, CurrentView } from '../../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-head-section',
  standalone: true,
  imports: [SearchComponent],
  templateUrl: './head-section.component.html',
  styleUrl: './head-section.component.scss'
})
export class HeadSectionComponent {

  storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  isLargeScreen: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(private viewService: SetMobileViewService) {}

  ngOnInit(): void {
    
    // Subscription für isLargeScreen
    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  handleClick() {
    this.navigationService.setChannel('newMessage')
    if (!this.isLargeScreen) {
      this.setView('channel')
    }
  }

  // Methode zum Wechseln der Ansicht über den Service
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }

}
