import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { ProductService, Product, ProductSize } from '../../services/product.service';
import { FavoritesService } from '../../services/favorites.service';
import { OpencartService } from '../../services/opencart.service';
import { EnvironmentService } from '../../services/environment.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  sizes: ProductSize[] = [];
  reviews: any[] = [];

  // State management
  loading = true;
  error: string | null = null;
  selectedSize: string | null = null;
  quantity: number = 1;
  selectedImageIndex = 0;
  isFavorite = false;
  isInCart = false;

  // UI state
  activeTab: 'description' | 'specifications' | 'reviews' = 'description';
  showFullDescription = false;
  descriptionPreviewLines = 4;

  // Image loading
  imageError = false;
  mainImageError = false;

  private destroy$ = new Subject<void>();
  private productId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private favoritesService: FavoritesService,
    private opencartService: OpencartService,
    private environmentService: EnvironmentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.productId = params['_id'];
      if (this.productId) {
        this.loadProduct();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct(): void {
    if (!this.productId) return;

    this.loading = true;
    this.error = null;

    this.productService.getProductById(this.productId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (product) => {
          this.product = product;
          this.checkFavoriteStatus();
          this.checkCartStatus();
          this.loadSizes();
          this.loadRelatedProducts();
          this.loadReviews();
        },
        error: (error) => {
          console.error('Error loading product:', error);
          if (error.status === 404) {
            this.error = 'Product not found';
          } else {
            this.error = 'Failed to load product. Please try again.';
          }
        }
      });
  }

  loadSizes(): void {
    if (!this.productId) return;

    this.productService.getProductSizes(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sizes) => {
          this.sizes = sizes;
          // Auto-select first available size
          if (sizes.length > 0 && !this.selectedSize) {
            const availableSize = sizes.find(s => s.isAvailable && s.quantity > 0);
            if (availableSize) {
              this.selectedSize = availableSize.sizeName;
            }
          }
        },
        error: (error) => {
          console.error('Error loading sizes:', error);
        }
      });
  }

  loadRelatedProducts(): void {
    if (!this.product || !this.product.category?._id) return;

    this.productService.getRelatedProducts(
      this.product.category._id,
      this.product._id,
      4
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.relatedProducts = products;
        },
        error: (error) => {
          console.error('Error loading related products:', error);
        }
      });
  }

  loadReviews(): void {
    if (!this.productId) return;

    this.productService.getProductReviews(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reviews) => {
          this.reviews = reviews;
        },
        error: (error) => {
          // Reviews endpoint might not exist, fail silently
        }
      });
  }

  checkFavoriteStatus(): void {
    if (!this.product) return;
    this.isFavorite = this.favoritesService.isFavorite(this.product._id);
  }

  checkCartStatus(): void {
    if (!this.product) return;
    const cartItems = this.opencartService.cartproduct || [];
    this.isInCart = cartItems.some((item: any) => item._id === this.product!._id);
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${imagePath}`;
  }

  getProductImages(): string[] {
    if (!this.product) return [];
    const images = [this.product.imageCover];
    if (this.product.images && this.product.images.length > 0) {
      images.push(...this.product.images);
    }
    return images;
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
    this.mainImageError = false;
  }

  onImageError(): void {
    this.mainImageError = true;
  }

  onThumbnailError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  onQuantityChange(change: number): void {
    const newQuantity = this.quantity + change;
    const maxQuantity = this.getMaxQuantity();

    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      this.quantity = newQuantity;
    }
  }

  getMaxQuantity(): number {
    if (!this.selectedSize || !this.sizes.length) return 999;
    const size = this.sizes.find(s => s.sizeName === this.selectedSize);
    return size && size.isAvailable ? size.quantity : 0;
  }

  getStockStatus(): { inStock: boolean; message: string } {
    if (!this.sizes.length) {
      return { inStock: true, message: 'In Stock' };
    }

    const totalAvailable = this.sizes
      .filter(s => s.isAvailable && s.quantity > 0)
      .reduce((sum, s) => sum + s.quantity, 0);

    if (totalAvailable === 0) {
      return { inStock: false, message: 'Out of Stock' };
    }

    if (this.selectedSize) {
      const size = this.sizes.find(s => s.sizeName === this.selectedSize);
      if (size && size.isAvailable && size.quantity > 0) {
        return { inStock: true, message: `In Stock (${size.quantity} available)` };
      }
    }

    return { inStock: totalAvailable > 0, message: 'In Stock' };
  }

  addToCart(): void {
    if (!this.product) return;

    // Check if size is required
    if (this.sizes.length > 0 && !this.selectedSize) {
      this.notificationService.warning('Size Required', 'Please select a size before adding to cart');
      return;
    }

    // Check stock
    const stockStatus = this.getStockStatus();
    if (!stockStatus.inStock) {
      this.notificationService.warning('Out of Stock', 'This product is currently out of stock');
      return;
    }

    // Prepare cart item
    const cartItem = {
      ...this.product,
      quantity: this.quantity,
      selectedSize: this.selectedSize || undefined,
      price: this.product.priceAfterDiscount || this.product.price
    };

    // Check if already in cart
    const existingItem = this.opencartService.cartproduct.find(
      (item: any) => item._id === this.product!._id &&
      (!this.selectedSize || item.selectedSize === this.selectedSize)
    );

    if (existingItem) {
      this.notificationService.info('Already in Cart', 'This product is already in your cart');
      return;
    }

    // Add to cart
    this.opencartService.addToCart(cartItem);
    this.isInCart = true;
    this.notificationService.success('Added to Cart', `${this.product.title} has been added to your cart`);
  }

  toggleFavorite(): void {
    if (!this.product) return;

    this.isFavorite = this.favoritesService.toggleFavorite(this.product);
    const message = this.isFavorite
      ? 'Added to favorites'
      : 'Removed from favorites';
    this.notificationService.success(message, this.product.title);
  }

  setActiveTab(tab: 'description' | 'specifications' | 'reviews'): void {
    this.activeTab = tab;
  }

  toggleDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  getDescriptionPreview(): string {
    if (!this.product || !this.product.description) return '';
    if (this.showFullDescription) return this.product.description;

    const lines = this.product.description.split('\n');
    if (lines.length <= this.descriptionPreviewLines) {
      return this.product.description;
    }

    return lines.slice(0, this.descriptionPreviewLines).join('\n');
  }

  getFormattedDescription(): string {
    if (!this.product || !this.product.description) return '';
    return this.product.description.replace(/\n/g, '<br>');
  }

  retry(): void {
    this.loadProduct();
  }

  trackByProductId(index: number, product: Product): string {
    return product._id;
  }

  getPrice(): number {
    if (!this.product) return 0;
    return this.product.priceAfterDiscount || this.product.price;
  }

  getOriginalPrice(): number | null {
    if (!this.product || !this.product.priceAfterDiscount) return null;
    return this.product.price;
  }

  getDiscountPercentage(): number | null {
    if (!this.product || !this.product.priceAfterDiscount) return null;
    const discount = ((this.product.price - this.product.priceAfterDiscount) / this.product.price) * 100;
    return Math.round(discount);
  }

  calculateDiscountPercentage(product: Product): number {
    if (!product.priceAfterDiscount) return 0;
    const discount = ((product.price - product.priceAfterDiscount) / product.price) * 100;
    return Math.round(discount);
  }
}
