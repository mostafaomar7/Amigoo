import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, PaginationParams } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { EnvironmentService } from '../../services/environment.service';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
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
  selectedCategory: Category | null = null;
  categoryForm: FormGroup;
  editCategoryForm: FormGroup;
  selectedImage: File | null = null;
  selectedEditImage: File | null = null;
  private searchTimeout: any = null;
  isAddingCategory = false;
  isUpdatingCategory = false;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private environmentService: EnvironmentService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
    this.editCategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    // Clear search timeout on component destroy
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  loadCategories(): void {
    this.isLoading = true;
    const params: PaginationParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: `${this.sortOrder === 'desc' ? '-' : ''}${this.sortBy}`,
      keyword: this.searchTerm || undefined
    };

    this.apiService.getPaginated<Category>('/categories', params).subscribe({
      next: (response) => {
        this.categories = response.data || [];

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
          const categoriesLength = this.categories.length;
          this.totalItems = categoriesLength;
          this.totalPages = categoriesLength > 0 ? Math.max(1, Math.ceil(categoriesLength / this.itemsPerPage)) : 0;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
        this.totalPages = 0;
        this.totalItems = 0;
        this.notificationService.error('خطأ', 'فشل في تحميل الأقسام');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCategories();
  }

  onSearchInput(): void {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search - wait 500ms after user stops typing
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadCategories();
    }, 500);
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.loadCategories();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCategories();
    }
  }

  showAddCategoryModal(): void {
    this.categoryForm.reset();
    this.selectedImage = null;
    this.showAddModal = true;
    document.body.classList.add('modal-open');
  }

  showEditCategoryModal(category: Category): void {
    this.selectedCategory = category;
    this.editCategoryForm.patchValue({
      name: category.name
    });
    this.selectedEditImage = null;
    this.showEditModal = true;
    document.body.classList.add('modal-open');
  }

  showDeleteCategoryModal(category: Category): void {
    this.selectedCategory = category;
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  addCategory(): void {
    if (this.categoryForm.valid && this.selectedImage) {
      this.isAddingCategory = true;
      const formData = new FormData();
      formData.append('name', this.categoryForm.value.name);
      formData.append('image', this.selectedImage);

      this.apiService.postFormData<Category>('/categories', formData).subscribe({
        next: (response) => {
          this.notificationService.success('نجاح', 'تمت إضافة القسم بنجاح');
          this.closeModals();
          this.loadCategories();
          this.isAddingCategory = false;
        },
        error: (error) => {
          console.error('Error adding category:', error);
          this.notificationService.error('خطأ', error.error?.message || 'فشل في إضافة القسم');
          this.isAddingCategory = false;
        }
      });
    }
  }

  updateCategory(): void {
    if (this.editCategoryForm.valid && this.selectedCategory) {
      this.isUpdatingCategory = true;
      const formData = new FormData();
      formData.append('name', this.editCategoryForm.value.name);
      if (this.selectedEditImage) {
        formData.append('image', this.selectedEditImage);
      }

      this.apiService.putFormData<Category>('/categories', this.selectedCategory._id, formData).subscribe({
        next: (response) => {
          this.notificationService.success('نجاح', 'تم تحديث القسم بنجاح');
          this.closeModals();
          this.loadCategories();
          this.isUpdatingCategory = false;
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.notificationService.error('خطأ', error.error?.message || 'فشل في تحديث القسم');
          this.isUpdatingCategory = false;
        }
      });
    }
  }

  deleteCategory(): void {
    if (this.selectedCategory) {
      this.apiService.delete('/categories', this.selectedCategory._id).subscribe({
        next: (response) => {
          this.notificationService.success('نجاح', 'تم حذف القسم بنجاح');
          this.closeModals();
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.notificationService.error('خطأ', error.error?.message || 'فشل في حذف القسم');
        }
      });
    }
  }

  onImageSelected(event: any, isEdit = false): void {
    const file = event.target.files[0];
    if (file) {
      if (isEdit) {
        this.selectedEditImage = file;
      } else {
        this.selectedImage = file;
      }
    }
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedCategory = null;
    this.selectedImage = null;
    this.selectedEditImage = null;
    document.body.classList.remove('modal-open');
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${this.environmentService.imageBaseUrl}uploads/category/${imagePath}`;
  }

  getImagePreview(file: File): string {
    if (file) {
      return URL.createObjectURL(file);
    }
    return '';
  }

  get filteredCategories(): Category[] {
    return this.categories;
  }

  /**
   * Get array of page numbers for pagination
   */
  get pageNumbers(): number[] {
    if (!this.totalPages || this.totalPages <= 0) {
      return [];
    }
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /**
   * Get form field error message
   */
  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} مطلوب`;
      }
      if (control.errors?.['minlength']) {
        const minLength = control.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} يجب أن يكون على الأقل ${minLength} أحرف`;
      }
    }
    return '';
  }

  /**
   * Check if field has error
   */
  hasFieldError(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'اسم القسم'
    };
    return labels[fieldName] || fieldName;
  }
}
