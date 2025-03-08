import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Define an interface for cart items
export interface CartItem {
  name: string;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = []; // Store cart items
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]); // Observable to share cart data
  private cart: any[] = [];

  constructor() {}
  addProductToCart(product: any) {
    this.cart.push(product);
    console.log('السلة تحتوي الآن على:', this.cart);
  }
  getCartItemss() {
    return this.cart;
  }
  // Add item to cart
  addToCart(item: CartItem) {
    this.cartItems.push(item); // Add the new item to the cart
    this.cartItemsSubject.next(this.cartItems); // Update the observable with the new cart items
  }

  // Get the cart items as an observable
  getCartItems() {
    return this.cartItemsSubject.asObservable(); // Subscribers will get updates
  }
  
}
