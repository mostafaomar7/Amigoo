import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PaginationParams } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

export interface ContactForm {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  isReplied: boolean;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-contact-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-forms.component.html',
  styleUrls: ['./contact-forms.component.css']
})
export class ContactFormsComponent implements OnInit, OnDestroy {
  contactForms: ContactForm[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  isLoading = false;
  showViewModal = false;
  selectedForm: ContactForm | null = null;
  filterReplied: string = '';
  private searchTimeout: any = null;

  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadContactForms();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  loadContactForms(): void {
    this.isLoading = true;
    const params: PaginationParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: `${this.sortOrder === 'desc' ? '-' : ''}${this.sortBy}`,
      keyword: this.searchTerm || undefined
    };

    this.apiService.getPaginated<ContactForm>('/submit', params).subscribe({
      next: (response) => {
        let forms = response.data || [];
        if (this.filterReplied === 'replied') {
          forms = forms.filter(form => form.isReplied);
        } else if (this.filterReplied === 'unreplied') {
          forms = forms.filter(form => !form.isReplied);
        }
        this.contactForms = forms;

        if (response.pagination) {
          this.totalItems = response.pagination.totalItems || 0;
          this.totalPages = response.pagination.totalPages || 0;
          if (response.pagination.itemsPerPage) {
            this.itemsPerPage = response.pagination.itemsPerPage;
          }
        } else {
          const formsLength = this.contactForms.length;
          this.totalItems = formsLength;
          this.totalPages = formsLength > 0 ? Math.max(1, Math.ceil(formsLength / this.itemsPerPage)) : 0;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading contact forms:', error);
        this.isLoading = false;
        this.totalPages = 0;
        this.totalItems = 0;
        this.notificationService.error('Error', 'Failed to load contact messages');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadContactForms();
  }

  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadContactForms();
    }, 500);
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.loadContactForms();
  }

  onFilter(): void {
    this.currentPage = 1;
    this.loadContactForms();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadContactForms();
    }
  }

  showViewMessageModal(form: ContactForm): void {
    this.selectedForm = form;
    this.showViewModal = true;
    document.body.classList.add('modal-open');
  }

  closeModals(): void {
    this.showViewModal = false;
    this.selectedForm = null;
    document.body.classList.remove('modal-open');
  }

  getMessagePreview(message: string, maxLength: number = 50): string {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }

  get filteredContactForms(): ContactForm[] {
    return this.contactForms;
  }

  get pageNumbers(): number[] {
    if (!this.totalPages || this.totalPages <= 0) {
      return [];
    }
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
