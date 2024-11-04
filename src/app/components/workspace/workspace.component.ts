import { Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import { ChannelComponent } from './channel/channel.component';
import { WorkspaceMenuComponent } from './workspace-menu/workspace-menu.component';
import { ThreadComponent } from './thread/thread.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    NavbarComponent,
    WorkspaceMenuComponent,
    ChannelComponent,
    ThreadComponent
  ],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss'
})
export class WorkspaceComponent {

}
