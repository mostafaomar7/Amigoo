import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { ProductService, Product } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Categoryinfo, Contact } from '../models/category';
import { FavoritesService } from '../../services/favorites.service';
import { OpencartService } from '../../services/opencart.service';
import { EnvironmentService } from '../../services/environment.service';
import { NotificationService } from '../../services/notification.service';
import { QuickAddModalService } from '../../services/quick-add-modal.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  // Categories
  categories: Categoryinfo[] = [];
  loadingCategories = true;
  expectedCategoriesCount = 8; // Default skeleton count

  // Featured Products
  featuredProducts: Product[] = [];
  displayedProductsCount = 8; // Initially show 8 products
  loadingProducts = true;

  // Newsletter
  newsletterForm: FormGroup;
  newsletterSubmitting = false;
  newsletterSuccess = false;
  newsletterError: string | null = null;

  // Contact Form
  contactForm: FormGroup;
  contactSubmitting = false;
  contactSuccess = false;
  contactError: string | null = null;

  // Cart & Favorites counts
  cartCount = 0;
  favoritesCount = 0;

  // Image error handling
  imageErrors = new Set<string>();

  // Categories Slider
  @ViewChild('categoriesSlider', { static: false }) categoriesSlider!: ElementRef<HTMLDivElement>;
  canScrollPrev = false;
  canScrollNext = true;
  currentSlideIndex = 0;
  slidesPerView = 4; // Default for desktop

  // Intersection Observer for lazy loading
  private observer?: IntersectionObserver;
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private favoritesService: FavoritesService,
    private opencartService: OpencartService,
    private environmentService: EnvironmentService,
    private notificationService: NotificationService,
    private quickAddModalService: QuickAddModalService,
    private apiService: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadFeaturedProducts();
    this.updateCartAndFavoritesCount();

    // Listen for cart/favorites updates
    this.opencartService.cartToggle$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateCartAndFavoritesCount();
    });

    // Listen for storage changes
    window.addEventListener('storage', this.onStorageChange.bind(this));
    document.addEventListener('cartUpdated', this.updateCartAndFavoritesCount.bind(this));
    document.addEventListener('favoritesUpdated', this.updateCartAndFavoritesCount.bind(this));
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
    this.updateSlidesPerView();
    this.checkScrollButtons();

    // Listen for window resize to update slider
    window.addEventListener('resize', this.onResize.bind(this));

    // Check scroll buttons after categories load
    setTimeout(() => {
      this.checkScrollButtons();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) {
      this.observer.disconnect();
    }
    window.removeEventListener('storage', this.onStorageChange.bind(this));
    window.removeEventListener('resize', this.onResize.bind(this));
    document.removeEventListener('cartUpdated', this.updateCartAndFavoritesCount.bind(this));
    document.removeEventListener('favoritesUpdated', this.updateCartAndFavoritesCount.bind(this));
  }

  /**
   * Load categories from API
   */
  loadCategories(): void {
    this.loadingCategories = true;
    this.cdr.markForCheck();

    this.categoryService.getCategories()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingCategories = false;
          this.cdr.markForCheck();

          // Setup scroll listener after categories load
          setTimeout(() => {
            this.setupSliderScrollListener();
            this.checkScrollButtons();
            this.applyParallaxEffect(); // Initial parallax effect
          }, 100);
        })
      )
      .subscribe({
        next: (response) => {
          // Handle both direct array and response with data property
          let categoriesData: Categoryinfo[] = [];
          if (response.data && Array.isArray(response.data)) {
            categoriesData = response.data;
          } else if (Array.isArray(response)) {
            categoriesData = response;
          }

          // Update expected count for future loads
          this.expectedCategoriesCount = Math.max(categoriesData.length, 8);
          this.categories = categoriesData; // Load all categories
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.categories = [];
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Setup scroll listener for slider
   */
  setupSliderScrollListener(): void {
    if (!this.categoriesSlider) return;

    const wrapper = this.categoriesSlider.nativeElement;
    const slider = wrapper.querySelector('.categories-slider') as HTMLElement;

    if (!slider) return;

    slider.addEventListener('scroll', () => {
      this.checkScrollButtons();
      this.updateCurrentSlideIndex();
      this.applyParallaxEffect();
    });
  }

  /**
   * Apply parallax effect to slides based on scroll position
   */
  applyParallaxEffect(): void {
    if (!this.categoriesSlider || window.innerWidth < 768) return; // Skip on mobile for performance

    const wrapper = this.categoriesSlider.nativeElement;
    const slider = wrapper.querySelector('.categories-slider') as HTMLElement;

    if (!slider) return;

    const slides = slider.querySelectorAll('.category-slide');
    if (slides.length === 0) return;

    const sliderRect = slider.getBoundingClientRect();
    const sliderCenter = sliderRect.left + sliderRect.width / 2;

    slides.forEach((slide: Element) => {
      const slideElement = slide as HTMLElement;
      const slideRect = slideElement.getBoundingClientRect();
      const slideCenter = slideRect.left + slideRect.width / 2;
      const distance = slideCenter - sliderCenter;
      const maxDistance = sliderRect.width / 2;
      const ratio = Math.max(-1, Math.min(1, distance / maxDistance)); // Clamp between -1 and 1

      // Apply subtle 3D rotation and scale based on position (only on desktop)
      const rotateY = ratio * 3; // Max 3 degrees rotation
      const scale = 1 - Math.abs(ratio) * 0.03; // Slight scale down when out of center
      const translateZ = -Math.abs(ratio) * 15; // Move back when out of center

      // Only apply if not hovering
      if (!slideElement.querySelector('.category-card:hover')) {
        slideElement.style.transform = `perspective(1000px) rotateY(${rotateY}deg) scale(${scale}) translateZ(${translateZ}px)`;
        slideElement.style.filter = `brightness(${1 - Math.abs(ratio) * 0.1})`;
      }
    });
  }

  /**
   * Load featured products
   */
  loadFeaturedProducts(): void {
    this.loadingProducts = true;
    this.cdr.markForCheck();

    // Load more products initially (20) but display only 8
    this.productService.getProducts({
      page: 1,
      limit: 20,
      sort: '-createdAt',
      featured: true
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingProducts = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.featuredProducts = response.data || [];
          this.displayedProductsCount = 8; // Reset to initial display count
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading featured products:', error);
          this.featuredProducts = [];
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Get displayed products (limited to displayedProductsCount)
   */
  getDisplayedProducts(): Product[] {
    return this.featuredProducts.slice(0, this.displayedProductsCount);
  }

  /**
   * Check if there are more products to show
   */
  hasMoreProducts(): boolean {
    return this.displayedProductsCount < this.featuredProducts.length;
  }

  /**
   * Navigate to products page (shop page)
   */
  showMoreProducts(): void {
    this.navigateToProducts();
  }

  /**
   * Get image URL for category
   */
  getCategoryImageUrl(category: Categoryinfo): string {
    if (!category.image) return '';
    if (category.image.startsWith('http://') || category.image.startsWith('https://')) {
      return category.image;
    }
    return `${this.environmentService.imageBaseUrl}uploads/category/${category.image}`;
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
   * Navigate to category products
   */
  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/shop'], { queryParams: { category: categoryId } });
  }

  /**
   * Navigate to product details
   */
  navigateToProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
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
        this.updateCartAndFavoritesCount();
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
    this.updateCartAndFavoritesCount();

    if (isFavorite) {
      this.notificationService.success('تمت الإضافة إلى المفضلة', `تمت إضافة ${product.title} إلى المفضلة`);
    } else {
      this.notificationService.info('تمت الإزالة من المفضلة', `تمت إزالة ${product.title} من المفضلة`);
    }
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

  /**
   * Submit newsletter form
   */
  onSubmitNewsletter(): void {
    if (this.newsletterForm.invalid) {
      this.markFormGroupTouched(this.newsletterForm);
      return;
    }

    this.newsletterSubmitting = true;
    this.newsletterError = null;
    this.newsletterSuccess = false;
    this.cdr.markForCheck();

    const email = this.newsletterForm.get('email')?.value;

    // Mock API call - replace with actual endpoint if available
    this.apiService.postCustom('/newsletter', { email })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.newsletterSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.newsletterSuccess = true;
          this.newsletterForm.reset();
          this.notificationService.success('Successfully Subscribed', 'Thank you for subscribing to our newsletter!');
          this.cdr.markForCheck();
        },
        error: (error) => {
          // If endpoint doesn't exist, show success anyway (mock behavior)
          this.newsletterSuccess = true;
          this.newsletterForm.reset();
          this.notificationService.success('Successfully Subscribed', 'Thank you for subscribing to our newsletter!');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Mark form group as touched for validation
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Update cart and favorites count
   */
  updateCartAndFavoritesCount(): void {
    if (this.opencartService.cartproduct) {
      this.cartCount = this.opencartService.cartproduct.length;
    } else {
      try {
        const cart = localStorage.getItem('cart');
        this.cartCount = cart ? JSON.parse(cart).length : 0;
      } catch {
        this.cartCount = 0;
      }
    }

    this.favoritesCount = this.favoritesService.getCount();
    this.cdr.markForCheck();
  }

  /**
   * Handle storage change event
   */
  onStorageChange(event: StorageEvent): void {
    if (event.key === 'cart' || event.key === 'star') {
      this.updateCartAndFavoritesCount();
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return; // Browser doesn't support IntersectionObserver
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset['src']) {
              img.src = img.dataset['src'] || '';
              img.removeAttribute('data-src');
              this.observer?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    // Observe all lazy images
    setTimeout(() => {
      document.querySelectorAll('img[data-src]').forEach(img => {
        this.observer?.observe(img);
      });
    }, 100);
  }

  /**
   * Track by function for categories
   */
  trackByCategoryId(index: number, category: Categoryinfo): string {
    return category._id || index.toString();
  }

  /**
   * Track by function for products
   */
  trackByProductId(index: number, product: Product): string {
    return product._id;
  }

  /**
   * Navigate to products page (shop page)
   */
  navigateToProducts(): void {
    this.router.navigate(['/shop']);
  }

  /**
   * Submit contact form
   */
  onSubmitContactForm(): void {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched(this.contactForm);
      this.contactError = 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح';
      this.contactSuccess = false;
      this.cdr.markForCheck();
      return;
    }

    this.contactSubmitting = true;
    this.contactError = null;
    this.contactSuccess = false;
    this.cdr.markForCheck();

    const formValue = this.contactForm.value;
    const contactData: Contact = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      message: formValue.message,
      termsAccepted: formValue.termsAccepted
    };

    this.categoryService.sendContactForm(contactData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.contactSuccess = true;
          this.contactError = null;
          this.contactForm.reset();
          this.contactForm.patchValue({ termsAccepted: false });
          this.notificationService.success('تم الإرسال بنجاح', 'شكراً لك! سنتواصل معك قريباً.');
          this.contactSubmitting = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error submitting contact form:', error);
          this.contactError = 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.';
          this.contactSuccess = false;
          this.contactSubmitting = false;
          this.notificationService.error('خطأ', 'فشل إرسال النموذج. يرجى المحاولة مرة أخرى.');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Get contact form field error
   */
  getContactFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) {
      return 'هذا الحقل مطلوب';
    }
    if (field.errors['email']) {
      return 'البريد الإلكتروني غير صحيح';
    }
    if (field.errors['minlength']) {
      if (fieldName === 'name') {
        return 'الاسم يجب أن يكون حرفين على الأقل';
      }
      if (fieldName === 'message') {
        return 'الرسالة يجب أن تكون 10 أحرف على الأقل';
      }
      return `يجب أن يكون ${field.errors['minlength'].requiredLength} أحرف على الأقل`;
    }
    if (field.errors['pattern']) {
      if (fieldName === 'phone') {
        return 'رقم الهاتف يجب أن يكون 11 رقم';
      }
    }
    if (field.errors['requiredTrue']) {
      return 'يجب الموافقة على الشروط والأحكام';
    }
    return '';
  }

  /**
   * Scroll categories slider
   */
  scrollCategories(direction: 'prev' | 'next'): void {
    if (!this.categoriesSlider) return;

    const wrapper = this.categoriesSlider.nativeElement;
    const slider = wrapper.querySelector('.categories-slider') as HTMLElement;

    if (!slider) return;

    const slides = slider.querySelectorAll('.category-slide');
    if (slides.length === 0) return;

    // Get the width of one slide including gap
    const firstSlide = slides[0] as HTMLElement;
    const slideWidth = firstSlide.offsetWidth;
    const gap = 24; // 1.5rem = 24px
    const scrollAmount = (slideWidth + gap) * this.slidesPerView;

    if (direction === 'next') {
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }

    // Update scroll buttons after animation
    setTimeout(() => {
      this.checkScrollButtons();
      this.updateCurrentSlideIndex();
      this.applyParallaxEffect();
    }, 300);
  }

  /**
   * Go to specific slide
   */
  goToSlide(index: number): void {
    if (!this.categoriesSlider) return;

    const wrapper = this.categoriesSlider.nativeElement;
    const slider = wrapper.querySelector('.categories-slider') as HTMLElement;

    if (!slider) return;

    const slides = slider.querySelectorAll('.category-slide');
    if (slides.length === 0) return;

    const firstSlide = slides[0] as HTMLElement;
    const slideWidth = firstSlide.offsetWidth;
    const gap = 24; // 1.5rem = 24px
    const targetScroll = (slideWidth + gap) * this.slidesPerView * index;

    slider.scrollTo({ left: targetScroll, behavior: 'smooth' });

    setTimeout(() => {
      this.checkScrollButtons();
      this.updateCurrentSlideIndex();
      this.applyParallaxEffect();
    }, 300);
  }

  /**
   * Check if scroll buttons should be enabled
   */
  checkScrollButtons(): void {
    if (!this.categoriesSlider) {
      this.canScrollPrev = false;
      this.canScrollNext = false;
      return;
    }

    const wrapper = this.categoriesSlider.nativeElement;
    const slider = wrapper.querySelector('.categories-slider') as HTMLElement;

    if (!slider) {
      this.canScrollPrev = false;
      this.canScrollNext = false;
      return;
    }

    const maxScroll = slider.scrollWidth - slider.clientWidth;

    this.canScrollPrev = slider.scrollLeft > 0;
    this.canScrollNext = slider.scrollLeft < maxScroll - 1; // -1 for rounding issues

    this.cdr.markForCheck();
  }

  /**
   * Update current slide index based on scroll position
   */
  updateCurrentSlideIndex(): void {
    if (!this.categoriesSlider) return;

    const wrapper = this.categoriesSlider.nativeElement;
    const slider = wrapper.querySelector('.categories-slider') as HTMLElement;

    if (!slider) return;

    const slides = slider.querySelectorAll('.category-slide');
    if (slides.length === 0) return;

    const firstSlide = slides[0] as HTMLElement;
    const slideWidth = firstSlide.offsetWidth;
    const gap = 24; // 1.5rem = 24px
    const slideGroupWidth = (slideWidth + gap) * this.slidesPerView;

    this.currentSlideIndex = Math.round(slider.scrollLeft / slideGroupWidth);

    this.cdr.markForCheck();
  }

  /**
   * Get slider dots array
   */
  getSliderDots(): number[] {
    if (!this.categories || this.categories.length === 0) return [];

    const totalSlides = Math.ceil(this.categories.length / this.slidesPerView);
    return Array.from({ length: totalSlides }, (_, i) => i);
  }

  /**
   * Get skeleton items array for loading state
   */
  getSkeletonItems(): number[] {
    // Use actual categories count if available, otherwise use expected count
    const count = this.categories.length > 0 ? this.categories.length : this.expectedCategoriesCount;
    return Array.from({ length: count }, (_, i) => i);
  }

  /**
   * Update slides per view based on screen size
   */
  updateSlidesPerView(): void {
    const width = window.innerWidth;

    if (width >= 1200) {
      this.slidesPerView = 4; // Large screens: 4 categories
    } else if (width >= 992) {
      this.slidesPerView = 3; // Medium screens: 3 categories
    } else if (width >= 768) {
      this.slidesPerView = 2; // Small screens: 2 categories
    } else {
      this.slidesPerView = 1.5; // Mobile: 1.5 categories (partial view)
    }

    this.cdr.markForCheck();
  }

  /**
   * Handle window resize
   */
  onResize(): void {
    this.updateSlidesPerView();
    setTimeout(() => {
      this.checkScrollButtons();
      this.updateCurrentSlideIndex();
    }, 100);
  }
}
