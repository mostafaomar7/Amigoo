import { ApifunctionService } from '../../../services/apifunction.service';
import { CartService , CartItem } from '../../../services/cart.service';
import { Component, OnInit, OnDestroy , Input, Output , EventEmitter } from '@angular/core';
import { Router, RouterModule } from "@angular/router";
import { OpencartService } from '../../../services/opencart.service';
import {  ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoyFriendComponent } from '../../boy-friend/boy-friend.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BoyFriendComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() nav:any = {};
  @Output() itemnav = new EventEmitter();
  // DOM element references

  navbar: HTMLElement | null = null;
  searchForm: HTMLElement | null = null;
  cartItem: HTMLElement | null = null;
  starItem: HTMLElement | null = null;

  cartItems: CartItem[] = []; // Store the cart items
  alldata: any[] = [];
  allcatgory: any[] = [];
  allproduct: any[] = [];
  constructor(private openser:OpencartService, private cartService: CartService , private serv : ApifunctionService , private router : Router) {}

  @Output() categorySelected = new EventEmitter<string>();

  onCategoryChange(category: string) {
    this.categorySelected.emit(category);
    console.log(category);
  }
  cartproduct :any [] = [];
  starproduct :any [] = [];
  getstarproducts(){
    if("star" in localStorage){
    this.starproduct = JSON.parse(localStorage.getItem("star")!)
  }
  this.gettotalprice()
  }
  total:any = 0;
  getcartproducts(){
    if("cart" in localStorage){
    this.cartproduct = JSON.parse(localStorage.getItem("cart")!)
  }
  this.gettotalprice()
  }
  gettotalprice(){
    this.total = 0 ;
    for (let x in this.cartproduct){
      this.total += this.cartproduct[x].price *  this.cartproduct[x].quantity
    }
  }
  increase(index){
      this.cartproduct[index].quantity++;
      localStorage.setItem("cart" , JSON.stringify(this.cartproduct));
      this.gettotalprice();
  }
  decrease(index){
    if(this.cartproduct[index].quantity>1){
      this.cartproduct[index].quantity--;
    localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
    this.gettotalprice();
    }
  }
  detectedchange(){
    localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
    this.gettotalprice();
    localStorage.setItem("star" , JSON.stringify(this.starproduct))
  }
  delete(index){
    this.cartproduct.splice(index , 1)
    localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
    this.gettotalprice();
    this.starproduct.splice(index , 1)
    localStorage.setItem("star" , JSON.stringify(this.starproduct))
  }
  ClearAllProducts(){
    this.cartproduct.splice(0,this.cartproduct.length);
    localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
    this.gettotalprice();
  }
  getdata(){  //getallcategory
    this.serv.getcatgory().subscribe((data:any)=>{
      this.allcatgory = Object.values(data);  // تحويل الكائن إلى مصفوفة
    }, error=>{
      alert(error)
    })
  }
  getproductcatgory(id:any){
      this.serv.getproductybycatgory(id).subscribe((res:any)=>{
      this.alldata=res;
      this.alldata = Object.values(this.alldata)
      console.log(this.alldata);

    })
  }
  // filltercategory(event){
  //     let value = event.target.value ;
  //     this.getproductcatgory(value);
  // }
  goToParentPage() {
    this.router.navigate(['/cargo']);  // الانتقال إلى صفحة الـ cargo
  }

  ngOnInit(): void {
    this.cartItem = document.querySelector('.cart-items-container');
   console.log('Navbar Element:', this.navbar);
    // this.openser.cartToggle$.subscribe((toggle) => {
    //   if (toggle && this.cartItem) {
    //     this.cartItem.classList.add('active'); // فتح القائمة عند إضافة منتج
    //   }
    // });
    this.getdata();
    this.getcartproducts();
    this.getstarproducts();
    console.log(this.alldata);

    // Initialize the DOM elements
    this.navbar = document.querySelector('.navbar');
    this.searchForm = document.querySelector('.search-form');
    this.cartItem = document.querySelector('.cart-items-container');
    this.starItem = document.querySelector('.star-items-container');

    // Add event listeners to buttons


    // Handle window scroll
    window.addEventListener('scroll', this.closeAllMenus.bind(this));

    // Listen for storage changes (cross-tab updates)
    window.addEventListener('storage', this.onStorageChange.bind(this));

    // Listen for custom events (same-tab updates)
    document.addEventListener('cartUpdated', this.updateCartAndFavoritesCount.bind(this));
    document.addEventListener('favoritesUpdated', this.updateCartAndFavoritesCount.bind(this));

    this.cartService.getCartItems().subscribe((items) => {
      this.cartItems = items;
    });

    // Periodically update counts (as a fallback) - check every 2 seconds to reduce overhead
    setInterval(() => {
      this.updateCartAndFavoritesCount();
    }, 2000);
  }

  updateCartAndFavoritesCount(): void {
    this.getcartproducts();
    this.getstarproducts();
  }

  onStorageChange(event: StorageEvent): void {
    if (event.key === 'cart' || event.key === 'star') {
      this.updateCartAndFavoritesCount();
    }
  }

  ngOnDestroy(): void {
    // Clean up event listeners when the component is destroyed
    window.removeEventListener('scroll', this.closeAllMenus.bind(this));
    window.removeEventListener('storage', this.onStorageChange.bind(this));
    document.removeEventListener('cartUpdated', this.updateCartAndFavoritesCount.bind(this));
    document.removeEventListener('favoritesUpdated', this.updateCartAndFavoritesCount.bind(this));
  }

  toggleNavbar(): void {
    if (this.navbar) {
      this.navbar.classList.toggle('active');
    }
    this.closeOtherMenus(this.searchForm, this.cartItem, this.starItem);
  }

  toggleSearchForm(): void {
    if (this.searchForm) {
      this.searchForm.classList.toggle('active');
    }
    this.closeOtherMenus(this.navbar, this.cartItem, this.starItem);
  }

  toggleCartItem(): void {
    if (this.cartItem) {
      this.cartItem.classList.toggle('active');
    }
    this.closeOtherMenus(this.navbar, this.searchForm, this.starItem);
  }

  togglestarItem(): void {
    if (this.starItem) {
      this.starItem.classList.toggle('active');
    }
    this.closeOtherMenus(this.navbar, this.searchForm,this.cartItem);
  }

  closeOtherMenus(...elements: (HTMLElement | null)[]): void {
    elements.forEach(el => {
      if (el) el.classList.remove('active');
    });
  }

  closeAllMenus(): void {
    this.closeOtherMenus(this.navbar, this.searchForm, this.cartItem,this.starItem);
  }
}
