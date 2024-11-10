import { Routes } from '@angular/router';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { LogInComponent } from './components/log-in/log-in/log-in.component';
import { SignInComponent } from './components/log-in/sign-in/sign-in.component';
import { ResetPasswordComponent } from './components/log-in/reset-password/reset-password.component';
import { ChooseAvatarCardComponent } from './components/log-in/sign-in/choose-avatar-card/choose-avatar-card.component';
import { ImprintComponent } from './components/imprint/imprint.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' }, // Umleitung zur Login-Seite
    { path: 'login', component: LogInComponent },
    { path: 'signin', component: SignInComponent },
    { path: 'resetpassword', component: ResetPasswordComponent },
    { path: 'workspace', component: WorkspaceComponent },
    { path: 'choose-avatar', component: ChooseAvatarCardComponent },
    { path: 'imprint', component: ImprintComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
];

