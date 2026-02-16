import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { RepoDetails } from './pages/repo-details/repo-details';
import { Login } from './pages/login/login';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path:'login',
        component: Login
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
