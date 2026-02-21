import { Routes } from '@angular/router';

import { RepoDetails } from './pages/repo-details/repo-details';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth.guard';

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
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard]
    },
    {
        path: 'repo',
        loadComponent: () => import('./pages/repo/repo').then(m => m.Repo),
        canActivate: [authGuard]
    },
    {
        path: 'repo/:id',
        loadComponent: () => import('./pages/repo-details/repo-details').then(m => m.RepoDetails),
        canActivate: [authGuard]
    }
];
