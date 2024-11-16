import { Component, EventEmitter, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-choose-avatar-card',
  standalone: true,
  imports: [ CardComponent, CommonModule ],
  templateUrl: './choose-avatar-card.component.html',
  styleUrl: './choose-avatar-card.component.scss'
})
export class ChooseAvatarCardComponent {
  pictures = ['assets/img/profile-pictures/profile-1.png', 'assets/img/profile-pictures/profile-2.png', 'assets/img/profile-pictures/profile-3.png', 'assets/img/profile-pictures/profile-4.png', 'assets/img/profile-pictures/profile-5.png', 'assets/img/profile-pictures/profile-6.png'];
  currentProfilePicture = 'assets/img/profile-basic.png';
  avatarSelected = false;
  @Output() generateAccount = new EventEmitter<boolean>();

  goToGenerateAccount() {
    this.generateAccount.emit(true);
  }

  chosePicture(path: string) {
    this.currentProfilePicture = path;
    this.avatarSelected = true;
  }

  openFileExplorer(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      console.log('file ', file);
      const reader = new FileReader();
  
      reader.onload = () => {
        if (reader.result) {
          this.currentProfilePicture = reader.result as string;
          this.avatarSelected = true;
        }
      };
  
      reader.onerror = () => {
        console.error('Fehler beim Lesen der Datei');
      };
  
      reader.readAsDataURL(file);
    }
  }

}
