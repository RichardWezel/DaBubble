import { NgIf } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-add-channel-dialog',
  standalone: true,
  imports: [NgIf],
  templateUrl: './add-channel-dialog.component.html',
  styleUrl: './add-channel-dialog.component.scss'
})
export class AddChannelDialogComponent {

  isDialogVisible: boolean = false;

  public openDialog() {
    this.isDialogVisible = true;
  }

  public closeDialog() {
    this.isDialogVisible = false;
  }
}
