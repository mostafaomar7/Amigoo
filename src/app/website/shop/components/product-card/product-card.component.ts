import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Product } from '../../../../services/product.service';
import { FavoritesService } from '../../../../services/favorites.service';
import { OpencartService } from '../../../../services/opencart.service';
import { EnvironmentService } from '../../../../services/environment.service';
import { NotificationService } from '../../../../services/notification.service';
import { QuickAddModalService } from '../../../../services/quick-add-modal.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() product!: Product;
  @Output() addToCartEvent = new EventEmitter<Product>();
  @Output() addToWishlistEvent = new EventEmitter<Product>();

  // Image error handling
  imageErrors = new Set<string>();
  isInCart = false;
  private destroy$ = new Subject<void>();

  constructor(
    private favoritesService: FavoritesService,
    private opencartService: OpencartService,
    private environmentService: EnvironmentService,
    private notificationService: NotificationService,
    private quickAddModalService: QuickAddModalService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkCartStatus();

    // Listen for cart updates
    this.opencartService.cartToggle$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkCartStatus();
      this.cdr.markForCheck();
    });

    // Listen for custom cart update events
    document.addEventListener('cartUpdated', this.onCartUpdated.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.checkCartStatus();
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('cartUpdated', this.onCartUpdated.bind(this));
  }

  private onCartUpdated(): void {
    this.checkCartStatus();
    this.cdr.markForCheck();
  }

  /**
   * Get image URL for product
   */
  getProductImageUrl(product: Product): string {
    if (!product.imageCover) return '';
    if (product.imageCover.startsWith('http://') || product.imageCover.startsWith('https://')) {
      return product.imageCover;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${product.imageCover}`;
  }

  /**
   * Handle image load error
   */
  onImageError(imageId: string): void {
    this.imageErrors.add(imageId);
    this.cdr.markForCheck();
  }

  /**
   * Check if image has error
   */
  hasImageError(imageId: string): boolean {
    return this.imageErrors.has(imageId);
  }

  /**
   * Get product price
   */
  getProductPrice(product: Product): number {
    return product.priceAfterDiscount || product.price;
  }

  /**
   * Get original price (if discounted)
   */
  getOriginalPrice(product: Product): number | null {
    if (!product.priceAfterDiscount) return null;
    return product.price;
  }

  /**
   * Calculate discount percentage
   */
  getDiscountPercentage(product: Product): number {
    if (!product.priceAfterDiscount) return 0;
    const discount = ((product.price - product.priceAfterDiscount) / product.price) * 100;
    return Math.round(discount);
  }

  navigateToProduct(): void {
    this.router.navigate(['/product', this.product._id]);
  }

  /**
   * Add product to cart - opens modal for selection
   */
  addToCart(product: Product, event: Event): void {
    event.stopPropagation();

    // Open modal for product selection
    this.quickAddModalService.openModal({
      product: product,
      onConfirm: (selectedColor: string | null, selectedSize: string | null, quantity: number) => {
        const cartItem = {
          ...product,
          quantity: quantity,
          selectedColor: selectedColor,
          selectedSize: selectedSize,
          price: product.priceAfterDiscount || product.price
        };

        // Add to cart using service (will show notification internally)
        this.opencartService.addToCart(cartItem);
        this.isInCart = true;
        this.addToCartEvent.emit(product);
        this.cdr.markForCheck();

        // Dispatch custom event for navbar update
        document.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    });
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(product: Product, event: Event): void {
    event.stopPropagation();

    const isFavorite = this.favoritesService.toggleFavorite(product);

    if (isFavorite) {
      this.notificationService.success('تمت الإضافة إلى المفضلة', `تمت إضافة ${product.title} إلى المفضلة`);
    } else {
      this.notificationService.info('تمت الإزالة من المفضلة', `تمت إزالة ${product.title} من المفضلة`);
    }

    this.addToWishlistEvent.emit(product);
    this.cdr.markForCheck();

    // Dispatch custom event for navbar update
    document.dispatchEvent(new CustomEvent('favoritesUpdated'));
  }

  /**
   * Check if product is favorite
   */
  isFavorite(productId: string): boolean {
    return this.favoritesService.isFavorite(productId);
  }

  private checkCartStatus(): void {
    const cartItems = this.opencartService.cartproduct || [];
    this.isInCart = cartItems.some((item: any) => item._id === this.product._id);
  }
}
