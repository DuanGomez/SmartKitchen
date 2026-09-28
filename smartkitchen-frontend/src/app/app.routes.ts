import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },

  { path: 'admin', canActivate: [roleGuard(['ADMIN'])], children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'productos',  loadComponent: () => import('./features/admin/productos/productos.component').then(m => m.ProductosComponent) },
      { path: 'categorias', loadComponent: () => import('./features/admin/categorias/categorias.component').then(m => m.CategoriasComponent) },
      { path: 'usuarios',   loadComponent: () => import('./features/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
  ]},

  { path: 'mesero', canActivate: [roleGuard(['ADMIN','MESERO'])], children: [
      { path: 'mesas',      loadComponent: () => import('./features/mesero/mesas/mesas.component').then(m => m.MesasComponent) },
      { path: 'pedido/:id', loadComponent: () => import('./features/mesero/pedido/pedido.component').then(m => m.PedidoComponent) },
  ]},

  { path: 'estacion', children: [
      { path: 'cocina', canActivate: [roleGuard(['ADMIN','COCINA'])], loadComponent: () => import('./features/estacion/cocina/cocina.component').then(m => m.CocinaComponent) },
      { path: 'barra',  canActivate: [roleGuard(['ADMIN','BARRA'])],  loadComponent: () => import('./features/estacion/barra/barra.component').then(m => m.BarraComponent) },
      { path: 'mexico', canActivate: [roleGuard(['ADMIN','MEXICO'])], loadComponent: () => import('./features/estacion/mexico/mexico.component').then(m => m.MexicoComponent) },
  ]},

  { path: 'caja', canActivate: [roleGuard(['ADMIN','CAJA'])], loadComponent: () => import('./features/caja/caja.component').then(m => m.CajaComponent) },

  { path: '**', redirectTo: '/login' }
];
