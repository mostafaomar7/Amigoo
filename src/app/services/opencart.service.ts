import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from './notification.service';
import { QuickAddModalService } from './quick-add-modal.service';

@Injectable({
  providedIn: 'root'
})
export class OpencartService {

  cartproduct: any[] = [];
  private cartToggleSubject = new BehaviorSubject<boolean>(false);
  cartToggle$ = this.cartToggleSubject.asObservable();

  constructor(
    private notificationService: NotificationService,
    private quickAddModalService: QuickAddModalService
  ) {
    this.loadCart();
    this.loadFavorites();
  }

  private loadCart() {
    if ("cart" in localStorage) {
      this.cartproduct = JSON.parse(localStorage.getItem("cart")!);
    }
  }

  /**
   * Validate product before adding to cart
   * - Check if product is valid (has _id, title, price)
   * - Validate quantity is positive
   */
  private validateProductForCart(product: any): { valid: boolean; message?: string } {
    // Validation 1: Check if product is valid
    if (!product || !product._id) {
      return { valid: false, message: 'منتج غير صالح: معرف المنتج مطلوب' };
    }

    if (!product.title) {
      return { valid: false, message: 'منتج غير صالح: عنوان المنتج مطلوب' };
    }

    if (!product.price && product.price !== 0) {
      return { valid: false, message: 'منتج غير صالح: سعر المنتج مطلوب' };
    }

    // Validation 2: Validate quantity
    const quantity = product.quantity || 1;
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return { valid: false, message: 'كمية غير صالحة: يجب أن تكون عدداً صحيحاً موجباً' };
    }

    return { valid: true };
  }

  /**
   * Find duplicate product in cart (same product + size combination)
   */
  private findDuplicateInCart(product: any): any | null {
    return this.cartproduct.find(item => {
      if (item._id !== product._id) return false;
      // If both have selectedSize, compare them
      if (item.selectedSize && product.selectedSize) {
        return item.selectedSize.toLowerCase() === product.selectedSize.toLowerCase();
      }
      // If both have selectedColor, compare them
      if (item.selectedColor && product.selectedColor) {
        if (item.selectedColor.toLowerCase() !== product.selectedColor.toLowerCase()) {
          return false;
        }
      }
      // If neither has selectedSize, they're the same
      if (!item.selectedSize && !product.selectedSize) {
        return true;
      }
      // If one has size and other doesn't, they're different
      return false;
    }) || null;
  }

  /**
   * Check if product needs color/size selection
   */
  private needsColorOrSizeSelection(product: any): boolean {
    const hasColors = product.colors && product.colors.length > 0 && !product.selectedColor;
    const hasSizes = (product.quantity && Array.isArray(product.quantity) && product.quantity.length > 0) ||
                     (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0);
    const needsSize = hasSizes && !product.selectedSize;

    return hasColors || needsSize;
  }

  /**
   * Add product to cart with validation
   * - Prevents invalid products
   * - Updates quantity if product already exists (same ID + size)
   * - Validates quantity
   * - Opens modal if color/size selection is needed
   */
  addToCart(product: any) {
    // Validate product before adding
    const validation = this.validateProductForCart(product);

    if (!validation.valid) {
      this.notificationService.warning('خطأ في الإضافة', validation.message || 'لا يمكن إضافة المنتج إلى السلة');
      return false;
    }

    // Ensure product has valid quantity
    if (!product.quantity || product.quantity < 1) {
      product.quantity = 1;
    }

    // Check if product needs color/size selection
    if (this.needsColorOrSizeSelection(product)) {
      // Open modal for color/size selection
      this.quickAddModalService.openModal({
        product: product,
        onConfirm: (selectedColor: string | null, selectedSize: string | null, quantity: number) => {
          this.addToCartWithSelections(product, selectedColor, selectedSize, quantity);
        }
      });
      return false; // Don't add yet, wait for modal confirmation
    }

    // Product has all required selections, add directly
    return this.addToCartDirectly(product);
  }

  /**
   * Add product to cart with selected color and size
   */
  private addToCartWithSelections(product: any, selectedColor: string | null, selectedSize: string | null, quantity: number): void {
    const cartItem = {
      ...product,
      quantity: quantity,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      price: product.priceAfterDiscount || product.price
    };

    this.addToCartDirectly(cartItem);
  }

  /**
   * Directly add product to cart (internal method)
   */
  private addToCartDirectly(product: any, silent: boolean = false): boolean {
    // Check if product already exists in cart (same product + size combination)
    const existingItem = this.findDuplicateInCart(product);

    if (existingItem) {
      // Product already exists - update quantity instead of adding duplicate
      const existingIndex = this.cartproduct.indexOf(existingItem);
      const newQuantity = (existingItem.quantity || 1) + (product.quantity || 1);

      // Update quantity
      this.cartproduct[existingIndex].quantity = newQuantity;
      localStorage.setItem("cart", JSON.stringify(this.cartproduct));

      if (!silent) {
        this.notificationService.success(
          'تم تحديث الكمية',
          `تم تحديث كمية ${product.title || 'المنتج'} في السلة. الكمية الحالية: ${newQuantity}`
        );
      }
      document.dispatchEvent(new CustomEvent('cartUpdated'));
      return true;
    }

    // Product doesn't exist - add new item to cart
    this.cartproduct.push(product);
    localStorage.setItem("cart", JSON.stringify(this.cartproduct));

    if (!silent) {
      this.notificationService.success('تمت الإضافة إلى السلة', `تمت إضافة ${product.title || 'المنتج'} إلى السلة`);
    }
    document.dispatchEvent(new CustomEvent('cartUpdated'));
    return true;
  }

  /**
   * Add product to cart silently (without notifications)
   */
  addToCartSilent(product: any): boolean {
    // Validate product before adding
    const validation = this.validateProductForCart(product);

    if (!validation.valid) {
      // Even in silent mode, show validation errors
      this.notificationService.warning('خطأ في الإضافة', validation.message || 'لا يمكن إضافة المنتج إلى السلة');
      return false;
    }

    // Ensure product has valid quantity
    if (!product.quantity || product.quantity < 1) {
      product.quantity = 1;
    }

    // Product should already have all required selections when called from modal
    return this.addToCartDirectly(product, true);
  }

  /**
   * Validate cart before checkout
   * - Check if cart is not empty
   * - Validate all products are still valid
   * - Check stock availability (basic check - full check done on backend)
   */
  validateCartForCheckout(): { valid: boolean; message?: string; invalidItems?: any[] } {
    // Validation 1: Prevent checkout if cart is empty
    if (!this.cartproduct || this.cartproduct.length === 0) {
      return { valid: false, message: 'السلة فارغة. يرجى إضافة منتجات إلى السلة أولاً' };
    }

    // Validation 2: Validate all products are still valid
    const invalidItems: any[] = [];
    this.cartproduct.forEach((item, index) => {
      if (!item._id || !item.title || (!item.price && item.price !== 0)) {
        invalidItems.push({ index, item, reason: 'Invalid product data' });
      }

      if (!item.quantity || item.quantity < 1) {
        invalidItems.push({ index, item, reason: 'Invalid quantity' });
      }
    });

    if (invalidItems.length > 0) {
      return {
        valid: false,
        message: 'بعض المنتجات في السلة غير صالحة. يرجى تحديث السلة',
        invalidItems
      };
    }

    return { valid: true };
  }

  removeFromCart(index: number): void {
    if (index >= 0 && index < this.cartproduct.length) {
      const product = this.cartproduct[index];
      this.cartproduct.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(this.cartproduct));
      this.notificationService.success('تمت الإزالة من السلة', `تمت إزالة ${product.title || 'المنتج'} من السلة`);
      document.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  }

  toggleCart() {
    this.cartToggleSubject.next(true);  // جعل القائمة تفتح
  }
  private favoriteProducts: any[] = [];
  private favoritesToggleSubject = new BehaviorSubject<boolean>(false);
  favoritesToggle$ = this.favoritesToggleSubject.asObservable();



  private loadFavorites() {
    if ("star" in localStorage) {
      this.favoriteProducts = JSON.parse(localStorage.getItem("star")!);
    }
  }

  addToFavorites(product: any) {
    let exist = this.favoriteProducts.find(item => item._id === product._id);
    if (exist) {
      this.notificationService.info('موجود بالفعل في المفضلة', 'هذا المنتج موجود بالفعل في المفضلة');
    } else {
      this.favoriteProducts.push(product);
      localStorage.setItem("favorites", JSON.stringify(this.favoriteProducts));
      this.notificationService.success('تمت الإضافة إلى المفضلة', `تمت إضافة ${product.title || 'المنتج'} إلى المفضلة`);
      document.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  }

  removeFromFavorites(productId: string): void {
    const index = this.favoriteProducts.findIndex(item => item._id === productId);
    if (index !== -1) {
      const product = this.favoriteProducts[index];
      this.favoriteProducts.splice(index, 1);
      localStorage.setItem("favorites", JSON.stringify(this.favoriteProducts));
      this.notificationService.success('تمت الإزالة من المفضلة', `تمت إزالة ${product.title || 'المنتج'} من المفضلة`);
      document.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  }


  toggleFavorites() {
    this.favoritesToggleSubject.next(true); // فتح القائمة عند التحديث
  }

  getFavorites() {
    return this.favoriteProducts;
  }
}
