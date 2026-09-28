import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Categoria, CategoriaRequest, Estacion } from '../../../core/models/models';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, ToastComponent, ConfirmDialogComponent],
  template: `
    <sk-toast></sk-toast>
    @if (showConfirm()) {
      <sk-confirm-dialog title="Eliminar categoría" [message]="'¿Eliminar «' + (delTarget()?.nombre ?? '') + '»?'"
        (confirm)="confirmDelete()" (cancel)="showConfirm.set(false)"></sk-confirm-dialog>
    }
    <div class="sk-layout">
      <sk-sidebar></sk-sidebar>
      <div class="sk-main">
        <sk-topbar title="Categorías" subtitle="Organiza las estaciones de tu cocina"></sk-topbar>
        <div class="sk-content">
          <div class="sk-page-header">
            <div class="page-title"><h2>Categorías</h2><p>{{ categorias().length }} categorías</p></div>
            <button class="sk-btn sk-btn-primary" (click)="abrirModal()">+ Nueva categoría</button>
          </div>

          <!-- Cards por estación -->
          @for (est of estaciones; track est.key) {
            <div class="est-section">
              <div class="est-header" [style.color]="est.color">
                <span>{{ est.icon }}</span><span>{{ est.label }}</span>
                <span class="sk-badge" [style.background]="est.color + '22'" [style.color]="est.color">{{ getByEst(est.key).length }}</span>
              </div>
              <div class="cat-grid">
                @for (c of getByEst(est.key); track c.id) {
                  <div class="cat-card">
                    <div class="cat-info">
                      <div class="cat-dot" [style.background]="est.color"></div>
                      <div>
                        <div class="fw-600 text-sm">{{ c.nombre }}</div>
                        <div class="text-xs text-muted">{{ c.descripcion }}</div>
                      </div>
                    </div>
                    <div class="cat-actions">
                      <span class="sk-badge" [class]="c.activo ? 'badge-success' : 'badge-muted'">{{ c.activo ? 'Activa' : 'Inactiva' }}</span>
                      <button class="sk-btn sk-btn-ghost sk-btn-icon" (click)="abrirModal(c)">✏️</button>
                      <button class="sk-btn sk-btn-danger sk-btn-icon" (click)="pedirEliminar(c)">🗑</button>
                    </div>
                  </div>
                }
                @if (getByEst(est.key).length === 0) {
                  <div class="cat-empty">Sin categorías en esta estación</div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    @if (modal()) {
      <div class="sk-overlay" (click)="cerrarModal()">
        <div class="sk-modal" (click)="$event.stopPropagation()">
          <div class="sk-modal-header">
            <h3>{{ editando() ? 'Editar categoría' : 'Nueva categoría' }}</h3>
            <button class="sk-btn sk-btn-ghost sk-btn-icon" (click)="cerrarModal()">✕</button>
          </div>
          <form (ngSubmit)="guardar()">
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="sk-input-group"><label>Nombre *</label><input class="sk-input" [(ngModel)]="form.nombre" name="nombre" required placeholder="Ej: Carnes a la Brasa"></div>
              <div class="sk-input-group"><label>Descripción</label><input class="sk-input" [(ngModel)]="form.descripcion" name="desc" placeholder="Descripción opcional"></div>
              <div class="sk-input-group">
                <label>Estación *</label>
                <select class="sk-select" [(ngModel)]="form.estacion" name="estacion" required>
                  <option value="">Seleccionar estación...</option>
                  @for (e of estaciones; track e.key) { <option [value]="e.key">{{ e.icon }} {{ e.label }}</option> }
                </select>
              </div>
              <div class="sk-input-group">
                <label>Estado</label>
                <select class="sk-select" [(ngModel)]="form.activo" name="activo">
                  <option [ngValue]="true">Activa</option><option [ngValue]="false">Inactiva</option>
                </select>
              </div>
            </div>
            <div class="sk-modal-footer">
              <button type="button" class="sk-btn sk-btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="sk-btn sk-btn-primary" [disabled]="saving() || !form.nombre || !form.estacion">
                @if (saving()) { <span class="sk-spinner sk-spinner-sm"></span> } {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .est-section { margin-bottom: 2rem; }
    .est-header { display:flex; align-items:center; gap:.75rem; margin-bottom:1rem; font-size:1rem; font-weight:700; }
    .cat-grid { display:flex; flex-direction:column; gap:.5rem; }
    .cat-card { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); transition:border-color var(--transition-fast); &:hover{border-color:rgba(255,255,255,.12);} }
    .cat-info { display:flex; align-items:center; gap:.75rem; }
    .cat-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .cat-actions { display:flex; align-items:center; gap:.5rem; }
    .cat-empty { padding:1rem; color:var(--text-muted); font-size:.875rem; background:var(--bg-input); border-radius:var(--radius-md); }
  `]
})
export class CategoriasComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  categorias  = signal<Categoria[]>([]);
  saving      = signal(false);
  modal       = signal(false);
  editando    = signal(false);
  showConfirm = signal(false);
  delTarget   = signal<Categoria | null>(null);
  editId: number | null = null;

  form: CategoriaRequest = { nombre: '', descripcion: '', estacion: '' as Estacion, activo: true };

  estaciones = [
    { key: 'COCINA' as Estacion, label: 'Cocina', icon: '🍳', color: 'var(--danger)' },
    { key: 'BARRA'  as Estacion, label: 'Barra',  icon: '🍹', color: 'var(--accent-blue)' },
    { key: 'MEXICO' as Estacion, label: 'México', icon: '🌮', color: 'var(--warning)' },
  ];

  ngOnInit() { this.cargar(); }

  cargar() { this.api.getTodasCategorias().subscribe(c => this.categorias.set(c)); }
  getByEst(e: Estacion) { return this.categorias().filter(c => c.estacion === e); }

  abrirModal(c?: Categoria) {
    this.editando.set(!!c);
    this.editId = c?.id ?? null;
    this.form = { nombre: c?.nombre ?? '', descripcion: c?.descripcion ?? '', estacion: c?.estacion ?? '' as Estacion, activo: c?.activo ?? true };
    this.modal.set(true);
  }
  cerrarModal() { this.modal.set(false); }

  guardar() {
    this.saving.set(true);
    const obs = this.editId ? this.api.updateCategoria(this.editId, this.form) : this.api.createCategoria(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.cerrarModal(); this.cargar(); this.toast.success('Guardado correctamente'); },
      error: e  => { this.saving.set(false); this.toast.error(e.error?.mensaje ?? 'Error'); }
    });
  }

  pedirEliminar(c: Categoria) { this.delTarget.set(c); this.showConfirm.set(true); }
  confirmDelete() {
    this.api.deleteCategoria(this.delTarget()!.id).subscribe({
      next: () => { this.showConfirm.set(false); this.cargar(); this.toast.success('Eliminada'); },
      error: e  => { this.showConfirm.set(false); this.toast.error(e.error?.mensaje ?? 'Error'); }
    });
  }
}
