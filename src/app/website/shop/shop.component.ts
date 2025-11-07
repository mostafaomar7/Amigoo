import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize, skip } from 'rxjs/operators';

import { ProductService, Product } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Categoryinfo } from '../models/category';
import { TopFilterBarComponent, SortOption } from './components/top-filter-bar/top-filter-bar.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, TopFilterBarComponent, ProductCardComponent],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopComponent implements OnInit, OnDestroy {
  // Products
  products: Product[] = [];
  loading = false;
  loadingMore = false;
  error: string | null = null;
  hasMore = true;
  currentPage = 1;
  totalPages = 1;

  // Filters
  categories: Categoryinfo[] = [];
  loadingCategories = false;
  selectedCategory: string | null = null;
  selectedSort: SortOption = 'latest';

  // Sorting map
  sortMap: { [key in SortOption]: string } = {
    'latest': '-createdAt',
    'highest_price': '-price',
    'lowest_price': 'price',
    'best_selling': '-sold'
  };

  private destroy$ = new Subject<void>();
  private isLoadingPage = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // First, check snapshot for initial query params (handles page refresh)
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['category']) {
      this.selectedCategory = snapshotParams['category'];
      console.log('Initial category from snapshot:', this.selectedCategory);
    } else {
      this.selectedCategory = null;
      console.log('No category in snapshot');
    }

    // Load categories first
    this.loadCategories();

    // Subscribe to query param changes (handles navigation)
    // Skip the first emission since we already handle it with snapshot
    this.route.queryParams.pipe(
      skip(1), // Skip initial emission (handled by snapshot)
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
        console.log('Category changed from query params:', this.selectedCategory);
      } else {
        this.selectedCategory = null;
        console.log('Category cleared from query params');
      }
      this.loadProducts(true);
    });

    // Load initial products with current category filter
    this.loadProducts(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (this.isLoadingPage || !this.hasMore || this.loadingMore) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercentage = (scrollTop + windowHeight) / documentHeight;

    // Load more when 80% scrolled
    if (scrollPercentage > 0.8) {
      this.loadMoreProducts();
    }
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getCategories().pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loadingCategories = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.categories = response.data;
        } else if (Array.isArray(response)) {
          this.categories = response;
        } else {
          this.categories = [];
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
        this.notificationService.error('خطأ', 'فشل تحميل الفئات');
      }
    });
  }

  loadProducts(reset: boolean = false): void {
    if (this.isLoadingPage) return;

    if (reset) {
      this.currentPage = 1;
      this.products = [];
      this.hasMore = true;
      this.error = null;
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.isLoadingPage = true;
    this.loading = reset;
    this.loadingMore = !reset;

    const sortParam = this.sortMap[this.selectedSort];
    const params: any = {
      page: this.currentPage,
      limit: 16,
      sort: sortParam
    };

    if (this.selectedCategory) {
      params.category_id = this.selectedCategory;
      console.log('Loading products with category filter:', this.selectedCategory);
      console.log('Params object:', JSON.stringify(params));
    } else {
      console.log('Loading products without category filter');
    }

    this.productService.getProducts(params).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoadingPage = false;
        this.loading = false;
        this.loadingMore = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          if (reset) {
            this.products = response.data;
          } else {
            this.products = [...this.products, ...response.data];
          }

          if (response.pagination) {
            this.currentPage = response.pagination.currentPage;
            this.totalPages = response.pagination.totalPages;
            this.hasMore = response.pagination.hasNextPage || false;
          } else {
            // Fallback if pagination structure is different
            this.hasMore = response.data.length >= 16;
          }
        } else {
          this.error = 'No products found';
          this.hasMore = false;
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'فشل تحميل المنتجات. يرجى المحاولة مرة أخرى.';
        this.hasMore = false;

        if (reset) {
          this.notificationService.error('خطأ', 'فشل تحميل المنتجات');
        }
      }
    });
  }

  loadMoreProducts(): void {
    if (!this.hasMore || this.loadingMore || this.isLoadingPage) return;

    this.currentPage++;
    this.loadProducts(false);
  }

  onCategoryChange(categoryId: string | null): void {
    this.selectedCategory = categoryId;

    // Update URL query params
    const queryParams: any = {};
    if (categoryId) {
      queryParams.category = categoryId;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });

    this.loadProducts(true);
  }

  onSortChange(sort: SortOption): void {
    this.selectedSort = sort;
    this.loadProducts(true);
  }

  onLoadMoreClick(): void {
    this.loadMoreProducts();
  }

  trackByProductId(index: number, product: Product): string {
    return product._id;
  }

  getEmptyStateMessage(): string {
    if (this.selectedCategory) {
      return 'لا توجد منتجات في هذه الفئة';
    }
    return 'لا توجد منتجات متاحة حالياً';
  }
}
