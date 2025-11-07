import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoryinfo } from '../../../models/category';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export type SortOption = 'latest' | 'highest_price' | 'lowest_price' | 'best_selling';

export interface SortOptionConfig {
  value: SortOption;
  label: string;
  sortParam: string;
}

@Component({
  selector: 'app-top-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './top-filter-bar.component.html',
  styleUrls: ['./top-filter-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopFilterBarComponent implements OnInit, OnDestroy {
  @Input() categories: Categoryinfo[] = [];
  @Input() selectedCategory: string | null = null;
  @Input() selectedSort: SortOption = 'latest';
  @Output() categoryChange = new EventEmitter<string | null>();
  @Output() sortChange = new EventEmitter<SortOption>();

  filterPanelOpen = false;

  sortOptions: SortOptionConfig[] = [
    { value: 'latest', label: 'الأحدث', sortParam: '-createdAt' },
    { value: 'highest_price', label: 'الأعلى سعرًا', sortParam: '-price' },
    { value: 'lowest_price', label: 'الأقل سعرًا', sortParam: 'price' },
    { value: 'best_selling', label: 'الأكثر مبيعًا', sortParam: '-sold' }
  ];

  private categoryChange$ = new Subject<string | null>();
  private sortChange$ = new Subject<SortOption>();
  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Debounce category changes
    this.categoryChange$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(category => {
      this.categoryChange.emit(category);
    });

    // Debounce sort changes
    this.sortChange$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(sort => {
      this.sortChange.emit(sort);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCategorySelect(categoryId: string | null): void {
    this.selectedCategory = categoryId;
    this.categoryChange$.next(categoryId);
    this.cdr.markForCheck();
  }

  onSortSelect(sort: SortOption): void {
    this.selectedSort = sort;
    this.sortChange$.next(sort);
    this.cdr.markForCheck();
  }

  getSelectedSortLabel(): string {
    const option = this.sortOptions.find(opt => opt.value === this.selectedSort);
    return option ? option.label : 'الأحدث';
  }

  getSelectedCategoryLabel(): string {
    if (!this.selectedCategory) return 'جميع الأقسام';
    const category = this.categories.find(cat => cat._id === this.selectedCategory);
    return category ? category.name : 'جميع الأقسام';
  }

  toggleFilterPanel(): void {
    this.filterPanelOpen = !this.filterPanelOpen;
    this.cdr.markForCheck();
  }

  closeFilterPanel(): void {
    this.filterPanelOpen = false;
    this.cdr.markForCheck();
  }
}
