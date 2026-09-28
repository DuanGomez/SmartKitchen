import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLogged()) { router.navigate(['/login']); return false; }
  return true;
};

export const roleGuard = (roles: Rol[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLogged()) { router.navigate(['/login']); return false; }
  if (!roles.includes(auth.rol()!)) { auth.redirectByRole(); return false; }
  return true;
};
