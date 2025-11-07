import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if this is a pagination request that should skip global loading
    const skipGlobalLoading = request.headers.has('X-Skip-Global-Loading');

    // Show loading for all HTTP requests except pagination requests
    if (!skipGlobalLoading) {
      this.loadingService.show();
    }

    return next.handle(request).pipe(
      finalize(() => {
        // Hide loading when request completes (success or error)
        if (!skipGlobalLoading) {
          this.loadingService.hide();
        }
      })
    );
  }
}
