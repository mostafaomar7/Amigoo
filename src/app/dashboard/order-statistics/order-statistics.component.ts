import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-order-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-statistics.component.html',
  // styleUrls: ['./order-statistics.component.css']
})
export class OrderStatisticsComponent implements OnChanges {
  @Input() orderStats: OrderStats | null = null;
  @Input() isLoading: boolean = false;

  displayStats: OrderStats | 'loading' | null = 'loading';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isLoading'] || changes['orderStats']) {
      if (this.isLoading) {
        this.displayStats = 'loading';
      } else if (this.orderStats) {
        this.displayStats = this.orderStats;
      } else {
        this.displayStats = null;
      }
    }
  }

  /**
   * Format currency value
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
