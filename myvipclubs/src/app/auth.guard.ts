import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VipService } from './vip.service';

export const authGuard: CanActivateFn = () => {
  const vip = inject(VipService);
  const router = inject(Router);
  if (vip.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};
