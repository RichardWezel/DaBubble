import { Component, inject } from '@angular/core';
import { BackgroundComponent } from "../../../shared/components/log-in/background/background.component";
import { SignInCardComponent } from "./sign-in-card/sign-in-card.component";
import { ChooseAvatarCardComponent } from "./choose-avatar-card/choose-avatar-card.component";
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [BackgroundComponent, SignInCardComponent, ChooseAvatarCardComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  generateAccount: boolean = true;
  private auth = inject(Auth);
}
