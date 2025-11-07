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

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateDashboardVisibility();
    });
  }

  ngOnDestroy(): void {
    if (this.dataRefreshInterval) {
      this.dataRefreshInterval.unsubscribe();
    }
  }

  private startRealTimeUpdates(): void {
    this.dataRefreshInterval = interval(this.REFRESH_INTERVAL).subscribe(() => {
      if (this.showDashboard && !this.isLoading) {
        this.loadDashboardData();
      }
    });
  }

  private updateDashboardVisibility(): void {
    const url = this.router.url;
    this.showDashboard = url === '/admin' || url === '/admin/';
  }

  loadDashboardData(): void {
    this.isLoading = true;

    let statsLoaded = false;
    let activityLoaded = false;
    let orderStatsLoaded = false;

    const checkLoadingComplete = () => {
      if (statsLoaded && activityLoaded && orderStatsLoaded) {
        this.isLoading = false;
      }
    };

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = {
          totalProducts: stats.totalProducts || 0,
          totalOrders: stats.totalOrders || 0,
          pendingOrders: stats.pendingOrders || 0,
          totalRevenue: stats.totalRevenue || 0,
          unreadMessages: stats.unreadMessages || 0
        };
        this.orderStats = stats.orderStatistics || null;
        statsLoaded = true;
        orderStatsLoaded = true;
        checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.notificationService.error('خطأ', 'فشل تحميل إحصائيات لوحة التحكم');
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

    this.dashboardService.getRecentActivity().subscribe({
      next: (activity) => {
        this.recentActivity = activity || [];
        activityLoaded = true;
        checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading recent activity:', error);
        this.notificationService.error('خطأ', 'فشل تحميل النشاط الأخير');
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
