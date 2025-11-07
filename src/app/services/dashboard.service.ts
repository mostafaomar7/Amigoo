import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  unreadMessages: number;
  // Include full order statistics to avoid duplicate API calls
  orderStatistics?: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  };
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: Date;
  type: 'order' | 'product' | 'message';
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    // Use getOrderStatistics to avoid duplicate API calls to /Order/stats
    return forkJoin({
      products: this.getProductsCount(),
      orders: this.getOrderStatistics(),
      messages: this.getUnreadMessagesCount()
    }).pipe(
      map(data => ({
        totalProducts: data.products,
        totalOrders: data.orders.totalOrders,
        pendingOrders: data.orders.pendingOrders,
        totalRevenue: data.orders.totalRevenue,
        unreadMessages: data.messages,
        // Include full order statistics to avoid duplicate API calls
        orderStatistics: data.orders
      }))
    );
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    return forkJoin({
      recentOrders: this.getRecentOrders(),
      recentProducts: this.getRecentProducts(),
      recentMessages: this.getRecentMessages()
    }).pipe(
      map(data => {
        const activities: RecentActivity[] = [];

        data.recentOrders.forEach((order: any) => {
          activities.push({
            id: order._id,
            description: `New order #${order.orderNumber || order._id.slice(-6)} from ${order.fullName || 'Customer'}`,
            timestamp: new Date(order.createdAt),
            type: 'order'
          });
        });

        data.recentProducts.forEach((product: any) => {
          activities.push({
            id: product._id,
            description: `Product "${product.title}" was added`,
            timestamp: new Date(product.createdAt),
            type: 'product'
          });
        });

        data.recentMessages.forEach((message: any) => {
          activities.push({
            id: message._id,
            description: `New message from ${message.name}`,
            timestamp: new Date(message.createdAt),
            type: 'message'
          });
        });

        return activities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 10);
      })
    );
  }

  private getProductsCount(): Observable<number> {
    // Fetch products to get total count from results
    return this.http.get<any>(`${this.apiUrl}/product?limit=1`, { headers: this.getHeaders() })
      .pipe(map(response => response.results || 0));
  }

  private getUnreadMessagesCount(): Observable<number> {
    // Fetch all contact forms and count unread (isReplied: false)
    return this.http.get<any>(`${this.apiUrl}/submit`, { headers: this.getHeaders() })
      .pipe(map(response => {
        const data = response.data || [];
        // Count messages where isReplied is false
        return data.filter((msg: any) => msg.isReplied === false).length;
      }));
  }

  private getRecentOrders(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/Order?limit=5&sort=-createdAt`, { headers: this.getHeaders() })
      .pipe(map(response => response.data || []));
  }

  private getRecentProducts(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/product?limit=5&sort=-createdAt`, { headers: this.getHeaders() })
      .pipe(map(response => response.data || []));
  }

  private getRecentMessages(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/submit?limit=5&sort=-createdAt`, { headers: this.getHeaders() })
      .pipe(map(response => response.data || []));
  }

  getShippingInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/settings/shipping/info`, { headers: this.getHeaders() });
  }

  calculateShipping(orderAmount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/settings/shipping/calculate`,
      { orderAmount },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get complete order statistics for admin dashboard
   * Returns total, pending, completed, cancelled orders and total revenue
   * Uses shareReplay to cache the result within the same execution context
   * to avoid duplicate API calls when called multiple times
   */
  getOrderStatistics(): Observable<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/Order/stats`, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          // API returns data in response.data object
          const stats = response.data || response;
          return {
            totalOrders: stats.totalOrders || 0,
            pendingOrders: stats.pendingOrders || 0,
            completedOrders: stats.completedOrders || 0,
            cancelledOrders: stats.cancelledOrders || 0,
            totalRevenue: stats.totalRevenue || 0
          };
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
  }
}
