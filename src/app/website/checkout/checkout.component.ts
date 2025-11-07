import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Order } from '../models/category';
import { CategoryService } from '../../services/category.service';
import { OpencartService } from '../../services/opencart.service';
import { EnvironmentService } from '../../services/environment.service';
import { NotificationService } from '../../services/notification.service';
import { OrderStorageService } from '../../services/order-storage.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm!: FormGroup;
  cartItems: any[] = [];
  subtotal = 0;
  shippingCost = 0;
  baseShippingCost = 0; // Base shipping cost from settings
  freeShippingThreshold = 0;
  total = 0;
  loading = false;
  submitting = false;


  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private opencartService: OpencartService,
    private environmentService: EnvironmentService,
    private notificationService: NotificationService,
    private orderStorageService: OrderStorageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCartItems();
    this.loadShippingInfo();

    // Listen for cart changes
    window.addEventListener('storage', this.onStorageChange.bind(this));
    document.addEventListener('cartUpdated', this.onCartUpdated.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('storage', this.onStorageChange.bind(this));
    document.removeEventListener('cartUpdated', this.onCartUpdated.bind(this));
  }

  initForm(): void {
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      secondaryPhone: ['', [Validators.pattern(/^[0-9]{10,11}$/)]],
      detailedAddress: ['', [Validators.required, Validators.minLength(10)]],
      governorate: ['', [Validators.required]],
      city: ['', [Validators.required]],
      notes: ['']
    });

  }

  loadCartItems(): void {
    if ('cart' in localStorage) {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        try {
          this.cartItems = JSON.parse(cartData);
        } catch (e) {
          this.cartItems = [];
        }
      } else {
        this.cartItems = [];
      }
    } else {
      this.cartItems = [];
    }

    // Update service cart
    this.opencartService.cartproduct = this.cartItems;

    if (this.cartItems.length === 0) {
      this.notificationService.warning('السلة فارغة', 'يرجى إضافة منتجات إلى السلة أولاً');
      setTimeout(() => {
        this.router.navigate(['/shop']);
      }, 2000);
    }

    this.cdr.markForCheck();
  }

  onStorageChange(event: StorageEvent): void {
    if (event.key === 'cart') {
      this.loadCartItems();
      this.calculateTotals();
    }
  }

  onCartUpdated(): void {
    this.loadCartItems();
    this.calculateTotals();
    this.cdr.markForCheck();
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${imagePath}`;
  }

  increaseQuantity(index: number): void {
    if (this.cartItems[index].quantity < 999) {
      this.cartItems[index].quantity++;
      this.updateCart();
    }
  }

  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
      this.updateCart();
    }
  }

  removeItem(index: number): void {
    this.cartItems.splice(index, 1);
    this.updateCart();
    this.notificationService.info('تم الحذف', 'تمت إزالة المنتج من السلة');
  }

  updateQuantity(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (value >= 1 && value <= 999) {
      this.cartItems[index].quantity = value;
      this.updateCart();
    } else {
      // Reset to previous value
      input.value = this.cartItems[index].quantity.toString();
    }
  }

  updateCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
    this.opencartService.cartproduct = this.cartItems;
    this.calculateTotals();
    document.dispatchEvent(new CustomEvent('cartUpdated'));
    this.cdr.markForCheck();
  }

  /**
   * Clear cart completely
   */
  clearCart(): void {
    // Clear from localStorage
    localStorage.removeItem('cart');

    // Clear from service
    this.opencartService.cartproduct = [];

    // Clear local array
    this.cartItems = [];

    // Reset totals
    this.subtotal = 0;
    this.shippingCost = 0;
    this.total = 0;

    // Dispatch event to update other components
    document.dispatchEvent(new CustomEvent('cartUpdated'));

    // Update view
    this.cdr.markForCheck();
  }

  /**
   * Load shipping info from API
   */
  loadShippingInfo(): void {
    this.http.get<any>(`${environment.apiUrl}/settings/shipping/info`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Handle different response structures
          if (response.success && response.data) {
            this.baseShippingCost = response.data.shipping_cost || 0;
            this.freeShippingThreshold = response.data.free_shipping_threshold || 0;
          } else if (response.data) {
            // Direct data access
            this.baseShippingCost = response.data.shipping_cost || 0;
            this.freeShippingThreshold = response.data.free_shipping_threshold || 0;
          } else {
            // Fallback: try direct properties
            this.baseShippingCost = response.shipping_cost || 0;
            this.freeShippingThreshold = response.free_shipping_threshold || 0;
          }

          // Recalculate totals after loading shipping info
          this.calculateTotals();
        },
        error: (error) => {
          console.error('Error loading shipping info:', error);
          // Use default values if API fails
          this.baseShippingCost = 0;
          this.shippingCost = 0;
          this.calculateTotals();
        }
      });
  }

  /**
   * Calculate shipping cost based on subtotal
   */
  calculateShippingCost(): void {
    // If free shipping threshold is set and subtotal meets it, shipping is free
    if (this.freeShippingThreshold > 0 && this.subtotal >= this.freeShippingThreshold) {
      this.shippingCost = 0;
    } else {
      // Otherwise use base shipping cost from settings
      this.shippingCost = this.baseShippingCost;
    }
    this.updateTotal();
  }

  /**
   * Update total after shipping calculation
   */
  updateTotal(): void {
    this.total = this.subtotal + this.shippingCost;
    this.cdr.markForCheck();
  }

  calculateTotals(): void {
    this.subtotal = 0;
    this.cartItems.forEach(item => {
      const price = item.priceAfterDiscount || item.price;
      this.subtotal += price * item.quantity;
    });

    // Calculate shipping cost
    this.calculateShippingCost();
  }

  /**
   * Get color value for display
   */
  getColorValue(color: string): string {
    // Map common color names to hex values
    const colorMap: { [key: string]: string } = {
      'red': '#dc3545',
      'green': '#28a745',
      'blue': '#007bff',
      'yellow': '#ffc107',
      'black': '#000000',
      'white': '#ffffff',
      'gray': '#6c757d',
      'grey': '#6c757d',
      'orange': '#fd7e14',
      'purple': '#6f42c1',
      'pink': '#e83e8c',
      'brown': '#795548',
      'أحمر': '#dc3545',
      'أخضر': '#28a745',
      'أزرق': '#007bff',
      'أصفر': '#ffc107',
      'أسود': '#000000',
      'أبيض': '#ffffff',
      'رمادي': '#6c757d',
      'برتقالي': '#fd7e14',
      'بنفسجي': '#6f42c1',
      'وردي': '#e83e8c',
      'بني': '#795548'
    };

    const lowerColor = color.toLowerCase().trim();
    return colorMap[lowerColor] || '#6c757d';
  }

  getFieldError(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) {
      return 'هذا الحقل مطلوب';
    }
    if (field.errors['email']) {
      return 'البريد الإلكتروني غير صحيح';
    }
    if (field.errors['minlength']) {
      return `يجب أن يكون ${field.errors['minlength'].requiredLength} أحرف على الأقل`;
    }
    if (field.errors['pattern']) {
      if (fieldName === 'primaryPhone' || fieldName === 'secondaryPhone') {
        return 'رقم الهاتف يجب أن يكون 10-11 رقم';
      }
    }
    return '';
  }

  /**
   * Format cart items for backend API
   */
  private formatOrderItems(): any[] {
    return this.cartItems.map(item => ({
      productId: item._id,
      sizeName: item.selectedSize || '',
      quantity: item.quantity || 1,
      price: item.priceAfterDiscount || item.price || 0,
      totalPrice: (item.priceAfterDiscount || item.price || 0) * (item.quantity || 1)
    }));
  }

  /**
   * Format cart items for LocalStorage (with full product details)
   */
  private formatOrderItemsForStorage(): any[] {
    return this.cartItems.map(item => ({
      productId: item._id,
      title: item.title,
      imageCover: item.imageCover,
      sizeName: item.selectedSize || '',
      quantity: item.quantity || 1,
      price: item.priceAfterDiscount || item.price || 0,
      totalPrice: (item.priceAfterDiscount || item.price || 0) * (item.quantity || 1)
    }));
  }

  /**
   * Prepare order data for storage and API
   */
  private prepareOrderData(): any {
    const formValue = this.checkoutForm.value;

    return {
      // User information
      fullName: formValue.fullName,
      email: formValue.email,
      primaryPhone: formValue.primaryPhone,
      secondaryPhone: formValue.secondaryPhone || null,

      // Delivery information
      detailedAddress: formValue.detailedAddress,
      governorate: formValue.governorate,
      city: formValue.city,
      notes: formValue.notes || '',

      // Order items and totals
      items: this.formatOrderItemsForStorage(),
      subtotal: this.subtotal,
      shippingCost: this.shippingCost,
      total: this.total,

      // API items for backend
      apiItems: this.formatOrderItems(),

      // Metadata
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Submit order: Send to API first, then save to LocalStorage only if successful
   */
  onSubmit(): void {
    // Validate form
    if (this.checkoutForm.invalid) {
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
      this.notificationService.error('خطأ في التحقق', 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return;
    }

    // Validate cart
    const cartValidation = this.opencartService.validateCartForCheckout();
    if (!cartValidation.valid) {
      this.notificationService.error('خطأ في السلة', cartValidation.message || 'لا يمكن المتابعة مع سلة فارغة');
      return;
    }

    if (this.submitting) return;

    this.submitting = true;
    this.cdr.markForCheck();

    // Prepare order data
    const orderData = this.prepareOrderData();

    // Format data for backend API
    const apiOrderData: any = {
      fullName: orderData.fullName,
      email: orderData.email,
      phone: orderData.primaryPhone,
      country: 'Egypt',
      streetAddress: orderData.detailedAddress,
      state: `${orderData.governorate}, ${orderData.city}`,
      shippingAddress: {
        fullName: orderData.fullName,
        country: 'Egypt',
        streetAddress: orderData.detailedAddress,
        state: `${orderData.governorate}, ${orderData.city}`,
        email: orderData.email,
        phone: orderData.primaryPhone,
      },
      orderNotes: orderData.notes || '',
      termsAccepted: 'true', // Required: must be string 'true'
      items: orderData.apiItems,
      totalAmount: this.subtotal,
      shippingCost: this.shippingCost,
      finalAmount: this.total
    };

    // Step 1: Send to backend API first
    this.categoryService.sendorderForm(apiOrderData)
      .subscribe({
        next: (response) => {
          // Check if order was created successfully (handle different response structures)
          const isSuccess = response && (response.success === true || response.data || response._id);

          if (isSuccess) {
            // Save order data with API response info
            const orderDataWithResponse = {
              ...orderData,
              orderId: response.data?._id || response.data?.id || response._id,
              orderNumber: response.data?.orderNumber || response.orderNumber,
              apiResponse: response
            };

            const saved = this.orderStorageService.saveOrder(orderDataWithResponse);
            if (!saved) {
              console.warn('Order saved to API but failed to save locally');
            }
          }

          this.notificationService.success(
            'تم بنجاح!',
            'تم إنشاء الطلب بنجاح. يمكنك متابعة حالة الطلب من سجل الطلبات.'
          );

          // Clear cart after successful order (always clear if we reach here without error)
          this.clearCart();

          // Reset form
          this.checkoutForm.reset();

          // Redirect to order history
          setTimeout(() => {
            this.router.navigate(['/order-history']);
          }, 2000);

          this.submitting = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error sending order to API:', error);

          // Don't save to LocalStorage if API call failed
          // Don't clear cart if order failed

          let errorMessage = 'فشل إرسال الطلب للخادم. يرجى المحاولة مرة أخرى.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && error.error.errors && error.error.errors.length > 0) {
            errorMessage = error.error.errors.map((e: any) => e.msg || e.message).join(', ');
          }

          this.notificationService.error('خطأ', errorMessage);

          this.submitting = false;
          this.cdr.markForCheck();
      }
    });
  }

  trackByItemId(index: number, item: any): string {
    return `${item._id}-${item.selectedSize || 'no-size'}`;
  }

  navigateToShop(): void {
    this.router.navigate(['/shop']);
  }
}
