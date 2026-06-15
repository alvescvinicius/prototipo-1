import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./auth/pages/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  {
    path: 'editor/:projectId',
    loadComponent: () =>
      import('./editor/pages/editor-page/editor-page.component').then(m => m.EditorPageComponent),
    canActivate: [authGuard]
  },

  // Rota legada sem projectId (redireciona ao dashboard)
  {
    path: 'editor',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: 'preview',
    loadComponent: () =>
      import('./renderer/pages/preview-page/preview-page.component').then(m => m.PreviewPageComponent),
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: 'dashboard' }
];
