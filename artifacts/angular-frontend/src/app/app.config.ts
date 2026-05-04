import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

class ParamAwareReuseStrategy implements RouteReuseStrategy {
  shouldDetach(): boolean { return false; }
  store(): void {}
  shouldAttach(): boolean { return false; }
  retrieve(): DetachedRouteHandle | null { return null; }
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig &&
      JSON.stringify(future.params) === JSON.stringify(curr.params);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: RouteReuseStrategy, useClass: ParamAwareReuseStrategy },
  ],
};
