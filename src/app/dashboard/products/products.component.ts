import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, PaginationParams } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { EnvironmentService } from '../../services/environment.service';

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  priceAfterDiscount?: number;
  sold: number;
  colors?: string[];
  imageCover: string;
  images?: string[];
  category: {
    _id: string;
    name: string;
  };
  quantity?: Array<{
    size: string;
    no: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface MasterSize {
  _id: string;
  sizeName: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  masterSizes: MasterSize[] = [];
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
  showDetailsModal = false;
  showAddSizeModal = false;
  selectedProduct: Product | null = null;
  productForm: FormGroup;
  editProductForm: FormGroup;
  selectedCoverImage: File | null = null;
  selectedImages: File[] = [];
  selectedEditCoverImage: File | null = null;
  selectedEditImages: File[] = [];
  productColors: string[] = [];
  editProductColors: string[] = [];
  newColor = '';
  editNewColor = '';
  productQuantity: Array<{ size: string; no: number }> = [];
  editProductQuantity: Array<{ size: string; no: number }> = [];
  sizeForm: FormGroup;
  selectedSizeToAdd = '';
  selectedEditSizeToAdd = '';
  currentImageIndex = 0;
  private searchTimeout: any = null;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private environmentService: EnvironmentService,
    private fb: FormBuilder
  ) {
    this.productForm = this.createProductForm();
    this.editProductForm = this.createProductForm();
    this.sizeForm = this.fb.group({
      sizeName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(10)]]
    });

    // Auto-lowercase size name
    this.sizeForm.get('sizeName')?.valueChanges.subscribe(value => {
      if (value) {
        this.sizeForm.get('sizeName')?.setValue(value.toLowerCase(), { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadMasterSizes();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  private createProductForm(): FormGroup {
    const form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      priceAfterDiscount: ['', [Validators.min(0)]],
      category: ['', [Validators.required]]
    });

    // Add custom validator for discount price
    form.get('priceAfterDiscount')?.valueChanges.subscribe(() => {
      this.validateDiscountPrice(form);
    });
    form.get('price')?.valueChanges.subscribe(() => {
      this.validateDiscountPrice(form);
    });

    return form;
  }

  private validateDiscountPrice(form: FormGroup): void {
    const price = form.get('price')?.value;
    const discountPrice = form.get('priceAfterDiscount')?.value;

    if (discountPrice && price && discountPrice >= price) {
      form.get('priceAfterDiscount')?.setErrors({ discountGreaterThanPrice: true });
    } else if (form.get('priceAfterDiscount')?.hasError('discountGreaterThanPrice')) {
      const errors = { ...form.get('priceAfterDiscount')?.errors };
      delete errors['discountGreaterThanPrice'];
      form.get('priceAfterDiscount')?.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  loadProducts(): void {
    this.isLoading = true;
    const params: PaginationParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: `${this.sortOrder === 'desc' ? '-' : ''}${this.sortBy}`,
      keyword: this.searchTerm || undefined
    };

    this.apiService.getPaginated<Product>('/product', params).subscribe({
      next: (response) => {
        this.products = response.data || [];

        if (response.pagination) {
          this.totalItems = response.pagination.totalItems || 0;
          this.totalPages = response.pagination.totalPages || 0;
          if (response.pagination.itemsPerPage) {
            this.itemsPerPage = response.pagination.itemsPerPage;
          }
        } else {
          const productsLength = this.products.length;
          this.totalItems = productsLength;
          this.totalPages = productsLength > 0 ? Math.max(1, Math.ceil(productsLength / this.itemsPerPage)) : 0;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
        this.totalPages = 0;
        this.totalItems = 0;
        this.notificationService.error('خطأ', 'فشل في تحميل المنتجات');
      }
    });
  }

  loadCategories(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.categories.length > 0) {
        resolve();
        return;
      }

      this.apiService.getPaginated<Category>('/categories', { limit: 100 }).subscribe({
        next: (response) => {
          this.categories = response.data || [];
          resolve();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          reject(error);
        }
      });
    });
  }

  loadMasterSizes(): void {
    this.apiService.getSingle<any>('/sizes/master').subscribe({
      next: (response: any) => {
        this.masterSizes = (response.data || response) || [];
      },
      error: (error) => {
        console.error('Error loading master sizes:', error);
      }
    });
  }

  loadProductDetails(productId: string): void {
    this.apiService.getById<Product>('/product', productId).subscribe({
      next: (response: any) => {
        this.selectedProduct = response.data;
        this.showDetailsModal = true;
        document.body.classList.add('modal-open');
      },
      error: (error) => {
        console.error('Error loading product details:', error);
        this.notificationService.error('خطأ', 'فشل في تحميل تفاصيل المنتج');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadProducts();
    }, 500);
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  showAddProductModal(): void {
    this.productForm.reset();
    this.productColors = [];
    this.productQuantity = [];
    this.selectedCoverImage = null;
    this.selectedImages = [];
    this.selectedSizeToAdd = '';
    this.showAddModal = true;
    document.body.classList.add('modal-open');
  }

  async showEditProductModal(product: Product): Promise<void> {
    this.selectedProduct = product;

    // Helper function to extract category ID - handles both _id and name matching
    const getCategoryId = (category: any): string => {
      if (!category) return '';
      if (typeof category === 'string') return category;
      if (category._id) return category._id;
      if (category.id) return category.id;
      // If category only has name, try to find it in categories list by name
      if (category.name && this.categories.length > 0) {
        const foundCategory = this.categories.find(cat => cat.name === category.name);
        if (foundCategory) {
          return foundCategory._id;
        }
      }
      return '';
    };

    // Helper function to populate form data
    const populateFormData = (productData: Product) => {
      const categoryId = getCategoryId(productData.category);

      // Load colors
      this.editProductColors = productData.colors ? [...productData.colors] : [];

      // Load quantity - ensure proper format
      this.editProductQuantity = productData.quantity
        ? JSON.parse(JSON.stringify(productData.quantity))
        : [];

      // Reset image selections (user can choose to update)
      this.selectedEditCoverImage = null;
      this.selectedEditImages = [];
      this.selectedEditSizeToAdd = '';

      // Populate form with product data - set category after ensuring categories are loaded
      this.editProductForm.patchValue({
        title: productData.title || '',
        description: productData.description || '',
        price: productData.price || '',
        priceAfterDiscount: productData.priceAfterDiscount || '',
        category: categoryId || ''
      });

      // Reset form state to show fresh validation on user interaction
      this.editProductForm.markAsUntouched();
      this.editProductForm.markAsPristine();

      // Set category value after Angular renders the dropdown
      if (categoryId) {
        // Use setTimeout to ensure dropdown is rendered
        setTimeout(() => {
          const categoryControl = this.editProductForm.get('category');
          if (categoryControl) {
            // Verify the category exists in the list (by _id or by name as fallback)
            const categoryExists = this.categories.some(cat => cat._id === categoryId);
            if (categoryExists) {
              categoryControl.setValue(categoryId, { emitEvent: false });
            } else {
              // Fallback: try to find by name if ID matching fails
              const productCategory = productData.category;
              if (productCategory && typeof productCategory === 'object' && productCategory.name) {
                const foundCategory = this.categories.find(cat => cat.name === productCategory.name);
                if (foundCategory) {
                  categoryControl.setValue(foundCategory._id, { emitEvent: false });
                } else {
                  console.warn('Category not found in categories list:', productCategory.name);
                }
              } else {
                console.warn('Category ID not found in categories list:', categoryId);
              }
            }
          }
        }, 0);
      } else {
        // If no category ID found, try to find by name
        const productCategory = productData.category;
        if (productCategory && typeof productCategory === 'object' && productCategory.name) {
          setTimeout(() => {
            const categoryControl = this.editProductForm.get('category');
            if (categoryControl) {
              const foundCategory = this.categories.find(cat => cat.name === productCategory.name);
              if (foundCategory) {
                categoryControl.setValue(foundCategory._id, { emitEvent: false });
              }
            }
          }, 0);
        }
      }
    };

    try {
      // Ensure categories are loaded first
      await this.loadCategories();

      // Now fetch product details
      this.apiService.getById<Product>('/product', product._id).subscribe({
        next: (response: any) => {
          const fullProduct = response.data || product;
          this.selectedProduct = fullProduct;
          populateFormData(fullProduct);
          this.showEditModal = true;
          document.body.classList.add('modal-open');
        },
        error: (error) => {
          console.error('Error loading product details:', error);
          populateFormData(product);
          this.showEditModal = true;
          document.body.classList.add('modal-open');
          this.notificationService.error('تحذير', 'تعذر تحميل تفاصيل المنتج الكاملة. قد تكون بعض البيانات غير مكتملة.');
        }
      });
    } catch (error) {
      // If categories fail to load, still try to populate with product data
      console.error('Error loading categories:', error);
      populateFormData(product);
      this.showEditModal = true;
      document.body.classList.add('modal-open');

      // Also try to load product
      this.apiService.getById<Product>('/product', product._id).subscribe({
        next: (response: any) => {
          const fullProduct = response.data || product;
          this.selectedProduct = fullProduct;
          populateFormData(fullProduct);
        },
        error: (err) => {
          console.error('Error loading product details:', err);
        }
      });
    }
  }

  showEditFromDetails(): void {
    if (this.selectedProduct) {
      this.closeModals();
      this.showEditProductModal(this.selectedProduct);
    }
  }

  showDeleteProductModal(product: Product): void {
    this.selectedProduct = product;
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  showDetailsProductModal(product: Product): void {
    this.selectedProduct = product;
    this.currentImageIndex = 0;
    this.loadProductDetails(product._id);
  }

  addProduct(): void {
    if (this.productForm.valid && this.selectedCoverImage) {
      // Validate that at least one size is required
      if (this.productQuantity.length === 0) {
        this.notificationService.error(
          'Validation Error',
          'At least one size with quantity is required for the product.'
        );
        return;
      }

      // Validate sizes exist in master sizes
      if (this.productQuantity.length > 0) {
        const invalidSizes = this.productQuantity.filter(qty => {
          const sizeName = qty.size.toLowerCase().trim();
          return !this.masterSizes.some(ms => ms.sizeName.toLowerCase() === sizeName);
        });

        if (invalidSizes.length > 0) {
          this.notificationService.error(
            'Validation Error',
            `The following sizes do not exist: ${invalidSizes.map(s => s.size.toUpperCase()).join(', ')}. Please create them first in Master Sizes.`
          );
          return;
        }
      }

      const formData = new FormData();
      formData.append('title', this.productForm.value.title);
      formData.append('description', this.productForm.value.description);
      formData.append('price', this.productForm.value.price.toString());
      if (this.productForm.value.priceAfterDiscount && this.productForm.value.priceAfterDiscount > 0) {
        formData.append('priceAfterDiscount', this.productForm.value.priceAfterDiscount.toString());
      }
      formData.append('category', this.productForm.value.category);
      formData.append('imageCover', this.selectedCoverImage);

      this.productColors.forEach(color => formData.append('colors', color));
      this.selectedImages.forEach(image => formData.append('images', image));

      // Add quantity array - send as JSON string (per API_DOCUMENTATION.md)
      if (this.productQuantity.length > 0) {
        // Ensure all sizes are lowercase and valid
        const validQuantity = this.productQuantity.map(qty => ({
          size: qty.size.toLowerCase().trim(),
          no: Number(qty.no) || 0
        })).filter(qty => qty.size && qty.no >= 0);

        if (validQuantity.length > 0) {
          // Send as JSON string exactly as documented in API_DOCUMENTATION.md (line 542)
          formData.append('quantity', JSON.stringify(validQuantity));
        }
      }

      this.apiService.postFormData<Product>('/product', formData).subscribe({
        next: (response) => {
          this.notificationService.success('نجاح', 'تمت إضافة المنتج بنجاح');
          this.closeModals();
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error adding product:', error);
          let errorMessage = 'فشل في إضافة المنتج';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors && Array.isArray(error.error.errors)) {
            errorMessage = error.error.errors.map((e: any) => e.msg).join('. ');
          }
          this.notificationService.error('Error', errorMessage);
        }
      });
    }
  }

  updateProduct(): void {
    if (this.editProductForm.valid && this.selectedProduct) {
      // Validate that at least one size is required
      if (this.editProductQuantity.length === 0) {
        this.notificationService.error(
          'Validation Error',
          'At least one size with quantity is required for the product.'
        );
        return;
      }

      // Validate sizes exist in master sizes
      if (this.editProductQuantity.length > 0) {
        const invalidSizes = this.editProductQuantity.filter(qty => {
          const sizeName = qty.size.toLowerCase().trim();
          return !this.masterSizes.some(ms => ms.sizeName.toLowerCase() === sizeName);
        });

        if (invalidSizes.length > 0) {
          this.notificationService.error(
            'Validation Error',
            `The following sizes do not exist: ${invalidSizes.map(s => s.size.toUpperCase()).join(', ')}. Please create them first in Master Sizes.`
          );
          return;
        }
      }

      const formData = new FormData();
      formData.append('title', this.editProductForm.value.title);
      formData.append('description', this.editProductForm.value.description);
      formData.append('price', this.editProductForm.value.price.toString());
      if (this.editProductForm.value.priceAfterDiscount && this.editProductForm.value.priceAfterDiscount > 0) {
        formData.append('priceAfterDiscount', this.editProductForm.value.priceAfterDiscount.toString());
      }
      formData.append('category', this.editProductForm.value.category);

      if (this.selectedEditCoverImage) {
        formData.append('imageCover', this.selectedEditCoverImage);
      }

      this.editProductColors.forEach(color => formData.append('colors', color));
      this.selectedEditImages.forEach(image => formData.append('images', image));

      // Add quantity array - send as JSON string (per API_DOCUMENTATION.md)
      if (this.editProductQuantity.length > 0) {
        // Ensure all sizes are lowercase and valid
        const validQuantity = this.editProductQuantity.map(qty => ({
          size: qty.size.toLowerCase().trim(),
          no: Number(qty.no) || 0
        })).filter(qty => qty.size && qty.no >= 0);

        if (validQuantity.length > 0) {
          // Send as JSON string exactly as documented in API_DOCUMENTATION.md (line 624)
          formData.append('quantity', JSON.stringify(validQuantity));
        }
      }

      this.apiService.putFormData<Product>('/product', this.selectedProduct._id, formData).subscribe({
        next: (response) => {
          this.notificationService.success('نجاح', 'تم تحديث المنتج بنجاح');
          this.closeModals();
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error updating product:', error);
          let errorMessage = 'فشل في تحديث المنتج';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors && Array.isArray(error.error.errors)) {
            errorMessage = error.error.errors.map((e: any) => e.msg).join('. ');
          }
          this.notificationService.error('Error', errorMessage);
        }
      });
    }
  }

  deleteProduct(): void {
    if (this.selectedProduct) {
      this.apiService.delete('/product', this.selectedProduct._id).subscribe({
        next: (response) => {
          this.notificationService.success('نجاح', 'تم حذف المنتج بنجاح');
          this.closeModals();
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.notificationService.error('خطأ', error.error?.message || 'فشل في حذف المنتج');
        }
      });
    }
  }

  addSize(): void {
    if (this.sizeForm.valid) {
      const formData = {
        sizeName: this.sizeForm.value.sizeName.toLowerCase()
      };

      this.apiService.post<MasterSize>('/sizes', formData).subscribe({
        next: (response: any) => {
          this.notificationService.success('نجاح', 'تمت إضافة المقاس بنجاح');
          this.closeModals();
          this.loadMasterSizes();
          // Reload product details if open
          if (this.selectedProduct) {
            this.loadProductDetails(this.selectedProduct._id);
          }
        },
        error: (error) => {
          console.error('Error adding size:', error);
          this.notificationService.error('خطأ', error.error?.message || 'فشل في إضافة المقاس');
        }
      });
    }
  }

  onCoverImageSelected(event: any, isEdit = false): void {
    const file = event.target.files[0];
    if (file) {
      if (isEdit) {
        this.selectedEditCoverImage = file;
      } else {
        this.selectedCoverImage = file;
      }
    }
  }

  onImagesSelected(event: any, isEdit = false): void {
    const files = Array.from(event.target.files) as File[];
    if (files && files.length > 0) {
      // Limit to 5 images total
      const existingImages = isEdit ? this.selectedEditImages : this.selectedImages;
      const totalCount = existingImages.length + files.length;

      if (totalCount > 5) {
        this.notificationService.error('تحذير', `يمكنك إضافة ${5 - existingImages.length} صورة فقط. الحد الأقصى 5 صور.`);
        return;
      }

      // Append new files to existing ones
      if (isEdit) {
        this.selectedEditImages = [...this.selectedEditImages, ...files];
      } else {
        this.selectedImages = [...this.selectedImages, ...files];
      }

      // Reset the input to allow selecting the same files again if needed
      event.target.value = '';
    }
  }

  removeImage(index: number, isEdit = false): void {
    if (isEdit) {
      this.selectedEditImages.splice(index, 1);
    } else {
      this.selectedImages.splice(index, 1);
    }
  }

  addColor(isEdit = false): void {
    const color = isEdit ? this.editNewColor : this.newColor;
    if (color) {
      if (isEdit) {
        if (!this.editProductColors.includes(color)) {
          this.editProductColors.push(color);
          this.editNewColor = '';
        }
      } else {
        if (!this.productColors.includes(color)) {
          this.productColors.push(color);
          this.newColor = '';
        }
      }
    }
  }

  removeColor(color: string, isEdit = false): void {
    if (isEdit) {
      this.editProductColors = this.editProductColors.filter(c => c !== color);
    } else {
      this.productColors = this.productColors.filter(c => c !== color);
    }
  }

  addSizeToQuantity(selectedSizeId: string | null = null, isEdit = false): void {
    const quantityArray = isEdit ? this.editProductQuantity : this.productQuantity;

    let sizeToAdd: MasterSize | undefined;

    if (selectedSizeId) {
      // Add specific size
      sizeToAdd = this.masterSizes.find(size => size._id === selectedSizeId);
      if (sizeToAdd && quantityArray.some(q => q.size.toLowerCase() === sizeToAdd!.sizeName.toLowerCase())) {
        this.notificationService.error('خطأ', 'هذا المقاس مضاف بالفعل');
        return;
      }
    } else {
      // Add first available size
      sizeToAdd = this.masterSizes.find(size =>
        !quantityArray.some(q => q.size.toLowerCase() === size.sizeName.toLowerCase())
      );
    }

    if (sizeToAdd) {
      quantityArray.push({
        size: sizeToAdd.sizeName,
        no: 0
      });
    } else {
      this.notificationService.error('معلومات', 'لا توجد مقاسات متاحة للإضافة');
    }
  }

  getAvailableSizesForQuantity(isEdit = false): MasterSize[] {
    const quantityArray = isEdit ? this.editProductQuantity : this.productQuantity;
    return this.masterSizes.filter(size =>
      !quantityArray.some(q => q.size.toLowerCase() === size.sizeName.toLowerCase())
    );
  }

  removeSizeFromQuantity(index: number, isEdit = false): void {
    if (isEdit) {
      this.editProductQuantity.splice(index, 1);
    } else {
      this.productQuantity.splice(index, 1);
    }
  }

  updateQuantityValue(index: number, value: number, isEdit = false): void {
    const quantityArray = isEdit ? this.editProductQuantity : this.productQuantity;
    if (quantityArray[index]) {
      quantityArray[index].no = Math.max(0, value);
    }
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showDetailsModal = false;
    this.showAddSizeModal = false;
    this.selectedProduct = null;
    this.currentImageIndex = 0;
    document.body.classList.remove('modal-open');
  }

  showAddSizeFromDetailsModal(): void {
    this.sizeForm.reset();
    this.showAddSizeModal = true;
    document.body.classList.add('modal-open');
  }

  nextImage(): void {
    if (this.selectedProduct && this.selectedProduct.images && this.selectedProduct.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % (this.selectedProduct.images.length + 1);
    }
  }

  prevImage(): void {
    if (this.selectedProduct && this.selectedProduct.images && this.selectedProduct.images.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0
        ? this.selectedProduct.images.length
        : this.currentImageIndex - 1;
    }
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${this.environmentService.imageBaseUrl}uploads/products/${imagePath}`;
  }

  getImagePreview(file: File): string {
    if (file) {
      return URL.createObjectURL(file);
    }
    return '';
  }

  getCurrentImage(): string {
    if (!this.selectedProduct) return '';
    if (this.currentImageIndex === 0) {
      return this.getImageUrl(this.selectedProduct.imageCover);
    }
    if (this.selectedProduct.images && this.selectedProduct.images[this.currentImageIndex - 1]) {
      return this.getImageUrl(this.selectedProduct.images[this.currentImageIndex - 1]);
    }
    return this.getImageUrl(this.selectedProduct.imageCover);
  }

  getSizeStatus(quantity: number): string {
    if (quantity === 0) {
      return 'Out of Stock';
    } else if (quantity >= 1 && quantity <= 3) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  }

  getSizeStatusClass(quantity: number): string {
    if (quantity === 0) {
      return 'bg-danger';
    } else if (quantity >= 1 && quantity <= 3) {
      return 'bg-warning';
    } else {
      return 'bg-success';
    }
  }

  get filteredProducts(): Product[] {
    return this.products;
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
        return `${this.getFieldLabel(fieldName)} مطلوب`;
      }
      if (control.errors?.['minlength']) {
        const minLength = control.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} يجب أن يكون على الأقل ${minLength} أحرف`;
      }
      if (control.errors?.['min']) {
        const min = control.errors['min'].min;
        return `${this.getFieldLabel(fieldName)} يجب أن يكون على الأقل ${min}`;
      }
      if (control.errors?.['discountGreaterThanPrice']) {
        return 'سعر الخصم يجب أن يكون أقل من السعر العادي';
      }
    }
    return '';
  }

  hasFieldError(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getSelectedCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'العنوان',
      description: 'الوصف',
      price: 'السعر',
      priceAfterDiscount: 'السعر بعد الخصم',
      category: 'القسم',
      sizeName: 'اسم المقاس'
    };
    return labels[fieldName] || fieldName;
  }
}
