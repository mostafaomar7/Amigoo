import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class DashboardSidebarComponent {
  @Input() sidebarCollapsed = false;
  @Input() pendingOrders = 0;
  @Input() unreadMessages = 0;
  @Output() toggleSidebar = new EventEmitter<void>();

  private isMobileView = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkMobileView();
    // Listen to route changes and close sidebar on mobile
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobileView && !this.sidebarCollapsed) {
          this.toggleSidebar.emit();
        }
      });
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkMobileView();
  }

  private checkMobileView(): void {
    this.isMobileView = window.innerWidth < 992;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    this.authService.logout();
  }

  onNavLinkClick(): void {
    // Close sidebar on mobile/tablet when a navigation link is clicked
    if (this.isMobileView && !this.sidebarCollapsed) {
      this.toggleSidebar.emit();
    }
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }
}
