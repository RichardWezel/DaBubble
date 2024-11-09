import { Component } from '@angular/core';
import { BackgroundComponent } from "../../../shared/components/log-in/background/background.component";
import { SignInCardComponent } from "./sign-in-card/sign-in-card.component";
import { ChooseAvatarCardComponent } from "./choose-avatar-card/choose-avatar-card.component";

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [BackgroundComponent, SignInCardComponent, ChooseAvatarCardComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

}
