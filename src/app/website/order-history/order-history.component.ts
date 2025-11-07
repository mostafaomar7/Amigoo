import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { OrderStorageService } from '../../services/order-storage.service';
import { NotificationService } from '../../services/notification.service';
import { EnvironmentService } from '../../services/environment.service';

/**
 * Order History Component
 *
 * Displays all past orders stored in LocalStorage
 * Simple component to show order history to users
 */
@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {
  orders: any[] = [];
  loading = false;

  // Status labels in Arabic
  statusLabels: { [key: string]: string } = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'shipped': 'تم الشحن',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغي'
  };

  // Status colors
  statusColors: { [key: string]: string } = {
    'pending': '#ffc107',
    'confirmed': '#17a2b8',
    'shipped': '#007bff',
    'delivered': '#28a745',
    'cancelled': '#dc3545'
  };

  constructor(
    private orderStorageService: OrderStorageService,
    private notificationService: NotificationService,
    private environmentService: EnvironmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  /**
   * Load orders from LocalStorage
   */
  loadOrders(): void {
    this.loading = true;
    this.orders = this.orderStorageService.getOrders();
    this.loading = false;
    this.cdr.markForCheck();
  }

  /**
   * Get status label in Arabic
   */
  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    return this.statusColors[status] || '#666';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get image URL for product
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${imagePath}`;
  }

  /**
   * Delete order from history
   */
  deleteOrder(orderId: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الطلب من السجل؟')) {
      const deleted = this.orderStorageService.deleteOrder(orderId);
      if (deleted) {
        this.notificationService.success('تم الحذف', 'تم حذف الطلب من السجل بنجاح');
        this.loadOrders();
      } else {
        this.notificationService.error('خطأ', 'فشل حذف الطلب');
      }
    }
  }

  /**
   * Clear all orders (for testing/cleanup)
   */
  clearAllOrders(): void {
    if (confirm('هل أنت متأكد من حذف جميع الطلبات من السجل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      this.orderStorageService.clearAllOrders();
      this.notificationService.success('تم الحذف', 'تم حذف جميع الطلبات من السجل');
      this.loadOrders();
    }
  }
}
