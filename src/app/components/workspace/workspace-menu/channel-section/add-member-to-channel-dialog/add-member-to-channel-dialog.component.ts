import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule

@Component({
  selector: 'app-add-member-to-channel-dialog',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './add-member-to-channel-dialog.component.html',
  styleUrl: './add-member-to-channel-dialog.component.scss'
})
export class AddMemberToChannelDialogComponent {

  isOpen: boolean = false;
  selectedOption: string = 'Option1'; 
  private subscriptions: Subscription = new Subscription();
 
  constructor(public openCloseDialogService: OpenCloseDialogService) {}

  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('addChannelMemberChoice')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    
    if (sub) this.subscriptions.add(sub);
    console.log('app-add-member-to-channel-dialog isOpen: ',this.isOpen)
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public closeDialog() {
    this.openCloseDialogService.close('addChannelMemberChoice');
  }

  onOptionChange() {
    console.log(`Ausgewählte Option: ${this.selectedOption}`);
  }
}
