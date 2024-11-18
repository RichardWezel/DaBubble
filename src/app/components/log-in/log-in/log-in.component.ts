import { Component, inject } from '@angular/core';
import { LogInCardComponent } from './log-in-card/log-in-card.component';
import { BackgroundWithSignInComponent } from "../../../shared/components/log-in/background-with-sign-in/background-with-sign-in.component";
import { SendEmailCardComponent } from "./send-email-card/send-email-card.component";
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthorService } from '../../../shared/services/author.service';


@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [CommonModule, LogInCardComponent, BackgroundWithSignInComponent, SendEmailCardComponent],
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent {

  login: boolean = true;
  password: boolean = false;
  showLoading: boolean = true;

  constructor(private route: ActivatedRoute, private authorservice: AuthorService, private router: Router) { }

  ngOnInit() {
    const urlSegments = this.route.snapshot.url.map(segment => segment.path);
    if (urlSegments.includes('password-main') && urlSegments.includes('reset-password')) {
      this.password = true;
    }

    setTimeout(() => {
      this.showLoading = false;
    }, 3000);
  }

  loginWithGoogle() {
    this.authorservice.signInWithGoogle().then(() => {
      console.log('Google Login successful');
      this.router.navigate(['/workspace']);
    }).catch(error => {
      console.error('Google Login failed', error);
    });
  }
}
