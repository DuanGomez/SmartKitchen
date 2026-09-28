import { DcodeaBadgeComponent } from '../../../shared/components/dcodea-badge.component';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { animate, style, transition, trigger, keyframes } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DcodeaBadgeComponent],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms ease', style({ opacity: 1 }))
      ])
    ]),
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(32px)' }),
        animate('500ms 200ms cubic-bezier(.34,1.2,.64,1)', style({ opacity: 1, transform: 'translateY(0)' }))
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
    <div class="login-page" @pageEnter>
      <!-- Animated background orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <div class="login-wrapper" @cardEnter>
        <!-- Brand -->
        <div class="login-brand">
          <div class="brand-mark">SK</div>
          <div>
            <div class="brand-name">SmartKitchen</div>
            <div class="brand-sub">Restaurant POS System</div>
          </div>
        </div>
        <div class="brand-chip"><span class="dc-chip">Dcodea · POS para restaurantes</span></div>

        <!-- Card -->
        <div class="login-card" [@shake]="shaking().toString()">
          <div class="card-header">
            <h2>Bienvenido</h2>
            <p class="text-muted text-sm">Inicia sesión para continuar</p>
          </div>

          <form (ngSubmit)="login()" #f="ngForm" class="login-form">
            <div class="sk-input-group">
              <label>Usuario</label>
              <div class="input-wrapper">
                <span class="input-icon">◉</span>
                <input class="sk-input with-icon" type="text"
                       placeholder="Ingresa tu usuario"
                       [(ngModel)]="form.username" name="username" required
                       [disabled]="loading()" autocomplete="username">
              </div>
            </div>

            <div class="sk-input-group">
              <label>Contraseña</label>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input class="sk-input with-icon" [type]="showPass ? 'text' : 'password'"
                       placeholder="••••••••"
                       [(ngModel)]="form.password" name="password" required
                       [disabled]="loading()" autocomplete="current-password">
                <button type="button" class="pass-toggle" (click)="showPass = !showPass" tabindex="-1">
                  {{ showPass ? '🙈' : '👁' }}
                </button>
              </div>
            </div>

            @if (errorMsg()) {
              <div class="error-msg">
                <span>⚠</span> {{ errorMsg() }}
              </div>
            }

            <button class="sk-btn sk-btn-primary sk-btn-lg sk-btn-full" type="submit"
                    [disabled]="loading() || !form.username || !form.password">
              @if (loading()) {
                <span class="sk-spinner sk-spinner-sm"></span> Verificando...
              } @else {
                <span>Ingresar al sistema</span>
              }
            </button>
          </form>

          <!-- Quick access -->
          <div class="quick-access">
            <p class="text-xs text-muted" style="text-align:center; margin-bottom:.75rem">Acceso rápido</p>
            <div class="role-chips">
              @for (r of roles; track r.label) {
                <button class="role-chip" (click)="quickLogin(r.user)" [disabled]="loading()">
                  <span>{{ r.icon }}</span>
                  <span>{{ r.label }}</span>
                </button>
              }
            </div>
          </div>
        </div>

        <div class="login-footer">
          <app-dcodea-badge />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .brand-chip { display:flex; justify-content:center; margin: -.5rem 0 1.25rem; }
    .brand-chip .dc-chip { color:#FFB38F; background:rgba(255,107,53,.12); border-color:rgba(255,107,53,.35); }
    .login-footer { display:flex; justify-content:center; margin-top:1.5rem; }
    .login-page {
      min-height: 100vh;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .orb-1 { width: 500px; height: 500px; background: rgba(255,107,53,.08); top: -150px; right: -100px; }
    .orb-2 { width: 400px; height: 400px; background: rgba(124,92,230,.06); bottom: -100px; left: -80px; }
    .orb-3 { width: 300px; height: 300px; background: rgba(0,184,148,.05); top: 50%; left: 50%; transform: translate(-50%,-50%); }

    .login-wrapper {
      width: 100%;
      max-width: 440px;
      padding: 1.5rem;
      z-index: 1;
    }

    .login-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      justify-content: center;
    }
    .brand-mark {
      width: 52px; height: 52px;
      background: var(--primary);
      border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 800; color: #fff;
      box-shadow: 0 0 32px rgba(255,107,53,.4);
    }
    .brand-name { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .brand-sub  { font-size: .75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; }

    .login-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      box-shadow: 0 16px 64px rgba(0,0,0,.5);
    }

    .card-header { margin-bottom: 2rem; h2 { margin-bottom: .35rem; } }

    .login-form { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem; }

    .input-wrapper { position: relative; }
    .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: .9rem; color: var(--text-muted); pointer-events: none; }
    .sk-input.with-icon { padding-left: 2.75rem; }
    .pass-toggle {
      position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 1rem; opacity: .6;
      &:hover { opacity: 1; }
    }

    .error-msg {
      display: flex; align-items: center; gap: .5rem;
      background: var(--danger-bg); border: 1px solid rgba(225,112,85,.3);
      color: var(--danger); padding: .75rem 1rem; border-radius: var(--radius-md);
      font-size: .875rem; animation: slideUp .2s ease;
    }

    .quick-access { border-top: 1px solid var(--border); padding-top: 1.25rem; margin-top: 1.25rem; }
    .role-chips { display: flex; gap: .5rem; flex-wrap: wrap; }
    .role-chip {
      display: flex; align-items: center; gap: .4rem;
      padding: .35rem .75rem; border-radius: var(--radius-full);
      background: var(--bg-input); border: 1px solid var(--border);
      color: var(--text-secondary); font-size: .75rem; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: all var(--transition-fast);
      &:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-active); }
      &:disabled { opacity: .4; pointer-events: none; }
    }

    .login-footer { text-align: center; color: var(--text-muted); font-size: .72rem; margin-top: 1.5rem; }
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
    { label: 'Admin',   icon: '👑', user: 'admin' },
    { label: 'Mesero',  icon: '🙋', user: 'mesero1' },
    { label: 'Cocina',  icon: '🍳', user: 'cocina' },
    { label: 'Barra',   icon: '🍹', user: 'barra' },
    { label: 'México',  icon: '🌮', user: 'mexico' },
    { label: 'Caja',    icon: '💰', user: 'caja' },
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
        this.toast.success('¡Bienvenido al sistema!');
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
