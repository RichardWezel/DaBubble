import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { ChannelComponent } from './channel/channel.component';
import { WorkspaceMenuComponent } from './workspace-menu/workspace-menu.component';
import { ThreadComponent } from './thread/thread.component';
import { FirebaseStorageService } from '../../shared/services/firebase-storage.service';
import { AddChannelDialogComponent } from "./workspace-menu/channel-section/add-channel-dialog/add-channel-dialog.component";

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    NavbarComponent,
    WorkspaceMenuComponent,
    ChannelComponent,
    ThreadComponent,
    CommonModule,
    AddChannelDialogComponent
],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss'
})
export class WorkspaceComponent {
  storage = inject(FirebaseStorageService);

  constructor() { }

}

