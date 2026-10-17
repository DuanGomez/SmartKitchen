import { DcodeaBadgeComponent } from '../../../shared/components/dcodea-badge.component';
import { IconComponent } from '../../../shared/components/icon.component';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { animate, style, transition, trigger, keyframes } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DcodeaBadgeComponent, IconComponent],
  animations: [
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('600ms 100ms cubic-bezier(.16,1,.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('shake', [
      transition('false => true', [
        animate('500ms', keyframes([
          style({ transform: 'translateX(0)',    offset: 0   }),
          style({ transform: 'translateX(-10px)', offset: .1  }),
          style({ transform: 'translateX(10px)',  offset: .3  }),
          style({ transform: 'translateX(-8px)',  offset: .5  }),
          style({ transform: 'translateX(8px)',   offset: .7  }),
          style({ transform: 'translateX(-4px)',  offset: .9  }),
          style({ transform: 'translateX(0)',    offset: 1   }),
        ]))
      ])
    ])
  ],
  template: `
    <div class="login">
      <section class="login__panel">
        <div class="panel" @cardEnter [@shake]="shaking().toString()">
          <div class="brand">
            <span class="brand__mark">SK</span>
            <span class="brand__name">SmartKitchen</span>
          </div>

          <h1>Bienvenido</h1>
          <p class="lead">Inicia sesión para abrir tu turno.</p>

          <form (ngSubmit)="login()" #f="ngForm" class="form">
            <div class="sk-input-group">
              <label for="u">Usuario</label>
              <div class="field">
                <sk-icon class="field__icon" name="user" [size]="18" />
                <input id="u" class="sk-input" type="text" placeholder="Tu usuario"
                       [(ngModel)]="form.username" name="username" required
                       [disabled]="loading()" autocomplete="username">
              </div>
            </div>

            <div class="sk-input-group">
              <label for="p">Contraseña</label>
              <div class="field">
                <sk-icon class="field__icon" name="lock" [size]="18" />
                <input id="p" class="sk-input" [type]="showPass ? 'text' : 'password'" placeholder="••••••••"
                       [(ngModel)]="form.password" name="password" required
                       [disabled]="loading()" autocomplete="current-password">
                <button type="button" class="field__toggle" (click)="showPass = !showPass" tabindex="-1"
                        [attr.aria-label]="showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <sk-icon [name]="showPass ? 'eye-off' : 'eye'" [size]="18" />
                </button>
              </div>
            </div>

            @if (errorMsg()) {
              <div class="error"><sk-icon name="alert" [size]="17" /> {{ errorMsg() }}</div>
            }

            <button class="sk-btn sk-btn-primary sk-btn-lg sk-btn-full" type="submit"
                    [disabled]="loading() || !form.username || !form.password">
              @if (loading()) {
                <span class="sk-spinner sk-spinner-sm" style="border-top-color:#fff"></span> Verificando…
              } @else {
                Ingresar
              }
            </button>
          </form>

          <div class="demo">
            <p class="demo__title">Entrar como</p>
            <div class="roles">
              @for (r of roles; track r.label) {
                <button class="role" (click)="quickLogin(r.user)" [disabled]="loading()">
                  <sk-icon [name]="r.icon" [size]="18" />
                  <span>{{ r.label }}</span>
                </button>
              }
            </div>
          </div>
        </div>
        <app-dcodea-badge class="badge" />
      </section>

      <section class="login__photo" aria-hidden="true">
        <img src="photos/login.webp" alt="" />
        <div class="photo__copy">
          <span class="chip">Punto de venta para restaurantes</span>
          <h2>Del salón a la cocina,<br />sin papelitos.</h2>
          <p>Pedidos por mesa, estaciones de cocina, barra y caja conectadas en tiempo real.</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .login { min-height: 100vh; display: grid; grid-template-columns: minmax(440px, 1fr) 1.15fr; background: var(--bg-base); }

    .login__panel { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.5rem; padding: 3rem 1.5rem; }
    .panel { width: 100%; max-width: 384px; }

    .brand { display: flex; align-items: center; gap: .6rem; margin-bottom: 2.5rem; }
    .brand__mark { width: 34px; height: 34px; border-radius: 10px; background: var(--primary); color: #fff; display: grid; place-items: center; font-family: var(--display); font-weight: 800; font-size: .9rem; }
    .brand__name { font-family: var(--display); font-weight: 700; font-size: 1.3rem; letter-spacing: -.03em; }

    h1 { font-size: 2.2rem; letter-spacing: -.045em; }
    .lead { margin: .4rem 0 2rem; color: var(--text-secondary); }

    .form { display: flex; flex-direction: column; gap: 1.1rem; }
    .field { position: relative; }
    .field__icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
    .field .sk-input { padding-left: 2.8rem; padding-right: 2.8rem; height: 50px; }
    .field__toggle { position: absolute; right: .55rem; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: none; border: none; cursor: pointer; color: var(--text-muted); &:hover { background: var(--bg-hover); color: var(--text-primary); } }
    .form .sk-btn { margin-top: .4rem; height: 52px; }

    .error { display: flex; align-items: center; gap: .5rem; background: var(--danger-bg); color: var(--danger); padding: .75rem 1rem; border-radius: var(--radius-md); font-size: .875rem; animation: slideUp .2s ease; }

    .demo { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
    .demo__title { font-size: .8rem; font-weight: 600; color: var(--text-muted); margin-bottom: .75rem; }
    .roles { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; }
    .role {
      display: flex; flex-direction: column; align-items: flex-start; gap: .55rem;
      padding: .8rem .85rem; border-radius: 14px; background: #fff; border: 1px solid var(--border);
      color: var(--text-primary); font: inherit; font-size: .84rem; font-weight: 600; cursor: pointer;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
      sk-icon { color: var(--text-secondary); }
      &:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); transform: translateY(-1px); sk-icon { color: var(--primary); } }
      &:disabled { opacity: .45; pointer-events: none; }
    }

    .login__photo { position: relative; margin: 1rem 1rem 1rem 0; border-radius: 28px; overflow: hidden; background: var(--bg-soft-2); }
    .login__photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: zoom 18s ease-out both; }
    .login__photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(19,19,22,0) 38%, rgba(19,19,22,.75) 100%); }
    .photo__copy { position: absolute; z-index: 1; left: clamp(28px, 4vw, 56px); right: clamp(28px, 4vw, 56px); bottom: clamp(28px, 4vw, 56px); color: #fff; }
    .chip { display: inline-block; padding: 6px 14px; border-radius: 980px; background: rgba(255,255,255,.18); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); font-size: 13px; font-weight: 600; }
    .photo__copy h2 { margin-top: 18px; color: #fff; font-size: clamp(34px, 3.6vw, 52px); line-height: 1.07; letter-spacing: -.04em; }
    .photo__copy p { margin-top: 14px; max-width: 460px; font-size: 17px; line-height: 1.5; color: rgba(255,255,255,.82); }

    @keyframes zoom { from { transform: scale(1.08); } to { transform: scale(1); } }

    @media (max-width: 960px) {
      .login { grid-template-columns: 1fr; }
      .login__photo { display: none; }
    }
    @media (max-width: 400px) { .roles { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class LoginComponent {
  private authSvc = inject(AuthService);
  private toast   = inject(ToastService);

  form = { username: '', password: '' };
  showPass = false;
  loading  = signal(false);
  shaking  = signal(false);
  errorMsg = signal('');

  roles = [
    { label: 'Admin',   icon: 'dashboard', user: 'admin' },
    { label: 'Mesero',  icon: 'table',     user: 'mesero1' },
    { label: 'Cocina',  icon: 'chef',      user: 'cocina' },
    { label: 'Barra',   icon: 'glass',     user: 'barra' },
    { label: 'México',  icon: 'taco',      user: 'mexico' },
    { label: 'Caja',    icon: 'receipt',   user: 'caja' },
  ];

  quickLogin(username: string) {
    this.form.username = username;
    this.form.password = 'asados123';
    this.login();
  }

  login() {
    if (!this.form.username || !this.form.password) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.authSvc.login(this.form).subscribe({
      next: () => {
        this.toast.success('Bienvenido, tu turno está abierto');
        this.authSvc.redirectByRole();
      },
      error: (e) => {
        this.loading.set(false);
        this.errorMsg.set(e.error?.mensaje ?? 'Credenciales incorrectas');
        this.shaking.set(false);
        setTimeout(() => this.shaking.set(true), 10);
      }
    });
  }
}
