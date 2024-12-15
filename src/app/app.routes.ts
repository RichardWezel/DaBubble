import { Routes } from '@angular/router';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { LogInComponent } from './components/log-in/log-in/log-in.component';
import { SignInComponent } from './components/log-in/sign-in/sign-in.component';
import { ResetPasswordComponent } from './components/log-in/reset-password/reset-password.component';
import { ChooseAvatarCardComponent } from './components/log-in/sign-in/choose-avatar-card/choose-avatar-card.component';
import { ImprintComponent } from './components/imprint/imprint.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { ResetPasswordCardComponent } from './components/log-in/reset-password/reset-password-card/reset-password-card.component';
import { SendEmailCardComponent } from './components/log-in/log-in/send-email-card/send-email-card.component';
import { EmailVerifiedComponent } from './components/log-in/sign-in/email-verified/email-verified.component';
import { ChannelEditComponent } from './shared/components/dialog/channel-edit/channel-edit.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' }, // Umleitung zur Login-Seite
    { path: 'login', component: LogInComponent },
    { path: 'signin', component: SignInComponent },
    { path: 'auth/action', component: ResetPasswordCardComponent }, // Firebase-Link-Route
    /* { path: 'resetpassword', component: ResetPasswordCardComponent }, */
    { path: 'resetpassword', component: ResetPasswordCardComponent },
    { path: 'sendemail', component: SendEmailCardComponent },
    { path: 'workspace', component: WorkspaceComponent },
    { path: 'choose-avatar', component: ChooseAvatarCardComponent },
    { path: 'imprint', component: ImprintComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: 'emailverified', component: EmailVerifiedComponent },
    {path: 'channel-edit', component: ChannelEditComponent },
];

