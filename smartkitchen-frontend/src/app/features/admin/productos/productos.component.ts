import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { productImageUrl } from '../../../core/utils/img';
import { ToastService } from '../../../core/services/toast.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Producto, Categoria, ProductoRequest } from '../../../core/models/models';
import { animate, style, transition, trigger } from '@angular/animations';
import { IconComponent } from '../../../shared/components/icon.component';


@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, SidebarComponent, TopbarComponent, ToastComponent, ConfirmDialogComponent, IconComponent],
  animations: [
    trigger('rowAnim', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(-8px)' }), animate('200ms ease', style({ opacity: 1, transform: 'translateY(0)' }))])
    ])
  ],
  template: `
    <sk-toast></sk-toast>
    @if (showConfirm()) {
      <sk-confirm-dialog title="Eliminar producto" [message]="'¿Eliminar «' + (delTarget()?.nombre ?? '') + '»? Esta acción no se puede deshacer.'"
        (confirm)="confirmDelete()" (cancel)="showConfirm.set(false)"></sk-confirm-dialog>
    }
    <div class="sk-layout">
      <sk-sidebar></sk-sidebar>
      <div class="sk-main">
        <sk-topbar title="Productos" subtitle="Gestiona el catálogo del restaurante"></sk-topbar>
        <div class="sk-content">

          <!-- Header -->
          <div class="sk-page-header">
            <div class="page-title"><h2>Catálogo</h2><p>{{ filtrados().length }} productos</p></div>
            <div class="page-actions">
              <div style="position:relative">
                <sk-icon name="search" [size]="17" style="position:absolute;left:.95rem;top:50%;transform:translateY(-50%);color:var(--text-muted)" />
                <input class="sk-input search" style="padding-left:2.6rem;width:240px;border-radius:999px" placeholder="Buscar producto..."
                       [(ngModel)]="q" (ngModelChange)="filtrar()">
              </div>
              <select class="sk-select" style="width:200px;border-radius:999px" [(ngModel)]="catFiltro" (ngModelChange)="filtrar()">
                <option value="">Todas las categorías</option>
                @for (c of categorias(); track c.id) { <option [value]="c.id">{{ c.nombre }}</option> }
              </select>
              <button class="sk-btn sk-btn-primary" (click)="abrirModal()"><sk-icon name="plus" [size]="18" /> Agregar</button>
            </div>
          </div>

          <!-- Table -->
          @if (loading()) {
            <div class="flex justify-center" style="padding:4rem"><div class="sk-spinner"></div></div>
          } @else if (filtrados().length === 0) {
            <div class="empty-state"><div class="empty-icon"><sk-icon name="box" /></div><p>No hay productos</p><button class="sk-btn sk-btn-primary" (click)="abrirModal()"><sk-icon name="plus" [size]="18" /> Agregar el primero</button></div>
          } @else {
            <div class="sk-card" style="padding:0;overflow:hidden">
              <table class="sk-table">
                <thead>
                  <tr><th>Producto</th><th>Categoría</th><th>Estación</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  @for (p of filtrados(); track p.id) {
                    <tr @rowAnim>
                      <td>
                        <div class="flex items-center gap-1">
                          <div class="prod-thumb">
                            @if (p.imagen) { <img [src]="imgUrl(p.imagen)!" [alt]="p.nombre"> }
                            @else { <sk-icon name="image" [size]="18" /> }
                          </div>
                          <div>
                            <div class="fw-600 text-sm">{{ p.nombre }}</div>
                            <div class="text-xs text-muted truncate" style="max-width:200px">{{ p.descripcion }}</div>
                          </div>
                        </div>
                      </td>
                      <td><span class="text-sm">{{ p.categoriaNombre }}</span></td>
                      <td><span class="sk-badge badge-muted">{{ estLabel[p.estacion] ?? p.estacion }}</span></td>
                      <td><span class="fw-600">{{ p.precio | currency:'COP':'$':'1.0-0' }}</span></td>
                      <td>
                        <span class="sk-badge" [class]="p.activo ? 'badge-success' : 'badge-muted'">
                          {{ p.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <button class="sk-btn sk-btn-ghost sk-btn-sm" (click)="abrirModal(p)" title="Editar" aria-label="Editar"><sk-icon name="edit" [size]="16" /></button>
                          <button class="sk-btn sk-btn-danger sk-btn-sm" (click)="pedirEliminar(p)" title="Eliminar" aria-label="Eliminar"><sk-icon name="trash" [size]="16" /></button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Modal -->
    @if (modal()) {
      <div class="sk-overlay" (click)="cerrarModal()">
        <div class="sk-modal" style="width:min(620px,95vw)" (click)="$event.stopPropagation()">
          <div class="sk-modal-header">
            <h3>{{ editando() ? 'Editar producto' : 'Nuevo producto' }}</h3>
            <button class="sk-btn sk-btn-ghost sk-btn-icon" (click)="cerrarModal()" aria-label="Cerrar"><sk-icon name="close" [size]="18" /></button>
          </div>

          <form (ngSubmit)="guardar()" #frm="ngForm">
            <div class="grid-2">
              <div class="sk-input-group">
                <label>Nombre *</label>
                <input class="sk-input" [(ngModel)]="form.nombre" name="nombre" required placeholder="Ej: Churrasco">
              </div>
              <div class="sk-input-group">
                <label>Precio *</label>
                <input class="sk-input" type="number" [(ngModel)]="form.precio" name="precio" required min="1" placeholder="0">
              </div>
            </div>
            <div class="sk-input-group mt-2">
              <label>Descripción</label>
              <textarea class="sk-textarea" [(ngModel)]="form.descripcion" name="descripcion" placeholder="Descripción del plato..."></textarea>
            </div>
            <div class="grid-2 mt-2">
              <div class="sk-input-group">
                <label>Categoría *</label>
                <select class="sk-select" [(ngModel)]="form.categoriaId" name="categoriaId" required>
                  <option value="">Seleccionar...</option>
                  @for (c of categorias(); track c.id) { <option [value]="c.id">{{ c.nombre }} ({{ c.estacion }})</option> }
                </select>
              </div>
              <div class="sk-input-group">
                <label>Estado</label>
                <select class="sk-select" [(ngModel)]="form.activo" name="activo">
                  <option [ngValue]="true">Activo</option>
                  <option [ngValue]="false">Inactivo</option>
                </select>
              </div>
            </div>
            <div class="sk-input-group mt-2">
              <label>Imagen</label>
              <div class="img-upload" (click)="fileInput.click()">
                @if (previewImg) {
                  <img [src]="previewImg" style="max-height:140px;border-radius:var(--radius-md)">
                } @else {
                  <div class="upload-placeholder"><sk-icon name="image" [size]="22" /> Clic para subir una foto</div>
                }
              </div>
              <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFile($event)">
            </div>
            <div class="sk-modal-footer">
              <button type="button" class="sk-btn sk-btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="sk-btn sk-btn-primary" [disabled]="saving() || !form.nombre || !form.precio || !form.categoriaId">
                @if (saving()) { <span class="sk-spinner sk-spinner-sm"></span> } {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .prod-thumb { width:48px; height:48px; border-radius:12px; background:var(--bg-soft); color:var(--text-muted); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; img{width:100%;height:100%;object-fit:cover;} }
    .img-upload { border:1.5px dashed var(--border-strong); background:var(--bg-base); border-radius:var(--radius-md); padding:1.5rem; cursor:pointer; display:flex; align-items:center; justify-content:center; min-height:100px; transition:border-color var(--transition-fast); &:hover{border-color:var(--ink);} }
    .upload-placeholder { color:var(--text-muted); font-size:.875rem; display:flex; align-items:center; gap:.5rem; }
    @media (max-width: 767px) {
      .sk-table th:nth-child(2), .sk-table td:nth-child(2), .sk-table th:nth-child(3), .sk-table td:nth-child(3), .sk-table th:nth-child(5), .sk-table td:nth-child(5) { display:none; }
      .sk-table td { white-space:normal; }
      .page-actions .sk-input, .page-actions .sk-select { width:100% !important; }
      .page-actions > div { width:100%; }
    }
  `]
})
export class ProductosComponent implements OnInit {
  imgUrl = productImageUrl;
  estLabel: Partial<Record<string, string>> = { COCINA: 'Cocina', BARRA: 'Barra', MEXICO: 'México' };
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  loading     = signal(true);
  saving      = signal(false);
  modal       = signal(false);
  editando    = signal(false);
  showConfirm = signal(false);
  delTarget   = signal<Producto | null>(null);

  productos   = signal<Producto[]>([]);
  filtrados   = signal<Producto[]>([]);
  categorias  = signal<Categoria[]>([]);

  q         = '';
  catFiltro = '';
  editId: number | null = null;
  previewImg: string | null = null;
  imgFile: File | null = null;

  form: ProductoRequest & { descripcion: string } = { nombre: '', precio: 0, descripcion: '', categoriaId: 0 as any, activo: true };

  ngOnInit() {
    this.api.getTodasCategorias().subscribe(c => this.categorias.set(c));
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.api.getTodosProductos().subscribe({ next: p => { this.productos.set(p); this.filtrar(); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  filtrar() {
    let f = this.productos();
    if (this.q) f = f.filter(p => p.nombre.toLowerCase().includes(this.q.toLowerCase()));
    if (this.catFiltro) f = f.filter(p => p.categoriaId == +this.catFiltro);
    this.filtrados.set(f);
  }

  abrirModal(p?: Producto) {
    this.editando.set(!!p);
    this.editId = p?.id ?? null;
    this.previewImg = productImageUrl(p?.imagen);
    this.imgFile = null;
    this.form = { nombre: p?.nombre ?? '', precio: p?.precio ?? 0, descripcion: p?.descripcion ?? '', categoriaId: p?.categoriaId ?? ('' as any), activo: p?.activo ?? true };
    this.modal.set(true);
  }

  cerrarModal() { this.modal.set(false); }

  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.imgFile = f;
    const r = new FileReader();
    r.onload = ev => this.previewImg = ev.target?.result as string;
    r.readAsDataURL(f);
  }

  guardar() {
    this.saving.set(true);
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(this.form)], { type: 'application/json' }));
    if (this.imgFile) fd.append('imagen', this.imgFile);
    const obs = this.editId ? this.api.updateProducto(this.editId, fd) : this.api.createProducto(fd);
    obs.subscribe({
      next: () => { this.saving.set(false); this.cerrarModal(); this.cargar(); this.toast.success(this.editId ? 'Producto actualizado' : 'Producto creado'); },
      error: e  => { this.saving.set(false); this.toast.error(e.error?.mensaje ?? 'Error al guardar'); }
    });
  }

  pedirEliminar(p: Producto) { this.delTarget.set(p); this.showConfirm.set(true); }
  confirmDelete() {
    if (!this.delTarget()) return;
    this.api.deleteProducto(this.delTarget()!.id).subscribe({
      next: () => { this.showConfirm.set(false); this.cargar(); this.toast.success('Producto eliminado'); },
      error: e  => { this.showConfirm.set(false); this.toast.error(e.error?.mensaje ?? 'Error al eliminar'); }
    });
  }
}
