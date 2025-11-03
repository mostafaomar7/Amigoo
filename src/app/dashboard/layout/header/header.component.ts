import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  @Input() pendingOrders = 0;
  @Input() unreadMessages = 0;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  searchTerm = new FormControl('');
  showProfileMenu = false;
  showSearchCollapse = false;
  currentUser: User | null = null;
  private searchSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Get current user
    this.currentUser = this.authService.getCurrentUser();

    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit(): void {
    // Debounce search input
    this.searchSubscription = this.searchTerm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(term => {
        this.search.emit(term || '');
      });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  toggleSearchCollapse(): void {
    this.showSearchCollapse = !this.showSearchCollapse;
  }

  onLogout(): void {
    this.authService.logout();
  }

  getTotalNotifications(): number {
    return this.pendingOrders + this.unreadMessages;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-section')) {
      this.showProfileMenu = false;
    }
    if (!target.closest('.search-section')) {
      this.showSearchCollapse = false;
    }
  }
}
