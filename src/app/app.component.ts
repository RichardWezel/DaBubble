import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FirebaseStorageService } from './shared/services/firebase-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'da-bubble';

  constructor(private storageService: FirebaseStorageService) {}

  ngOnInit() {
    console.log('AppComponent ngOnInit aufgerufen');
    (window as any).status = this.status.bind(this);
  }

  status() {
    console.log('Current User: ', this.storageService.currentUser);
    console.log('Current channel of Current User', this.storageService.currentUser.currentChannel);
    // Fügen Sie hier weitere console.log Ausgaben hinzu
  }
}
