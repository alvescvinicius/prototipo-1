import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { MensalidadesComponent } from './pages/mensalidades/mensalidades.component';
import { InadimplentesComponent } from './pages/inadimplentes/inadimplentes.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'clientes',
    component: ClientesComponent
  },
  {
    path: 'mensalidades',
    component: MensalidadesComponent
  },
  {
    path: 'inadimplentes',
    component: InadimplentesComponent
  }
];
