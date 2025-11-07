import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, PaginatedResponse, SingleResponse } from './api.service';
import { of } from 'rxjs';

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  sold?: number;
  price: number;
  priceAfterDiscount?: number;
  colors?: string[];
  imageCover: string;
  images?: string[];
  category: {
    _id: string;
    name: string;
    slug?: string;
  };
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSize {
  _id: string;
  productId: string;
  sizeName: string;
  quantity: number;
  isActive: boolean;
  isAvailable: boolean;
}

export interface ProductReview {
  _id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private apiService: ApiService) {}

  /**
   * Get single product by ID
   */
  getProductById(id: string): Observable<Product> {
    return this.apiService.getById<Product>('/product', id).pipe(
      map((response: SingleResponse<Product>) => response.data),
      catchError((error) => {
        console.error('Error fetching product:', error);
        throw error;
      })
    );
  }

  /**
   * Get related products by category
   */
  getRelatedProducts(categoryId: string, excludeId: string, limit: number = 4): Observable<Product[]> {
    return this.apiService.getPaginated<Product>('/product', {
      page: 1,
      limit: limit + 1 // Get one extra to account for excluding current product
    }).pipe(
      map((response: PaginatedResponse<Product>) => {
        // Filter out current product and products from different categories
        const related = response.data
          .filter(p => p._id !== excludeId && p.category._id === categoryId)
          .slice(0, limit);
        return related;
      }),
      catchError((error) => {
        console.error('Error fetching related products:', error);
        return of([]);
      })
    );
  }

  /**
   * Get available sizes for a product
   */
  getProductSizes(productId: string): Observable<ProductSize[]> {
    return this.apiService.getSingle<ProductSize[]>(`/sizes/product/${productId}/available`).pipe(
      map((response: SingleResponse<ProductSize[]>) => {
        // Handle both array and object with data property
        if (Array.isArray(response.data)) {
          return response.data;
        }
        // If response is directly an array
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching product sizes:', error);
        return of([]);
      })
    );
  }

  /**
   * Get product reviews (if endpoint exists)
   */
  getProductReviews(productId: string): Observable<ProductReview[]> {
    // Try to fetch reviews, but don't fail if endpoint doesn't exist
    return this.apiService.getSingle<ProductReview[]>(`/product/${productId}/reviews`).pipe(
      map((response: any) => {
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        // Silently fail if reviews endpoint doesn't exist
        console.log('Reviews endpoint not available');
        return of([]);
      })
    );
  }

  /**
   * Get products with pagination and optional filters
   */
  getProducts(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    keyword?: string;
    featured?: boolean;
    category_id?: string;
  }): Observable<PaginatedResponse<Product>> {
    const paginationParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 16,
      sort: params?.sort || '-createdAt'
    };

    if (params?.keyword) {
      paginationParams.keyword = params.keyword;
    }

    if (params?.category_id) {
      paginationParams.category_id = params.category_id;
    }

    // Note: If API supports featured parameter, it will be passed here
    // Otherwise, we'll get latest products and can filter client-side if needed
    return this.apiService.getPaginated<Product>('/product', paginationParams).pipe(
      map((response: PaginatedResponse<Product>) => {
        // If featured filter is requested but API doesn't support it,
        // we can filter by products with priceAfterDiscount (on sale) or most sold
        if (params?.featured) {
          // Sort by sold count (most popular) or products with discounts
          const featured = response.data
            .sort((a, b) => {
              // Prioritize products with discounts, then by sold count
              const aFeatured = a.priceAfterDiscount ? 1 : 0;
              const bFeatured = b.priceAfterDiscount ? 1 : 0;
              if (aFeatured !== bFeatured) return bFeatured - aFeatured;
              return (b.sold || 0) - (a.sold || 0);
            })
            .slice(0, params.limit || 8);
          return {
            ...response,
            data: featured
          };
        }
        return response;
      }),
      catchError((error) => {
        console.error('Error fetching products:', error);
        return of({
          data: [],
          pagination: {
            currentPage: 1,
            itemsPerPage: params?.limit || 16,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        } as PaginatedResponse<Product>);
      })
    );
  }
}
