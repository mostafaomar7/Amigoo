import { ApifunctionService } from '../../../services/apifunction.service';
import { CartService, CartItem } from '../../../services/cart.service';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { OpencartService } from '../../../services/opencart.service';
import { EnvironmentService } from '../../../services/environment.service';
import { NotificationService } from '../../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() nav: any = {};
  @Output() itemnav = new EventEmitter();
  @Output() categorySelected = new EventEmitter<string>();
  @ViewChild('categoriesContainer', { static: false }) categoriesContainer!: ElementRef<HTMLDivElement>;

  // State
  navbarActive = false;
  searchActive = false;
  cartActive = false;
  favoritesActive = false;
  canScrollLeft = false;
  canScrollRight = false;

  // Data
  cartItems: CartItem[] = [];
  alldata: any[] = [];
  allcatgory: any[] = [];
  cartproduct: any[] = [];
  starproduct: any[] = [];
  total: any = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private openser: OpencartService,
    private cartService: CartService,
    private serv: ApifunctionService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private environmentService: EnvironmentService,
    private notificationService: NotificationService
  ) {}

  /**
   * Get product image URL
   */
  getProductImageUrl(imageCover: string): string {
    if (!imageCover) return '';
    if (imageCover.startsWith('http://') || imageCover.startsWith('https://')) {
      return imageCover;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${imageCover}`;
  }

  /**
   * Handle image error
   */
  onImageError(item: any): void {
    item.imageError = true;
    this.cdr.markForCheck();
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
      'brown': '#795548'
    };

    const lowerColor = color.toLowerCase().trim();
    return colorMap[lowerColor] || '#6c757d';
  }

  ngOnInit(): void {
    this.getdata();
    this.getcartproducts();
    this.getstarproducts();

    // Listen for storage changes (cross-tab updates)
    window.addEventListener('storage', this.onStorageChange.bind(this));

    // Listen for custom events (same-tab updates)
    document.addEventListener('cartUpdated', this.updateCartAndFavoritesCount.bind(this));
    document.addEventListener('favoritesUpdated', this.updateCartAndFavoritesCount.bind(this));

    // Listen for clicks outside mobile menu
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    this.cartService.getCartItems().subscribe((items) => {
      this.cartItems = items;
      this.cdr.markForCheck();
    });

    // Periodically update counts (as a fallback)
    setInterval(() => {
      this.updateCartAndFavoritesCount();
    }, 2000);
  }

  ngAfterViewInit(): void {
    // Check scroll position after view init
    setTimeout(() => {
      this.checkScrollPosition();
      if (this.categoriesContainer) {
        this.categoriesContainer.nativeElement.addEventListener('scroll', () => {
          this.checkScrollPosition();
        });
        // Also check when window resizes
        window.addEventListener('resize', () => {
          this.checkScrollPosition();
        });
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('storage', this.onStorageChange.bind(this));
    window.removeEventListener('resize', this.checkScrollPosition.bind(this));
    document.removeEventListener('cartUpdated', this.updateCartAndFavoritesCount.bind(this));
    document.removeEventListener('favoritesUpdated', this.updateCartAndFavoritesCount.bind(this));
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    if (this.categoriesContainer) {
      this.categoriesContainer.nativeElement.removeEventListener('scroll', this.checkScrollPosition.bind(this));
    }
  }

  updateCartAndFavoritesCount(): void {
    this.getcartproducts();
    this.getstarproducts();
    this.cdr.markForCheck();
  }

  onStorageChange(event: StorageEvent): void {
    if (event.key === 'cart' || event.key === 'star') {
      this.updateCartAndFavoritesCount();
    }
  }

  getstarproducts(): void {
    if ("star" in localStorage) {
      this.starproduct = JSON.parse(localStorage.getItem("star")!);
    }
    this.gettotalprice();
  }

  getcartproducts(): void {
    if ("cart" in localStorage) {
      this.cartproduct = JSON.parse(localStorage.getItem("cart")!);
      // Initialize imageError for each item
      this.cartproduct.forEach((item: any) => {
        if (!item.hasOwnProperty('imageError')) {
          item.imageError = false;
        }
      });
    }
    this.gettotalprice();
  }

  gettotalprice(): void {
    this.total = 0;
    for (let x in this.cartproduct) {
      this.total += this.cartproduct[x].price * this.cartproduct[x].quantity;
    }
    this.cdr.markForCheck();
  }

  increase(index: number): void {
    this.cartproduct[index].quantity++;
    localStorage.setItem("cart", JSON.stringify(this.cartproduct));
    this.gettotalprice();
  }

  decrease(index: number): void {
    if (this.cartproduct[index].quantity > 1) {
      this.cartproduct[index].quantity--;
      localStorage.setItem("cart", JSON.stringify(this.cartproduct));
      this.gettotalprice();
    }
  }

  detectedchange(): void {
    localStorage.setItem("cart", JSON.stringify(this.cartproduct));
    this.gettotalprice();
    localStorage.setItem("star", JSON.stringify(this.starproduct));
  }

  delete(index: number): void {
    if (index >= 0 && index < this.cartproduct.length) {
      const product = this.cartproduct[index];
      this.cartproduct.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(this.cartproduct));
      this.gettotalprice();
      if (this.starproduct[index]) {
        this.starproduct.splice(index, 1);
        localStorage.setItem("star", JSON.stringify(this.starproduct));
      }
      this.notificationService.success('تمت الإزالة من السلة', `تمت إزالة ${product.title || 'المنتج'} من السلة`);
      document.dispatchEvent(new CustomEvent('cartUpdated'));
      this.cdr.markForCheck();
    }
  }

  ClearAllProducts(): void {
    if (this.cartproduct.length > 0) {
      this.cartproduct.splice(0, this.cartproduct.length);
      localStorage.setItem("cart", JSON.stringify(this.cartproduct));
      this.gettotalprice();
      this.notificationService.success('تم مسح السلة', 'تمت إزالة جميع المنتجات من السلة');
      document.dispatchEvent(new CustomEvent('cartUpdated'));
      this.cdr.markForCheck();
    }
  }

  getdata(): void {
    this.serv.getcatgory().subscribe((data: any) => {
      // Handle different response structures
      if (data && data.data && Array.isArray(data.data)) {
        // Response has { data: [...] } structure
        this.allcatgory = data.data;
      } else if (Array.isArray(data)) {
        // Response is directly an array
        this.allcatgory = data;
      } else if (typeof data === 'object') {
        // Response is an object, try to extract array
        this.allcatgory = Object.values(data);
      } else {
        this.allcatgory = [];
      }
      this.cdr.markForCheck();
      // Check scroll position after categories load
      setTimeout(() => {
        this.checkScrollPosition();
      }, 100);
    }, error => {
      console.error('Error loading categories:', error);
      this.allcatgory = [];
      this.cdr.markForCheck();
    });
  }

  getproductcatgory(id: any): void {
    this.serv.getproductybycatgory(id).subscribe((res: any) => {
      this.alldata = res;
      this.alldata = Object.values(this.alldata);
    });
  }

  onCategoryChange(value: string): void {
    if (value && value !== 'OurShop') {
      this.categorySelected.emit(value);
      this.router.navigate(['/product'], { queryParams: { category: value } });
    } else {
      this.router.navigate(['/product']);
    }
  }

  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/shop'], { queryParams: { category: categoryId } });
    this.cdr.markForCheck();
  }

  navigateToProducts(): void {
    this.router.navigate(['/shop']);
    this.cdr.markForCheck();
  }

  isProductsActive(): boolean {
    return !this.route.snapshot.queryParams['category'];
  }

  isCategoryActive(categoryId: string): boolean {
    return this.route.snapshot.queryParams['category'] === categoryId;
  }

  scrollCategories(direction: 'left' | 'right'): void {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (!this.categoriesContainer || !this.categoriesContainer.nativeElement) {
        return;
      }

      const container = this.categoriesContainer.nativeElement;
      const scrollAmount = 200;
      const currentScroll = container.scrollLeft;

      // Calculate new scroll position
      let newScroll: number;
      if (direction === 'left') {
        newScroll = Math.max(0, currentScroll - scrollAmount);
      } else {
        const maxScroll = container.scrollWidth - container.clientWidth;
        newScroll = Math.min(maxScroll, currentScroll + scrollAmount);
      }

      // Scroll the container
      container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });

      // Update scroll buttons after scroll animation
      setTimeout(() => {
        this.checkScrollPosition();
      }, 350);

      this.cdr.markForCheck();
    }, 0);
  }

  checkScrollPosition(): void {
    if (!this.categoriesContainer) return;

    const container = this.categoriesContainer.nativeElement;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    // Check if we can scroll in either direction (with small threshold)
    this.canScrollLeft = scrollLeft > 5;
    this.canScrollRight = scrollLeft < (maxScroll - 5);

    this.cdr.markForCheck();
  }

  trackByCategoryId(index: number, category: any): string {
    return category._id || index.toString();
  }

  toggleNavbar(): void {
    this.navbarActive = !this.navbarActive;
    if (this.navbarActive) {
      this.searchActive = false;
      this.cartActive = false;
      this.favoritesActive = false;
    }
    this.cdr.markForCheck();
  }

  closeNavbar(): void {
    this.navbarActive = false;
    this.cdr.markForCheck();
  }

  handleDocumentClick(event: MouseEvent): void {
    if (!this.navbarActive) return;

    const target = event.target as HTMLElement;
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');

    // Close menu if click is outside menu and not on menu button
    if (menuBtn && !menuBtn.contains(target) &&
        mobileMenu && !mobileMenu.contains(target)) {
      this.closeNavbar();
    }
  }

  toggleSearchForm(): void {
    this.searchActive = !this.searchActive;
    if (this.searchActive) {
      this.navbarActive = false;
      this.cartActive = false;
      this.favoritesActive = false;
    }
    this.cdr.markForCheck();
  }

  toggleCartItem(): void {
    this.cartActive = !this.cartActive;
    if (this.cartActive) {
      this.navbarActive = false;
      this.searchActive = false;
      this.favoritesActive = false;
    }
    this.cdr.markForCheck();
  }

  togglestarItem(): void {
    this.navbarActive = false;
    this.searchActive = false;
    this.cartActive = false;
    this.favoritesActive = false;

    this.router.navigate(['/wishlist']).then(() => {
      this.cdr.markForCheck();
    });
  }
}
