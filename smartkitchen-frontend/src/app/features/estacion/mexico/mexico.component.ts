import { Component } from '@angular/core';
import { EstacionBaseComponent } from '../estacion-base.component';

@Component({
  selector: 'app-mexico',
  standalone: true,
  imports: [EstacionBaseComponent],
  template: `<app-estacion-base estacion="mexico" titulo="México" icono="🌮" [color]="'var(--warning)'"></app-estacion-base>`
})
export class MexicoComponent {}
