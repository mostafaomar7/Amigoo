import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class DashboardOverviewComponent {
  @Input() stats = {
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    unreadMessages: 0
  };
  @Input() isLoading = false;

  constructor(private router: Router) {}

  onAddProduct(): void {
    this.router.navigate(['/admin/products']);
  }

  onViewOrders(): void {
    this.router.navigate(['/admin/orders']);
  }

  onManageCategories(): void {
    this.router.navigate(['/admin/categories']);
  }

  onViewMessages(): void {
    this.router.navigate(['/admin/contact-forms']);
  }
}
