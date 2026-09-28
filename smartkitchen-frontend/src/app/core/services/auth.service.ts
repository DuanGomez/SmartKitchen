import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, Rol } from '../models/models';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;
const KEY_TOKEN = 'sk_token';
const KEY_USER  = 'sk_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token  = signal<string | null>(localStorage.getItem(KEY_TOKEN));
  private _user   = signal<LoginResponse | null>(JSON.parse(localStorage.getItem(KEY_USER) ?? 'null'));

  token    = computed(() => this._token());
  user     = computed(() => this._user());
  rol      = computed(() => this._user()?.rol ?? null);
  isLogged = computed(() => !!this._token());

  constructor(private http: HttpClient, private router: Router) {}

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${API}/auth/login`, body).pipe(
      tap(res => {
        localStorage.setItem(KEY_TOKEN, res.token);
        localStorage.setItem(KEY_USER,  JSON.stringify(res));
        this._token.set(res.token);
        this._user.set(res);
      })
    );
  }

  logout() {
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_USER);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  redirectByRole() {
    const routes: Record<Rol, string> = {
      ADMIN:  '/admin/dashboard',
      MESERO: '/mesero/mesas',
      CAJA:   '/caja',
      COCINA: '/estacion/cocina',
      BARRA:  '/estacion/barra',
      MEXICO: '/estacion/mexico',
    };
    const r = this.rol();
    this.router.navigate([r ? routes[r] : '/login']);
  }
}
