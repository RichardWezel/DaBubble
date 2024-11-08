import { Routes } from '@angular/router';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { LogInComponent } from './components/log-in/log-in/log-in.component';
import { SignInComponent } from './components/log-in/sign-in/sign-in.component';
import { ResetPasswordComponent } from './components/log-in/reset-password/reset-password.component';

export const routes: Routes = [
    { path: '', component: WorkspaceComponent },
    { path: 'login', component: LogInComponent, },
    { path: 'signin', component: SignInComponent },
    { path: 'resetpassword', component: ResetPasswordComponent},
    { path: 'workspace', component: WorkspaceComponent }
];
