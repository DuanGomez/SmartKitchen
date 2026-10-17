import { Component } from '@angular/core';
import { EstacionBaseComponent } from '../estacion-base.component';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [EstacionBaseComponent],
  template: `<app-estacion-base estacion="cocina" titulo="Cocina" foto="photos/cocina.webp" descripcion="Parrilla, fritos y acompañamientos"></app-estacion-base>`
})
export class CocinaComponent {}
