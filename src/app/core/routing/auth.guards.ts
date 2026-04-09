import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../auth/session.store';
import { APP_ROUTE_PATHS } from './app-routes.constants';

const createRedirectTree = (path: string) => inject(Router).parseUrl(path);

export const redirectAuthenticatedUserGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);

  return sessionStore.isAuthenticated()
    ? createRedirectTree(APP_ROUTE_PATHS.menuOverview)
    : true;
};

export const requireAuthenticatedUserGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);

  return sessionStore.isAuthenticated()
    ? true
    : createRedirectTree(APP_ROUTE_PATHS.root);
};
