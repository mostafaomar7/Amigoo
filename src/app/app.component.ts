import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { SpinnerComponent } from './website/shared/spinner/spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, SpinnerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'amigo';
  private routerSubscription?: Subscription;
  loading = false;
  routeLoading = false;

  private previousUrl = '';

  constructor(
    private router: Router,
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize previous URL with current route
    this.previousUrl = this.router.url.split('?')[0];

    // Subscribe to loading service for HTTP requests
    this.loadingService.loading$.subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    // Handle route navigation loading
    // Only show loading for actual route changes (not just query params)
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        const currentUrl = event.url.split('?')[0]; // Get URL without query params
        // Only show route loading if the route path actually changed
        if (currentUrl !== this.previousUrl) {
          this.routeLoading = true;
          this.previousUrl = currentUrl;
          this.cdr.markForCheck();
        }
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Update previous URL
        if (event instanceof NavigationEnd) {
          this.previousUrl = event.urlAfterRedirects.split('?')[0];
        }
        // Only hide route loading if it was actually shown
        if (this.routeLoading) {
          this.routeLoading = false;
          // Scroll to top on route change
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
          this.cdr.markForCheck();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  get isLoading(): boolean {
    return this.loading || this.routeLoading;
  }
}
