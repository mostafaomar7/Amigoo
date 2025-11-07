import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService, PaginationParams } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { EnvironmentService } from '../../services/environment.service';

export interface OrderItem {
  productId: {
    _id: string;
    title: string;
    description?: string;
    imageCover: string;
    category: {
      name: string;
    };
  };
  sizeName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  _id?: string;
}

export interface Order {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  orderNumber: string;
  status: 'pending' | 'completed' | 'cancelled';
  fullName: string;
  country: string;
  streetAddress: string;
  state: string;
  phone: string;
  email: string;
  shippingAddress?: boolean;
  orderNotes?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingCost: number;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  isLoading = false;
  showStatusModal = false;
  showDetailsModal = false;
  selectedOrder: Order | null = null;
  statusForm: FormGroup;
  statusFilter: string = '';
  searchTerm = '';
  private searchTimeout: any = null;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private environmentService: EnvironmentService,
    private fb: FormBuilder
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    // Clear search timeout on component destroy
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    const params: PaginationParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: '-createdAt'
    };

    // Add search keyword if set
    if (this.searchTerm) {
      params.keyword = this.searchTerm;
    }

    // Add status filter to params if set
    if (this.statusFilter) {
      params.status = this.statusFilter;
    }

    this.apiService.getPaginated<Order>('/Order', params).subscribe({
      next: (response) => {
        this.orders = response.data || [];

        // Use unified pagination format from API
        if (response.pagination) {
          this.totalItems = response.pagination.totalItems || 0;
          this.totalPages = response.pagination.totalPages || 0;
          if (response.pagination.itemsPerPage) {
            this.itemsPerPage = response.pagination.itemsPerPage;
          }
        } else {
          const ordersLength = this.orders.length;
          this.totalItems = ordersLength;
          this.totalPages = ordersLength > 0 ? Math.max(1, Math.ceil(ordersLength / this.itemsPerPage)) : 0;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoading = false;
        this.totalPages = 0;
        this.totalItems = 0;
        this.notificationService.error('خطأ', 'فشل في تحميل الطلبات');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onSearchInput(): void {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search - wait 500ms after user stops typing
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadOrders();
    }, 500);
  }

  onStatusFilter(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  showOrderDetailsModal(order: Order): void {
    this.apiService.getById<Order>('/Order', order._id).subscribe({
      next: (response: any) => {
        this.selectedOrder = response.data || order;
        this.showDetailsModal = true;
        document.body.classList.add('modal-open');
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.selectedOrder = order;
        this.showDetailsModal = true;
        document.body.classList.add('modal-open');
        this.notificationService.error('تحذير', 'تعذر تحميل تفاصيل الطلب الكاملة. قد تكون بعض البيانات غير مكتملة.');
      }
    });
  }

  showUpdateStatusModal(order: Order): void {
    this.selectedOrder = order;
    this.statusForm.patchValue({
      status: order.status
    });
    this.showStatusModal = true;
    document.body.classList.add('modal-open');
  }

  updateStatus(): void {
    if (this.statusForm.valid && this.selectedOrder) {
      const statusData = {
        status: this.statusForm.value.status
      };

      this.apiService.putCustom<any>(`/Order/${this.selectedOrder._id}/status`, statusData).subscribe({
        next: (response: any) => {
          this.notificationService.success('نجاح', 'تم تحديث حالة الطلب بنجاح');
          this.closeModals();
          this.loadOrders();
        },
        error: (error) => {
          console.error('Error updating order status:', error);
          this.notificationService.error('خطأ', error.error?.message || 'فشل في تحديث حالة الطلب');
        }
      });
    }
  }

  updateOrderStatusDirectly(order: Order, newStatus: string): void {
    if (order.status === newStatus) return;

    const statusData = {
      status: newStatus
    };

    this.apiService.putCustom<any>(`/Order/${order._id}/status`, statusData).subscribe({
      next: (response: any) => {
        this.notificationService.success('Success', 'Order status updated successfully');
        this.loadOrders();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.notificationService.error('Error', error.error?.message || 'Failed to update order status');
      }
    });
  }

  closeModals(): void {
    this.showStatusModal = false;
    this.showDetailsModal = false;
    this.selectedOrder = null;
    document.body.classList.remove('modal-open');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-warning';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  get filteredOrders(): Order[] {
    return this.orders;
  }

  get pageNumbers(): number[] {
    if (!this.totalPages || this.totalPages <= 0) {
      return [];
    }
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${imagePath}`;
  }
}
