import { Injectable } from '@angular/core';

/**
 * Order Storage Service
 *
 * Handles storing and retrieving orders from LocalStorage
 * Simple service for managing order history locally
 */
@Injectable({
  providedIn: 'root'
})
export class OrderStorageService {
  private readonly STORAGE_KEY = 'orderHistory';

  /**
   * Save order to LocalStorage
   * @param order - Order object to save
   * @returns boolean - true if saved successfully
   */
  saveOrder(order: any): boolean {
    try {
      // Get existing orders from LocalStorage
      const existingOrders = this.getOrders();

      // Add new order with timestamp and unique ID
      const orderWithMetadata = {
        ...order,
        id: this.generateOrderId(),
        createdAt: new Date().toISOString(),
        status: 'pending' // Default status, admin will update this
      };

      // Add to beginning of array (newest first)
      existingOrders.unshift(orderWithMetadata);

      // Save back to LocalStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingOrders));

      // Dispatch custom event to notify navbar
      document.dispatchEvent(new CustomEvent('orderHistoryUpdated'));

      return true;
    } catch (error) {
      console.error('Error saving order to LocalStorage:', error);
      return false;
    }
  }

  /**
   * Get all orders from LocalStorage
   * @returns Array of orders
   */
  getOrders(): any[] {
    try {
      const ordersJson = localStorage.getItem(this.STORAGE_KEY);
      if (!ordersJson) {
        return [];
      }
      return JSON.parse(ordersJson);
    } catch (error) {
      console.error('Error reading orders from LocalStorage:', error);
      return [];
    }
  }

  /**
   * Get single order by ID
   * @param orderId - Order ID to find
   * @returns Order object or null
   */
  getOrderById(orderId: string): any | null {
    const orders = this.getOrders();
    return orders.find(order => order.id === orderId) || null;
  }

  /**
   * Update order status (called by admin dashboard)
   * @param orderId - Order ID to update
   * @param status - New status
   * @returns boolean - true if updated successfully
   */
  updateOrderStatus(orderId: string, status: string): boolean {
    try {
      const orders = this.getOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);

      if (orderIndex === -1) {
        return false;
      }

      orders[orderIndex].status = status;
      orders[orderIndex].updatedAt = new Date().toISOString();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));

      // Dispatch custom event to notify navbar
      document.dispatchEvent(new CustomEvent('orderHistoryUpdated'));

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  /**
   * Delete order from LocalStorage
   * @param orderId - Order ID to delete
   * @returns boolean - true if deleted successfully
   */
  deleteOrder(orderId: string): boolean {
    try {
      const orders = this.getOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredOrders));

      // Dispatch custom event to notify navbar
      document.dispatchEvent(new CustomEvent('orderHistoryUpdated'));

      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  /**
   * Clear all orders from LocalStorage
   */
  clearAllOrders(): void {
    localStorage.removeItem(this.STORAGE_KEY);

    // Dispatch custom event to notify navbar
    document.dispatchEvent(new CustomEvent('orderHistoryUpdated'));
  }

  /**
   * Generate unique order ID
   * Format: ORD-{timestamp}-{random}
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}
