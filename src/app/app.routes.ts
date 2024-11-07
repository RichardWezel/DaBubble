import { Routes } from '@angular/router';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { LogInComponent } from './components/log-in/log-in/log-in.component';

export const routes: Routes = [
    { path: '', component: WorkspaceComponent },
    { path: 'login', component: LogInComponent, },
    { path: 'workspace', component: WorkspaceComponent }
];
