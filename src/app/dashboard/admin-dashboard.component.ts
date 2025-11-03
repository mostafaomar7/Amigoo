import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';
import { DashboardNotificationToastComponent } from './components/notification-toast/notification-toast.component';
import { DashboardSidebarComponent } from './layout/sidebar/sidebar.component';
import { DashboardHeaderComponent } from './layout/header/header.component';
import { DashboardOverviewComponent } from './layout/overview/overview.component';
import { OrderStatisticsComponent } from './order-statistics/order-statistics.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    DashboardNotificationToastComponent,
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    DashboardOverviewComponent,
    OrderStatisticsComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats = {
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    unreadMessages: 0
  };

  orderStats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  } | null = null;

  recentActivity: any[] = [];
  isLoading = true;
  sidebarCollapsed = false;
  showDashboard = true;
  private dataRefreshInterval?: Subscription;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.checkAuthStatus();
    this.updateDashboardVisibility();
    this.startRealTimeUpdates();

    // Listen to route changes to update dashboard visibility
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateDashboardVisibility();
    });
  }

  ngOnDestroy(): void {
    // Clean up interval subscription
    if (this.dataRefreshInterval) {
      this.dataRefreshInterval.unsubscribe();
    }
  }

  /**
   * Start real-time updates for dashboard data
   * Updates data every 30 seconds without page refresh
   */
  private startRealTimeUpdates(): void {
    // Only update when dashboard is visible
    this.dataRefreshInterval = interval(this.REFRESH_INTERVAL).subscribe(() => {
      if (this.showDashboard && !this.isLoading) {
        this.loadDashboardData();
      }
    });
  }

  private updateDashboardVisibility(): void {
    const url = this.router.url;
    // Show dashboard overview only when on /admin exactly or /admin/, hide it when on child routes
    this.showDashboard = url === '/admin' || url === '/admin/';
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Fetch all dashboard data from API - no static/hardcoded data
    let statsLoaded = false;
    let activityLoaded = false;
    let orderStatsLoaded = false;

    const checkLoadingComplete = () => {
      if (statsLoaded && activityLoaded && orderStatsLoaded) {
        this.isLoading = false;
      }
    };

    // Load stats from API (includes order statistics to avoid duplicate calls)
    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        // All data comes from API endpoints according to API documentation
        // Stats endpoint: GET /Order/stats
        // Products count: GET /product (results field)
        // Messages count: GET /submit (filter by isReplied: false)
        this.stats = {
          totalProducts: stats.totalProducts || 0,
          totalOrders: stats.totalOrders || 0,
          pendingOrders: stats.pendingOrders || 0,
          totalRevenue: stats.totalRevenue || 0,
          unreadMessages: stats.unreadMessages || 0
        };
        // Use order statistics from the same API call to avoid duplication
        this.orderStats = stats.orderStatistics || null;
        statsLoaded = true;
        orderStatsLoaded = true;
        checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading dashboard stats from API:', error);
        this.notificationService.error('Error', 'Failed to load dashboard statistics');
        // Set defaults to 0 if API fails (no static data)
        this.stats = {
          totalProducts: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          unreadMessages: 0
        };
        this.orderStats = null;
        statsLoaded = true;
        orderStatsLoaded = true;
        checkLoadingComplete();
      }
    });

    // Load recent activity from API
    this.dashboardService.getRecentActivity().subscribe({
      next: (activity) => {
        // Recent activity comes from API:
        // - Recent orders: GET /Order?limit=5&sort=-createdAt
        // - Recent products: GET /product?limit=5&sort=-createdAt
        // - Recent messages: GET /submit?limit=5&sort=-createdAt
        this.recentActivity = activity || [];
        activityLoaded = true;
        checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading recent activity from API:', error);
        this.notificationService.error('Error', 'Failed to load recent activity');
        // Empty array if API fails (no static data)
        this.recentActivity = [];
        activityLoaded = true;
        checkLoadingComplete();
      }
    });
  }

  checkAuthStatus(): void {
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }

  addProduct(): void {
    this.router.navigate(['/admin/products']);
  }

  viewOrders(): void {
    this.router.navigate(['/admin/orders']);
  }

  manageCategories(): void {
    this.router.navigate(['/admin/categories']);
  }

  viewMessages(): void {
    this.router.navigate(['/admin/contact-forms']);
  }
}
