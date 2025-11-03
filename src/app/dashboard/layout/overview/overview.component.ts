import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Input() recentActivity: any[] = [];
  @Input() isLoading = false;
  @Output() addProduct = new EventEmitter<void>();
  @Output() viewOrders = new EventEmitter<void>();
  @Output() manageCategories = new EventEmitter<void>();
  @Output() viewMessages = new EventEmitter<void>();

  onAddProduct(): void {
    this.addProduct.emit();
  }

  onViewOrders(): void {
    this.viewOrders.emit();
  }

  onManageCategories(): void {
    this.manageCategories.emit();
  }

  onViewMessages(): void {
    this.viewMessages.emit();
  }
}
