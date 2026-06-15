import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'editor',
    pathMatch: 'full',
  },

  {
    path: 'editor',
    loadComponent: () =>
      import('./editor/pages/editor-page/editor-page.component').then(
        (m) => m.EditorPageComponent
      ),
  },

  {
    path: 'preview',
    loadComponent: () =>
      import('./renderer/pages/preview-page/preview-page.component').then(
        (m) => m.PreviewPageComponent
      ),
  },

  {
    path: '**',
    redirectTo: 'editor',
  },
];
