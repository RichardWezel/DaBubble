import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { FormsModule } from '@angular/forms';
import { AddChannelDialogComponent } from "./add-channel-dialog/add-channel-dialog.component";
import { NavigationService } from '../../../../shared/services/navigation.service';
import { SetMobileViewService, CurrentView } from '../../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-channel-section',
  standalone: true,
  imports: [NgIf, FormsModule, NgClass, AddChannelDialogComponent],
  templateUrl: './channel-section.component.html',
  styleUrl: './channel-section.component.scss'
})
export class ChannelSectionComponent {

  @ViewChild('addChannelDialog') addChannelDialogComponent!: AddChannelDialogComponent;

  storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  isLargeScreen: boolean = false;
  isListVisible: boolean = true;
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

  toggleList() {
    this.isListVisible = !this.isListVisible;
  }

  callOpenDialog(event: Event) {
    event.stopPropagation();
    if (this.addChannelDialogComponent) {
      this.addChannelDialogComponent.openDialog();
    } else {
      console.log("Error of call addChannelDialogComponent.openDialog()")
    }
  }

  handleClick(channelId: string) {
    this.navigationService.setChannel(channelId)
    if (!this.isLargeScreen) {
      this.setView('channel')
    }
  }

  // Methode zum Wechseln der Ansicht über den Service
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }
}
