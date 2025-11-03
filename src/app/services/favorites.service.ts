import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FavoriteItem {
  _id: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoritesKey = 'star';
  private favoritesSubject = new BehaviorSubject<string[]>(this.getFavoriteIds());

  constructor() {
    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', () => {
      this.favoritesSubject.next(this.getFavoriteIds());
    });

    // Listen for custom events (same-tab updates)
    document.addEventListener('favoritesUpdated', () => {
      this.favoritesSubject.next(this.getFavoriteIds());
    });
  }

  /**
   * Get all favorite IDs
   */
  getFavoriteIds(): string[] {
    try {
      const favorites = localStorage.getItem(this.favoritesKey);
      if (!favorites) return [];
      const favoriteItems: FavoriteItem[] = JSON.parse(favorites);
      return favoriteItems.map(item => item._id);
    } catch {
      return [];
    }
  }

  /**
   * Get all favorite items
   */
  getFavorites(): FavoriteItem[] {
    try {
      const favorites = localStorage.getItem(this.favoritesKey);
      if (!favorites) return [];
      return JSON.parse(favorites);
    } catch {
      return [];
    }
  }

  /**
   * Check if a product is favorited
   */
  isFavorite(productId: string): boolean {
    return this.getFavoriteIds().includes(productId);
  }

  /**
   * Add product to favorites
   */
  addToFavorites(product: any): void {
    const favorites = this.getFavorites();

    if (this.isFavorite(product._id)) {
      return; // Already favorited
    }

    favorites.push({
      ...product,
      quantity: 1
    });

    localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
    this.favoritesSubject.next(this.getFavoriteIds());
    document.dispatchEvent(new CustomEvent('favoritesUpdated'));
  }

  /**
   * Remove product from favorites
   */
  removeFromFavorites(productId: string): void {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(item => item._id !== productId);

    localStorage.setItem(this.favoritesKey, JSON.stringify(filtered));
    this.favoritesSubject.next(this.getFavoriteIds());
    document.dispatchEvent(new CustomEvent('favoritesUpdated'));
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(product: any): boolean {
    if (this.isFavorite(product._id)) {
      this.removeFromFavorites(product._id);
      return false;
    } else {
      this.addToFavorites(product);
      return true;
    }
  }

  /**
   * Get favorites count
   */
  getCount(): number {
    return this.getFavoriteIds().length;
  }

  /**
   * Get favorites as observable
   */
  getFavoritesObservable(): Observable<string[]> {
    return this.favoritesSubject.asObservable();
  }
}
