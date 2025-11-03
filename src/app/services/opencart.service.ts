import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpencartService {

  cartproduct: any[] = [];
  private cartToggleSubject = new BehaviorSubject<boolean>(false);
  cartToggle$ = this.cartToggleSubject.asObservable();

  constructor() {
    this.loadCart();
    this.loadFavorites();
  }

  private loadCart() {
    if ("cart" in localStorage) {
      this.cartproduct = JSON.parse(localStorage.getItem("cart")!);
    }
  }

  addToCart(product: any) {
    let exist = this.cartproduct.find(item => item._id === product._id);
    if (exist) {
      alert("Your Product is Already in Cart");
    } else {
      this.cartproduct.push(product);
      localStorage.setItem("cart", JSON.stringify(this.cartproduct));

      console.log("Product added to cart:", product);
    }
  }

  toggleCart() {
    this.cartToggleSubject.next(true);  // جعل القائمة تفتح
  }
  private favoriteProducts: any[] = [];
  private favoritesToggleSubject = new BehaviorSubject<boolean>(false);
  favoritesToggle$ = this.favoritesToggleSubject.asObservable();



  private loadFavorites() {
    if ("star" in localStorage) {
      this.favoriteProducts = JSON.parse(localStorage.getItem("star")!);
    }
  }

  addToFavorites(product: any) {
    let exist = this.favoriteProducts.find(item => item._id === product._id);
    if (exist) {
      alert("This product is already in favorites");
    } else {
      this.favoriteProducts.push(product);
      localStorage.setItem("favorites", JSON.stringify(this.favoriteProducts));
      console.log("Product added to favorites:", product);
    }
  }


  toggleFavorites() {
    this.favoritesToggleSubject.next(true); // فتح القائمة عند التحديث
  }

  getFavorites() {
    return this.favoriteProducts;
  }
}
