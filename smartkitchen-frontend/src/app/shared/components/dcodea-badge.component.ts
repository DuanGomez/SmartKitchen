import { Component } from '@angular/core';

/** Sello de autoría de Dcodea (estilos en src/dcodea-dna.css). */
@Component({
  selector: 'app-dcodea-badge',
  template: `
    <a class="dcodea-badge" href="https://www.instagram.com/dcod.ea/" target="_blank" rel="noopener">
      <img src="dcodea-mark.png" alt="" width="22" height="22" />
      <span>Hecho por <strong>Dcodea</strong></span>
    </a>
  `,
  styles: [':host { display: inline-flex; }'],
})
export class DcodeaBadgeComponent {}
