import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { FormsModule } from '@angular/forms';
import { AddChannelDialogComponent } from "./add-channel-dialog/add-channel-dialog.component";

@Component({
  selector: 'app-channel-section',
  standalone: true,
  imports: [NgIf, FormsModule, NgClass, AddChannelDialogComponent],
  templateUrl: './channel-section.component.html',
  styleUrl: './channel-section.component.scss'
})
export class ChannelSectionComponent implements AfterViewInit {

  @ViewChild('addChannelDialog') addChannelDialogComponent!: AddChannelDialogComponent;

  ngAfterViewInit(): void {
    // Die Child-Komponente ist jetzt verfügbar
    // Du kannst hier initiale Aufrufe machen, falls nötig
    // Beispiel:
    // this.childComponent.childMethod();
  }

  storage = inject(FirebaseStorageService);

  isListVisible: boolean = true;

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
}
