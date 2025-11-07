import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Product } from '../../services/product.service';
import { FavoritesService } from '../../services/favorites.service';
import { OpencartService } from '../../services/opencart.service';
import { NotificationService } from '../../services/notification.service';
import { ProductCardComponent } from '../shop/components/product-card/product-card.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlistItems: Product[] = [];
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private favoritesService: FavoritesService,
    private opencartService: OpencartService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWishlist();

    // Listen for wishlist updates
    this.favoritesService.getFavoritesObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadWishlist();
      });

    // Listen for storage changes
    window.addEventListener('storage', this.onStorageChange.bind(this));
    document.addEventListener('favoritesUpdated', this.onFavoritesUpdated.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('storage', this.onStorageChange.bind(this));
    document.removeEventListener('favoritesUpdated', this.onFavoritesUpdated.bind(this));
  }

  loadWishlist(): void {
    this.loading = true;

    // Small delay to show loading skeleton
    setTimeout(() => {
      const favorites = this.favoritesService.getFavorites();
      this.wishlistItems = favorites.map((item: any) => ({
        _id: item._id,
        title: item.title || item.name,
        description: item.description || '',
        price: item.price || 0,
        priceAfterDiscount: item.priceAfterDiscount || item.price || 0,
        imageCover: item.imageCover || item.image || '',
        images: item.images || [],
        category: item.category || { _id: '', name: '' },
        sold: item.sold || 0,
        colors: item.colors || []
      } as Product));

      this.loading = false;
      this.cdr.markForCheck();
    }, 300);
  }

  onStorageChange(event: StorageEvent): void {
    if (event.key === 'star') {
      this.loadWishlist();
    }
  }

  onFavoritesUpdated(): void {
    this.loadWishlist();
  }

  removeFromWishlist(product: Product): void {
    this.favoritesService.removeFromFavorites(product._id);
    this.notificationService.success('تمت الإزالة', `${product.title} تمت إزالته من المفضلة`);
    this.loadWishlist();
  }

  clearAllWishlist(): void {
    const favorites = this.favoritesService.getFavorites();
    favorites.forEach((item: any) => {
      this.favoritesService.removeFromFavorites(item._id);
    });
    this.notificationService.success('تم المسح', 'تم مسح جميع المنتجات من المفضلة');
    this.loadWishlist();
  }

  trackByProductId(index: number, product: Product): string {
    return product._id;
  }

  navigateToShop(): void {
    this.router.navigate(['/shop']);
  }
}
