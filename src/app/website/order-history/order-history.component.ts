import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { OrderStorageService } from '../../services/order-storage.service';
import { NotificationService } from '../../services/notification.service';
import { EnvironmentService } from '../../services/environment.service';
import { ApiService } from '../../services/api.service';

/**
 * Order History Component
 *
 * Displays all past orders stored in LocalStorage
 * Syncs with API to update order statuses
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
  syncing = false;

  // Status labels in Arabic
  statusLabels: { [key: string]: string } = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'completed': 'مكتمل',
    'shipped': 'تم الشحن',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغي'
  };

  // Status colors matching project style
  statusColors: { [key: string]: string } = {
    'pending': '#ffc107',
    'confirmed': '#17a2b8',
    'completed': '#28a745',
    'shipped': '#007bff',
    'delivered': '#28a745',
    'cancelled': '#dc3545'
  };

  // Status icons
  statusIcons: { [key: string]: string } = {
    'pending': 'fa-clock',
    'confirmed': 'fa-check-circle',
    'completed': 'fa-check-double',
    'shipped': 'fa-truck',
    'delivered': 'fa-box-check',
    'cancelled': 'fa-times-circle'
  };

  constructor(
    private orderStorageService: OrderStorageService,
    private notificationService: NotificationService,
    private environmentService: EnvironmentService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.syncOrdersFromAPI();
  }

  /**
   * Load orders from LocalStorage
   */
  loadOrders(): void {
    this.loading = true;
    this.orders = this.orderStorageService.getOrders();
    // Sort by date (newest first)
    this.orders.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    this.loading = false;
    this.cdr.markForCheck();
  }

  /**
   * Sync orders from API and update localStorage
   * Matches orders by email or phone number
   */
  syncOrdersFromAPI(): void {
    this.syncing = true;

    // Get local orders to extract email/phone for matching
    const localOrders = this.orderStorageService.getOrders();
    if (localOrders.length === 0) {
      this.syncing = false;
      this.cdr.markForCheck();
      return;
    }

    // Get unique emails and phones from local orders
    const emails = [...new Set(localOrders.map(o => o.email).filter(Boolean))];
    const phones = [...new Set(localOrders.map(o => o.primaryPhone).filter(Boolean))];

    // Fetch orders from API (try to get all orders, API will filter)
    this.apiService.getPaginated<any>('/Order', { limit: 1000, sort: '-createdAt' }, true).subscribe({
      next: (response) => {
        const apiOrders = response.data || [];
        let updatedCount = 0;

        // Match API orders with local orders by email or phone
        apiOrders.forEach((apiOrder: any) => {
          const matchingLocalOrder = localOrders.find((localOrder: any) => {
            // Match by orderId if available
            if (localOrder.orderId && apiOrder._id === localOrder.orderId) {
              return true;
            }
            // Match by email
            if (apiOrder.email && localOrder.email &&
                apiOrder.email.toLowerCase() === localOrder.email.toLowerCase()) {
              return true;
            }
            // Match by phone
            if (apiOrder.phone && localOrder.primaryPhone &&
                apiOrder.phone === localOrder.primaryPhone) {
              return true;
            }
            // Match by orderNumber if available
            if (apiOrder.orderNumber && localOrder.orderNumber &&
                apiOrder.orderNumber === localOrder.orderNumber) {
              return true;
            }
            return false;
          });

          if (matchingLocalOrder) {
            // Update local order with API status and other fields
            const updatedOrder = {
              ...matchingLocalOrder,
              status: apiOrder.status || matchingLocalOrder.status,
              orderId: apiOrder._id || matchingLocalOrder.orderId,
              orderNumber: apiOrder.orderNumber || matchingLocalOrder.orderNumber,
              updatedAt: apiOrder.updatedAt || new Date().toISOString()
            };

            // Update in localStorage
            const allOrders = this.orderStorageService.getOrders();
            const orderIndex = allOrders.findIndex((o: any) => o.id === matchingLocalOrder.id);
            if (orderIndex !== -1) {
              allOrders[orderIndex] = updatedOrder;
              localStorage.setItem('orderHistory', JSON.stringify(allOrders));
              updatedCount++;
            }
          } else if ((apiOrder.email && emails.includes(apiOrder.email)) ||
                     (apiOrder.phone && phones.includes(apiOrder.phone))) {
            // New order from API that matches user's email/phone but not in local storage
            // Convert API order format to local format and add it
            const newOrder = this.convertApiOrderToLocal(apiOrder);
            if (newOrder) {
              this.orderStorageService.saveOrder(newOrder);
              updatedCount++;
            }
          }
        });

        // Reload orders after sync
        this.loadOrders();

        if (updatedCount > 0) {
          // Dispatch event to update navbar
          document.dispatchEvent(new CustomEvent('orderHistoryUpdated'));
        }

        this.syncing = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error syncing orders from API:', error);
        // Continue with local orders even if API fails
        this.syncing = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Convert API order format to local storage format
   */
  private convertApiOrderToLocal(apiOrder: any): any | null {
    try {
      return {
        id: apiOrder._id || `ORD-${Date.now()}`,
        orderId: apiOrder._id,
        orderNumber: apiOrder.orderNumber,
        fullName: apiOrder.fullName || apiOrder.shippingAddress?.fullName || '',
        email: apiOrder.email || apiOrder.shippingAddress?.email || '',
        primaryPhone: apiOrder.phone || apiOrder.shippingAddress?.phone || '',
        detailedAddress: apiOrder.streetAddress || apiOrder.shippingAddress?.streetAddress || '',
        governorate: apiOrder.state?.split(',')[0] || apiOrder.shippingAddress?.state?.split(',')[0] || '',
        city: apiOrder.state?.split(',')[1]?.trim() || apiOrder.shippingAddress?.state?.split(',')[1]?.trim() || '',
        items: (apiOrder.items || []).map((item: any) => ({
          title: item.productId?.title || item.title || 'منتج',
          imageCover: item.productId?.imageCover || item.imageCover || '',
          sizeName: item.sizeName || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          totalPrice: item.totalPrice || (item.price * item.quantity) || 0
        })),
        subtotal: apiOrder.totalAmount || 0,
        shippingCost: apiOrder.shippingCost || 0,
        vat: 0, // Calculate if needed
        total: apiOrder.finalAmount || apiOrder.totalAmount || 0,
        notes: apiOrder.orderNotes || '',
        status: apiOrder.status || 'pending',
        createdAt: apiOrder.createdAt || new Date().toISOString(),
        updatedAt: apiOrder.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error converting API order:', error);
      return null;
    }
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
   * Get status icon
   */
  getStatusIcon(status: string): string {
    return this.statusIcons[status] || 'fa-circle';
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

  /**
   * Track by function for ngFor
   */
  trackByOrderId(index: number, order: any): string {
    return order.id || index.toString();
  }
}
