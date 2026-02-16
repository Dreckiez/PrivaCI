import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { RepoDetails } from './pages/repo-details/repo-details';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: Dashboard
    },
    {
        path: 'repo/:id',
        component: RepoDetails
    }
];
