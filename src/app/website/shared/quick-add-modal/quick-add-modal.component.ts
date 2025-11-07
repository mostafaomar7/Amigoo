import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QuickAddModalService, QuickAddModalData } from '../../../services/quick-add-modal.service';
import { NotificationService } from '../../../services/notification.service';
import { EnvironmentService } from '../../../services/environment.service';

@Component({
  selector: 'app-quick-add-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-add-modal.component.html',
  styleUrls: ['./quick-add-modal.component.css']
})
export class QuickAddModalComponent implements OnInit, OnDestroy {
  showModal = false;
  product: any = null;
  selectedColor: string | null = null;
  selectedSize: string | null = null;
  quantity = 1;
  availableSizes: any[] = [];
  onConfirmCallback: ((color: string | null, size: string | null, qty: number) => void) | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private quickAddModalService: QuickAddModalService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private environmentService: EnvironmentService
  ) {}

  ngOnInit(): void {
    this.quickAddModalService.modal$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: QuickAddModalData | null) => {
        if (data) {
          this.openModal(data);
        } else {
          this.closeModal();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openModal(data: QuickAddModalData): void {
    if (!data || !data.product) {
      console.error('Invalid modal data');
      return;
    }

    this.product = data.product;
    this.onConfirmCallback = data.onConfirm;
    this.selectedColor = null;
    this.selectedSize = null;
    this.quantity = 1;
    this.availableSizes = [];

    // Initialize colors - select first if available
    if (this.product && this.product.colors && Array.isArray(this.product.colors) && this.product.colors.length > 0) {
      const firstColor = this.product.colors[0];
      this.selectedColor = typeof firstColor === 'string' ? firstColor : firstColor.name || firstColor;
    }

    // Initialize sizes
    if (this.product && this.product.quantity && Array.isArray(this.product.quantity)) {
      this.availableSizes = this.product.quantity.filter((q: any) => q && q.size && (q.no > 0 || q.quantity > 0));
      if (this.availableSizes.length > 0) {
        this.selectedSize = this.availableSizes[0].size;
      }
    } else if (this.product && this.product.sizes && Array.isArray(this.product.sizes)) {
      this.availableSizes = this.product.sizes.map((s: any) => ({
        size: typeof s === 'string' ? s : (s && (s.name || s.size || s))
      })).filter((s: any) => s.size);
      if (this.availableSizes.length > 0) {
        this.selectedSize = this.availableSizes[0].size;
      }
    }

    this.showModal = true;

    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.product = null;
    this.selectedColor = null;
    this.selectedSize = null;
    this.quantity = 1;
    this.availableSizes = [];
    this.onConfirmCallback = null;
    this.cdr.markForCheck();
  }

  /**
   * Get color name from color object or string
   */
  getColorName(color: any): string {
    return typeof color === 'string' ? color : color.name || color;
  }

  /**
   * Check if color is selected
   */
  isColorSelected(color: any): boolean {
    const colorName = this.getColorName(color);
    return this.selectedColor === colorName;
  }

  /**
   * Select color
   */
  selectColor(color: any): void {
    this.selectedColor = this.getColorName(color);
  }

  getColorValue(color: string): string {
    const colorMap: { [key: string]: string } = {
      'red': '#dc3545', 'green': '#28a745', 'blue': '#007bff', 'yellow': '#ffc107',
      'black': '#000000', 'white': '#ffffff', 'gray': '#6c757d', 'grey': '#6c757d',
      'orange': '#fd7e14', 'purple': '#6f42c1', 'pink': '#e83e8c', 'brown': '#795548',
      'navy': '#001f3f', 'teal': '#20c997', 'cyan': '#17a2b8', 'lime': '#32cd32',
      'indigo': '#6610f2', 'maroon': '#800000', 'olive': '#808000', 'silver': '#c0c0c0',
      'gold': '#ffd700', 'beige': '#f5f5dc', 'coral': '#ff7f50', 'salmon': '#fa8072',
      'turquoise': '#40e0d0', 'lavender': '#e6e6fa', 'mint': '#98fb98', 'burgundy': '#800020',
      'khaki': '#f0e68c', 'ivory': '#fffff0', 'cream': '#fffdd0', 'tan': '#d2b48c',
      'charcoal': '#36454f', 'violet': '#8a2be2', 'magenta': '#ff00ff',
      'أحمر': '#dc3545', 'أخضر': '#28a745', 'أزرق': '#007bff', 'أصفر': '#ffc107',
      'أسود': '#000000', 'أبيض': '#ffffff', 'رمادي': '#6c757d',
      'برتقالي': '#fd7e14', 'بنفسجي': '#6f42c1', 'وردي': '#e83e8c', 'بني': '#795548'
    };
    return colorMap[color.toLowerCase().trim()] || '#6c757d';
  }

  getSelectedSizeStock(): number {
    if (!this.selectedSize || !this.product || !this.product.quantity) return 0;
    const sizeData = this.product.quantity.find((q: any) => q.size === this.selectedSize);
    return sizeData ? (sizeData.no || sizeData.quantity || 0) : 0;
  }

  confirmAdd(): void {
    // Validate selections before adding
    if (this.product && this.product.colors && this.product.colors.length > 0 && !this.selectedColor) {
      this.notificationService.warning('اختر اللون', 'يرجى اختيار لون المنتج');
      return;
    }

    if (this.availableSizes.length > 0 && !this.selectedSize) {
      this.notificationService.warning('اختر المقاس', 'يرجى اختيار مقاس المنتج');
      return;
    }

    if (this.onConfirmCallback) {
      this.onConfirmCallback(this.selectedColor, this.selectedSize, this.quantity);
    }
    this.closeModal();
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    const maxQty = this.getSelectedSizeStock() || 999;
    if (this.quantity < maxQty) {
      this.quantity++;
    }
  }

  onQuantityBlur(): void {
    if (this.quantity < 1) {
      this.quantity = 1;
    }
    const maxQty = this.getSelectedSizeStock() || 999;
    if (this.quantity > maxQty) {
      this.quantity = maxQty;
    }
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  /**
   * Get image URL for product
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${imagePath}`;
  }
}
