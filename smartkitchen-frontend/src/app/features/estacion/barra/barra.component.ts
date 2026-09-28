import { Component } from '@angular/core';
import { EstacionBaseComponent } from '../estacion-base.component';

@Component({
  selector: 'app-barra',
  standalone: true,
  imports: [EstacionBaseComponent],
  template: `<app-estacion-base estacion="barra" titulo="Barra" icono="🍹" [color]="'var(--accent-blue)'"></app-estacion-base>`
})
export class BarraComponent {}
