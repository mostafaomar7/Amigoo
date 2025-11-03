import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, PaginationParams } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

export interface MasterSize {
  _id: string;
  sizeName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-master-sizes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './master-sizes.component.html',
  styleUrls: ['./master-sizes.component.css']
})
export class MasterSizesComponent implements OnInit, OnDestroy {
  sizes: MasterSize[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  isLoading = false;
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedSize: MasterSize | null = null;
  sizeForm: FormGroup;
  editSizeForm: FormGroup;
  private searchTimeout: any = null;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.sizeForm = this.fb.group({
      sizeName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(10)]]
    });

    this.editSizeForm = this.fb.group({
      sizeName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(10)]]
    });

    // Auto-lowercase size name on input
    this.sizeForm.get('sizeName')?.valueChanges.subscribe(value => {
      if (value) {
        this.sizeForm.get('sizeName')?.setValue(value.toLowerCase(), { emitEvent: false });
      }
    });

    this.editSizeForm.get('sizeName')?.valueChanges.subscribe(value => {
      if (value) {
        this.editSizeForm.get('sizeName')?.setValue(value.toLowerCase(), { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    // Check admin access on init
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadSizes();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  loadSizes(): void {
    this.isLoading = true;
    const params: PaginationParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: `${this.sortOrder === 'desc' ? '-' : ''}${this.sortBy}`,
      keyword: this.searchTerm || undefined
    };

    this.apiService.getPaginated<MasterSize>('/sizes', params).subscribe({
      next: (response) => {
        this.sizes = response.data || [];

        // Use unified pagination format from API
        if (response.pagination) {
          this.totalItems = response.pagination.totalItems || 0;
          this.totalPages = response.pagination.totalPages || 0;
          // Update itemsPerPage if API returns different value
          if (response.pagination.itemsPerPage) {
            this.itemsPerPage = response.pagination.itemsPerPage;
          }
        } else {
          // Fallback if pagination is missing
          const sizesLength = this.sizes.length;
          this.totalItems = sizesLength;
          this.totalPages = sizesLength > 0 ? Math.max(1, Math.ceil(sizesLength / this.itemsPerPage)) : 0;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sizes:', error);
        this.isLoading = false;
        this.totalPages = 0;
        this.totalItems = 0;
        this.notificationService.error('Error', 'Failed to load sizes');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadSizes();
  }

  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadSizes();
    }, 500);
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.loadSizes();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSizes();
    }
  }

  showAddSizeModal(): void {
    this.sizeForm.reset({
      sizeName: ''
    });
    this.showAddModal = true;
    document.body.classList.add('modal-open');
  }

  showEditSizeModal(size: MasterSize): void {
    this.selectedSize = size;
    this.editSizeForm.patchValue({
      sizeName: size.sizeName
    });
    this.showEditModal = true;
    document.body.classList.add('modal-open');
  }

  showDeleteSizeModal(size: MasterSize): void {
    this.selectedSize = size;
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  addSize(): void {
    if (this.sizeForm.valid) {
      const formData = {
        sizeName: this.sizeForm.value.sizeName.toLowerCase()
      };

      this.apiService.post<MasterSize>('/sizes', formData).subscribe({
        next: (response) => {
          this.notificationService.success('Success', 'Size added successfully');
          this.closeModals();
          this.loadSizes();
        },
        error: (error) => {
          console.error('Error adding size:', error);
          this.notificationService.error('Error', error.error?.message || 'Failed to add size');
        }
      });
    }
  }

  updateSize(): void {
    if (this.editSizeForm.valid && this.selectedSize) {
      const formData = {
        sizeName: this.editSizeForm.value.sizeName.toLowerCase()
      };

      this.apiService.put<MasterSize>('/sizes', this.selectedSize._id, formData).subscribe({
        next: (response) => {
          this.notificationService.success('Success', 'Size updated successfully');
          this.closeModals();
          this.loadSizes();
        },
        error: (error) => {
          console.error('Error updating size:', error);
          this.notificationService.error('Error', error.error?.message || 'Failed to update size');
        }
      });
    }
  }

  toggleActive(size: MasterSize): void {
    const formData = {
      isActive: !size.isActive
    };

    this.apiService.put<MasterSize>('/sizes', size._id, formData).subscribe({
      next: (response) => {
        this.notificationService.success('Success', `Size ${formData.isActive ? 'activated' : 'deactivated'} successfully`);
        this.loadSizes();
      },
      error: (error) => {
        console.error('Error toggling size status:', error);
        this.notificationService.error('Error', error.error?.message || 'Failed to update size status');
        // Reload to revert UI state
        this.loadSizes();
      }
    });
  }

  deleteSize(): void {
    if (this.selectedSize) {
      this.apiService.delete('/sizes', this.selectedSize._id).subscribe({
        next: (response) => {
          this.notificationService.success('Success', 'Size deleted successfully');
          this.closeModals();
          this.loadSizes();
        },
        error: (error) => {
          console.error('Error deleting size:', error);
          this.notificationService.error('Error', error.error?.message || 'Failed to delete size');
        }
      });
    }
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedSize = null;
    document.body.classList.remove('modal-open');
  }

  get filteredSizes(): MasterSize[] {
    return this.sizes;
  }

  get pageNumbers(): number[] {
    if (!this.totalPages || this.totalPages <= 0) {
      return [];
    }
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors?.['minlength']) {
        const minLength = control.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
      }
      if (control.errors?.['maxlength']) {
        const maxLength = control.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at most ${maxLength} characters`;
      }
    }
    return '';
  }

  hasFieldError(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      sizeName: 'Size Name'
    };
    return labels[fieldName] || fieldName;
  }
}
