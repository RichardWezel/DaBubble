import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { CommonModule } from '@angular/common';
import { SignInService } from '../../../../shared/services/sign-in.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-choose-avatar-card',
  standalone: true,
  imports: [CardComponent, CommonModule, FormsModule],
  templateUrl: './choose-avatar-card.component.html',
  styleUrl: './choose-avatar-card.component.scss'
})
export class ChooseAvatarCardComponent {
  pictures = ['assets/img/profile-pictures/profile-1.png', 'assets/img/profile-pictures/profile-2.png', 'assets/img/profile-pictures/profile-3.png', 'assets/img/profile-pictures/profile-4.png', 'assets/img/profile-pictures/profile-5.png', 'assets/img/profile-pictures/profile-6.png'];
  currentProfilePicture = 'assets/img/profile-basic.png';
  avatarSelected = false;
  signInService: SignInService = inject(SignInService);
  @Output() generateAccount = new EventEmitter<boolean>();


  /**
   * This method navigates back to the sign-in-card component.
   * For that, it emits an event to the sign-in component.
   */
  goToGenerateAccount() {
    this.generateAccount.emit(true);
  }


  /**
   * The chosen picture from the selection gets saved as the currentProfilePicture and in the signInService.
   * @param path 
   */
  chosePicture(path: string) {
    this.currentProfilePicture = path;
    this.avatarSelected = true;
    this.signInService.signInData.img = path;
  }


  /**
   * Triggers a click event on the provided file input element to open the file explorer.
   * @param fileInput 
   */
  openFileExplorer(fileInput: HTMLInputElement) {
    fileInput.click();
  }


  /**
   * This method selects a picture from the file explorer.
   * @param event - The file input change event that contains the selected file.
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result) {
          this.currentProfilePicture = reader.result as string;
          this.signInService.signInData.img = reader.result as string;
          this.avatarSelected = true;
        }
      };

      reader.onerror = () => {
        console.error('Fehler beim Lesen der Datei');
      };

      reader.readAsDataURL(file);
    }
  }


  /**
   * Logs the data submitted by the form to the console for testing purposes.
   */
  showInfo() {
    console.log('Data', this.signInService.signInData);
  }

}
