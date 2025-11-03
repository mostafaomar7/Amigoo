import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private recentNotifications = new Map<string, number>(); // Track recent notifications to prevent duplicates
  private readonly DUPLICATE_THRESHOLD = 2000; // 2 seconds threshold for duplicates

  constructor() {}

  /**
   * Show success notification
   */
  success(title: string, message: string, duration = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Show error notification
   */
  error(title: string, message: string, duration = 7000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Show info notification
   */
  info(title: string, message: string, duration = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Show warning notification
   */
  warning(title: string, message: string, duration = 6000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Add notification to the list
   * Prevents duplicate notifications with same type, title, and message
   */
  private addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;

    // Create a unique key for this notification content
    const notificationKey = `${notification.type}|${notification.title}|${notification.message}`;
    const now = Date.now();

    // Check if a notification with the same content already exists in current list
    const existsInList = currentNotifications.some(n =>
      n.type === notification.type &&
      n.title === notification.title &&
      n.message === notification.message
    );

    // Check if same notification was shown recently (within threshold)
    const recentTimestamp = this.recentNotifications.get(notificationKey);
    const isRecentDuplicate = recentTimestamp && (now - recentTimestamp) < this.DUPLICATE_THRESHOLD;

    // Only add if it's not a duplicate (neither in list nor recent)
    if (!existsInList && !isRecentDuplicate) {
      // Update recent notifications map
      this.recentNotifications.set(notificationKey, now);

      // Clean up old entries from map (older than threshold)
      this.cleanupRecentNotifications(now);

      // Add notification
      this.notificationsSubject.next([...currentNotifications, notification]);

      // Auto remove notification after duration
      if (notification.duration) {
        setTimeout(() => {
          this.removeNotification(notification.id);
        }, notification.duration);
      }
    }
  }

  /**
   * Clean up old entries from recent notifications map
   */
  private cleanupRecentNotifications(now: number): void {
    for (const [key, timestamp] of this.recentNotifications.entries()) {
      if (now - timestamp >= this.DUPLICATE_THRESHOLD) {
        this.recentNotifications.delete(key);
      }
    }
  }

  /**
   * Remove notification by ID
   */
  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
