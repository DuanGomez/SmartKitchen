import { Component } from '@angular/core';
import { EstacionBaseComponent } from '../estacion-base.component';

@Component({
  selector: 'app-barra',
  standalone: true,
  imports: [EstacionBaseComponent],
  template: `<app-estacion-base estacion="barra" titulo="Barra" foto="photos/barra.webp" descripcion="Bebidas, jugos y cocteles"></app-estacion-base>`
})
export class BarraComponent {}
