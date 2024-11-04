import { Component } from '@angular/core';
import { HeadSectionComponent } from './head-section/head-section.component';
import { ChannelSectionComponent } from './channel-section/channel-section.component';
import { DmSectionComponent } from './dm-section/dm-section.component';

@Component({
  selector: 'app-workspace-menu',
  standalone: true,
  imports: [
    HeadSectionComponent,
    ChannelSectionComponent,
    DmSectionComponent
  ],
  templateUrl: './workspace-menu.component.html',
  styleUrl: './workspace-menu.component.scss'
})
export class WorkspaceMenuComponent {

}
