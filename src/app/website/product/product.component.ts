import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { OpencartService } from '../../services/opencart.service';
import { FavoritesService } from '../../services/favorites.service';
import { EnvironmentService } from '../../services/environment.service';
import { NotificationService } from '../../services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ProductQuantity {
  size: string;
  no: number;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit, OnDestroy {
  product: (Product & { quantity?: ProductQuantity[] }) | null = null;
  relatedProducts: Product[] = [];
  loading = true;
  error: string | null = null;

  // Image gallery
  selectedImageIndex = 0;
  allImages: string[] = [];

  // Product options
  selectedColor: string | null = null;
  selectedSize: string | null = null;
  quantity = 1;
  availableSizes: ProductQuantity[] = [];

  // Stock status
  isOutOfStock = false;
  totalStock = 0;

  // Wishlist status
  isFavorite = false;

  private destroy$ = new Subject<void>();
  private imageErrors = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private opencartService: OpencartService,
    private favoritesService: FavoritesService,
    private environmentService: EnvironmentService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const productId = params['_id'];
      if (productId) {
        this.loadProduct(productId);
      } else {
        this.error = 'معرف المنتج غير موجود';
        this.loading = false;
      }
    });

    // Listen for favorites updates
    this.favoritesService.getFavoritesObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.product) {
          this.isFavorite = this.favoritesService.isFavorite(this.product._id);
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load product data from API
   */
  loadProduct(productId: string): void {
    this.loading = true;
    this.error = null;

    this.productService.getProductById(productId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (product) => {
        this.product = product;
        this.initializeProductData();
        this.loadRelatedProducts();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error = 'حدث خطأ أثناء تحميل المنتج. يرجى المحاولة مرة أخرى.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Initialize product data after loading
   */
  initializeProductData(): void {
    if (!this.product) return;

    // Initialize images
    this.allImages = [];
    if (this.product.imageCover) {
      this.allImages.push(this.product.imageCover);
    }
    if (this.product.images && this.product.images.length > 0) {
      this.allImages.push(...this.product.images);
    }
    this.selectedImageIndex = 0;

    // Initialize sizes from quantity array
    if (this.product.quantity && Array.isArray(this.product.quantity)) {
      this.availableSizes = this.product.quantity.filter(q => q.no > 0);
      this.calculateStockStatus();
    } else {
      this.availableSizes = [];
      this.isOutOfStock = true;
    }

    // Initialize colors
    if (this.product.colors && this.product.colors.length > 0) {
      this.selectedColor = this.product.colors[0];
    }

    // Check favorite status
    this.isFavorite = this.favoritesService.isFavorite(this.product._id);
  }

  /**
   * Calculate stock status
   */
  calculateStockStatus(): void {
    if (!this.product || !this.product.quantity) {
      this.isOutOfStock = true;
      this.totalStock = 0;
      return;
    }

    this.totalStock = this.product.quantity.reduce((sum, q) => sum + (q.no || 0), 0);
    this.isOutOfStock = this.totalStock === 0;
  }

  /**
   * Get stock status text
   */
  getStockStatus(): string {
    if (this.isOutOfStock) {
      return 'Out of Stock';
    }
    if (this.totalStock <= 3) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  /**
   * Get stock status for a specific size
   */
  getSizeStockStatus(sizeData: ProductQuantity): string {
    if (sizeData.no === 0) {
      return 'Out of Stock';
    }
    if (sizeData.no <= 3) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  /**
   * Get available stock for selected size
   */
  getSelectedSizeStock(): number {
    if (!this.selectedSize || !this.product || !this.product.quantity) {
      return 0;
    }

    const sizeData = this.product.quantity.find(q => q.size === this.selectedSize);
    return sizeData ? sizeData.no : 0;
  }

  /**
   * Get max quantity based on selected size
   */
  getMaxQuantity(): number {
    return this.getSelectedSizeStock();
  }

  /**
   * Load related products
   */
  loadRelatedProducts(): void {
    if (!this.product || !this.product.category?._id) return;

    this.productService.getRelatedProducts(
      this.product.category._id,
      this.product._id,
      4
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (products) => {
        this.relatedProducts = products;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading related products:', err);
        // Don't show error for related products, just log it
      }
    });
  }

  /**
   * Get image URL
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${imagePath}`;
  }

  /**
   * Handle image error
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
   * Select image from gallery
   */
  selectImage(index: number): void {
    if (index >= 0 && index < this.allImages.length) {
      this.selectedImageIndex = index;
    }
  }

  /**
   * Select color
   */
  selectColor(color: string): void {
    this.selectedColor = color;
  }

  /**
   * Select size
   */
  selectSize(size: string): void {
    this.selectedSize = size;
    // Reset quantity to 1 when size changes
    this.quantity = 1;
    // Update max quantity based on selected size
    const maxQty = this.getMaxQuantity();
    if (this.quantity > maxQty) {
      this.quantity = maxQty;
    }
  }

  /**
   * Increase quantity
   */
  increaseQuantity(): void {
    const maxQty = this.getMaxQuantity();
    if (this.quantity < maxQty) {
      this.quantity++;
    } else {
      this.notificationService.info('الكمية المتاحة', `الكمية المتاحة لهذا الحجم هي ${maxQty}`);
    }
  }

  /**
   * Decrease quantity
   */
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /**
   * Validate before adding to cart
   */
  canAddToCart(): boolean {
    if (!this.product || this.isOutOfStock) return false;
    if (this.product.colors && this.product.colors.length > 0 && !this.selectedColor) return false;
    if (this.availableSizes.length > 0 && !this.selectedSize) return false;
    if (this.selectedSize && this.getSelectedSizeStock() < this.quantity) return false;
    return true;
  }

  /**
   * Add product to cart
   */
  addToCart(): void {
    if (!this.product) return;

    // Validate selections
    if (this.product.colors && this.product.colors.length > 0 && !this.selectedColor) {
      this.notificationService.warning('اختر اللون', 'يرجى اختيار لون المنتج');
      return;
    }

    if (this.availableSizes.length > 0 && !this.selectedSize) {
      this.notificationService.warning('اختر الحجم', 'يرجى اختيار حجم المنتج');
      return;
    }

    if (this.selectedSize && this.getSelectedSizeStock() < this.quantity) {
      this.notificationService.warning('الكمية غير متاحة', `الكمية المتاحة لهذا الحجم هي ${this.getSelectedSizeStock()}`);
      return;
    }

    // Prepare cart item
    const cartItem: any = {
      ...this.product,
      quantity: this.quantity,
      price: this.product.priceAfterDiscount || this.product.price,
      selectedColor: this.selectedColor,
      selectedSize: this.selectedSize
    };

    // Add to cart using opencart service
    this.opencartService.addToCart(cartItem);

    // Dispatch cart update event
    document.dispatchEvent(new CustomEvent('cartUpdated'));
  }

  /**
   * Toggle wishlist
   */
  toggleWishlist(): void {
    if (!this.product) return;

    const wasFavorite = this.isFavorite;
    this.isFavorite = this.favoritesService.toggleFavorite(this.product);

    if (this.isFavorite && !wasFavorite) {
      this.notificationService.success('تمت الإضافة إلى المفضلة', `تمت إضافة ${this.product.title} إلى المفضلة`);
    } else if (!this.isFavorite && wasFavorite) {
      this.notificationService.info('تمت الإزالة من المفضلة', `تمت إزالة ${this.product.title} من المفضلة`);
    }

    document.dispatchEvent(new CustomEvent('favoritesUpdated'));
  }

  /**
   * Get product price (with discount if available)
   */
  getProductPrice(): number {
    if (!this.product) return 0;
    return this.product.priceAfterDiscount || this.product.price;
  }

  /**
   * Get original price (if discounted)
   */
  getOriginalPrice(): number | null {
    if (!this.product || !this.product.priceAfterDiscount) return null;
    return this.product.price;
  }

  /**
   * Calculate discount percentage
   */
  getDiscountPercentage(): number {
    if (!this.product || !this.product.priceAfterDiscount) return 0;
    const discount = ((this.product.price - this.product.priceAfterDiscount) / this.product.price) * 100;
    return Math.round(discount);
  }

  /**
   * Navigate to related product
   */
  navigateToProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  /**
   * Navigate to shop page
   */
  navigateToShop(): void {
    this.router.navigate(['/shop']);
  }

  /**
   * Get color value for CSS background
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
      'navy': '#001f3f',
      'teal': '#20c997',
      'cyan': '#17a2b8',
      'lime': '#32cd32',
      'indigo': '#6610f2',
      'maroon': '#800000',
      'olive': '#808000',
      'silver': '#c0c0c0',
      'gold': '#ffd700',
      'beige': '#f5f5dc',
      'coral': '#ff7f50',
      'salmon': '#fa8072',
      'turquoise': '#40e0d0',
      'lavender': '#e6e6fa',
      'mint': '#98fb98',
      'burgundy': '#800020',
      'khaki': '#f0e68c',
      'ivory': '#fffff0',
      'cream': '#fffdd0',
      'tan': '#d2b48c',
      'charcoal': '#36454f',
      'violet': '#8a2be2',
      'magenta': '#ff00ff'
    };

    const lowerColor = color.toLowerCase().trim();
    return colorMap[lowerColor] || '#6c757d';
  }
}
