import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Global HTTP interceptor that shows toast notifications on errors.
 * To skip toasts for a request, set header 'x-skip-toast' to 'true'.
 */
export const httpToastInterceptor: HttpInterceptorFn = (req, next) => {
  const msg = inject(MessageService);
  const skip = req.headers.get('x-skip-toast') === 'true';

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!skip && err instanceof HttpErrorResponse) {
        const status = err.status;
        const method = req.method?.toUpperCase() || 'GET';
        const path = (req.url || '').split('?')[0];

        // Silenciar 404 en GET (p. ej., listas vacías) y 0 aborts
        if ((method === 'GET' && status === 404) || status === 0) {
          if (status === 0) {
            msg.add({ severity: 'error', summary: 'Sin conexión', detail: 'No se pudo contactar al servidor.', life: 3000 });
          }
          return throwError(() => err);
        }

        const lower = path.toLowerCase();
        const domain = lower.includes('/transactions')
          ? 'Movimientos'
          : lower.includes('/categories')
          ? 'Categorías'
          : lower.includes('/accounts')
          ? 'Cuentas'
          : lower.includes('/budget') || lower.includes('/fixed')
          ? 'Presupuesto'
          : 'Error de red';

        // Mensajes más amigables para códigos comunes
        let detail = (err.error?.title || err.error?.message || err.message || 'Error').toString();
        if (status === 409) detail = 'Conflicto: el recurso ya existe o está en uso.';
        if (status === 400 && /validation|validaci/i.test(detail)) detail = 'Datos inválidos. Revisa el formulario.';
        if (status === 403) detail = 'Acceso denegado.';
        if (status === 404 && method !== 'GET') detail = 'Recurso no encontrado.';

        msg.add({ severity: 'error', summary: domain, detail, life: 3500 });
      }
      return throwError(() => err);
    })
  );
};
