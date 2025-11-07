import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { OpencartService } from '../../services/opencart.service';
import { OrderStorageService } from '../../services/order-storage.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';
import { EnvironmentService } from '../../services/environment.service';

/**
 * Order Summary Component
 *
 * This component displays the order summary and collects user information
 * before submitting the order to the backend API.
 *
 * Flow:
 * 1. User arrives from checkout page with cart items
 * 2. User fills out personal and delivery information form
 * 3. Form validation ensures all required fields are filled
 * 4. On submit: Save to LocalStorage + Send to API
 * 5. Clear cart and redirect to success page
 */
@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.css']
})
export class OrderSummaryComponent implements OnInit {
  // Form group for user information
  orderForm!: FormGroup;

  // Cart items from checkout
  cartItems: any[] = [];

  // Order totals
  subtotal = 0;
  vat = 0;
  vatRate = 0.14; // 14% VAT for Egypt
  total = 0;

  // UI state
  submitting = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private opencartService: OpencartService,
    private orderStorageService: OrderStorageService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private environmentService: EnvironmentService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Load cart items from LocalStorage
    this.loadCartItems();

    // If cart is empty, redirect to shop
    if (this.cartItems.length === 0) {
      this.notificationService.warning('السلة فارغة', 'يرجى إضافة منتجات إلى السلة أولاً');
      setTimeout(() => {
        this.router.navigate(['/shop']);
      }, 2000);
      return;
    }

    // Calculate totals
    this.calculateTotals();
  }

  /**
   * Initialize form with validation rules
   * Required fields: fullName, email, primaryPhone, detailedAddress, governorate, city
   * Optional fields: secondaryPhone, notes
   */
  initForm(): void {
    this.orderForm = this.fb.group({
      // Required fields
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      detailedAddress: ['', [Validators.required, Validators.minLength(10)]],
      governorate: ['', [Validators.required, Validators.minLength(2)]],
      city: ['', [Validators.required, Validators.minLength(2)]],

      // Optional fields
      secondaryPhone: ['', [Validators.pattern(/^[0-9]{10,11}$/)]],
      notes: ['']
    });
  }

  /**
   * Load cart items from LocalStorage
   */
  loadCartItems(): void {
    if ('cart' in localStorage) {
      this.cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    } else {
      this.cartItems = [];
    }
  }

  /**
   * Calculate order totals (subtotal, VAT, total)
   */
  calculateTotals(): void {
    this.subtotal = 0;
    this.cartItems.forEach(item => {
      const price = item.priceAfterDiscount || item.price || 0;
      this.subtotal += price * (item.quantity || 1);
    });

    this.vat = this.subtotal * this.vatRate;
    this.total = this.subtotal + this.vat;
    this.cdr.markForCheck();
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
   * Get field error message for form validation
   */
  getFieldError(fieldName: string): string {
    const field = this.orderForm.get(fieldName);
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
   * Validate form before submission
   * @returns Object with valid boolean and optional message
   */
  private validateForm(): { valid: boolean; message?: string } {
    // Check if form is valid
    if (this.orderForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.orderForm.controls).forEach(key => {
        this.orderForm.get(key)?.markAsTouched();
      });
      return { valid: false, message: 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح' };
    }

    // Check if cart is not empty
    if (this.cartItems.length === 0) {
      return { valid: false, message: 'السلة فارغة. يرجى إضافة منتجات إلى السلة أولاً' };
    }

    return { valid: true };
  }

  /**
   * Format cart items for backend API
   * Returns items with productId, sizeName, quantity, price, totalPrice
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
   * Format cart items for LocalStorage (includes full product details)
   * Returns items with all product information for display in order history
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
    const formValue = this.orderForm.value;

    // Format order items for API (minimal data)
    const orderItemsForAPI = this.formatOrderItems();

    // Format order items for LocalStorage (with full product details)
    const orderItemsForStorage = this.formatOrderItemsForStorage();

    // Prepare complete order object for LocalStorage
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

      // Order items and totals (with full product details for LocalStorage)
      items: orderItemsForStorage,
      subtotal: this.subtotal,
      vat: this.vat,
      total: this.total,

      // Store API items separately for backend submission
      apiItems: orderItemsForAPI,

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
    const validation = this.validateForm();
    if (!validation.valid) {
      this.notificationService.error('خطأ في التحقق', validation.message || 'لا يمكن إنشاء الطلب');
      return;
    }

    if (this.submitting) return;

    this.submitting = true;
    this.cdr.markForCheck();

    // Prepare order data
    const orderData = this.prepareOrderData();

    // Format data for backend API (use apiItems which has minimal data)
    // Note: Order interface requires localStorge property (typo in interface, but required for type checking)
    const apiOrderData: any = {
      fullName: orderData.fullName,
      email: orderData.email,
      phone: orderData.primaryPhone,
      country: 'Egypt', // Default country
      streetAddress: orderData.detailedAddress,
      state: `${orderData.governorate}, ${orderData.city}`,
      shippingAddress: {
        fullName: orderData.fullName,
        country: 'Egypt',
        streetAddress: orderData.detailedAddress,
        state: `${orderData.governorate}, ${orderData.city}`,
        phone: orderData.primaryPhone,
        email: orderData.email,
      },
      orderNotes: orderData.notes,
      items: orderData.apiItems, // Use API items (minimal data)
      totalAmount: orderData.total,
      shippingCost: orderData.shippingCost || 0,
      finalAmount: orderData.total,
      termsAccepted: 'true'
    };

    // Step 1: Send to backend API first
    this.categoryService.sendorderForm(apiOrderData)
      .subscribe({
        next: (response) => {
          // Only save to LocalStorage if API call succeeded
          if (response && response.success) {
            // Save order data with API response info
            const orderDataWithResponse = {
              ...orderData,
              orderId: response.data?._id || response.data?.id,
              orderNumber: response.data?.orderNumber,
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

          // Clear cart immediately after successful order
          this.opencartService.clearCart();
          this.cartItems = [];

          // Reset form
          this.orderForm.reset();

          // Redirect to order history or home after 2 seconds
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

  /**
   * Navigate back to cart
   */
  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }
}
