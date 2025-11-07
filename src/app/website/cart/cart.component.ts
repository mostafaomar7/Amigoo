import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { EnvironmentService } from '../../services/environment.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  amount : Number = 1;
  cartproduct :any [] = [];
  total:any = 0;
  constructor(
    private notificationService: NotificationService,
    private environmentService: EnvironmentService
  ) { }
  getcartproducts(){
    if("cart" in localStorage){
      const cartData = localStorage.getItem("cart");
      if (cartData) {
        try {
          this.cartproduct = JSON.parse(cartData);
        } catch (e) {
          this.cartproduct = [];
        }
      } else {
        this.cartproduct = [];
      }
    } else {
      this.cartproduct = [];
    }
    this.gettotalprice();
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
  }
  delete(index){
    if (index >= 0 && index < this.cartproduct.length) {
      const product = this.cartproduct[index];
      this.cartproduct.splice(index , 1)
      localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
      this.gettotalprice();
      this.notificationService.success('تمت الإزالة من السلة', `تمت إزالة ${product.title || 'المنتج'} من السلة`);
      document.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  }
  ClearAllProducts(){
    if (this.cartproduct.length > 0) {
      this.cartproduct.splice(0,this.cartproduct.length);
      localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
      this.gettotalprice();
      this.notificationService.success('تم مسح السلة', 'تمت إزالة جميع المنتجات من السلة');
      document.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  }
  ngOnInit(): void {
    this.getcartproducts();
    // Listen for cart updates
    document.addEventListener('cartUpdated', this.onCartUpdated.bind(this));
  }

  ngOnDestroy(): void {
    // Remove event listener
    document.removeEventListener('cartUpdated', this.onCartUpdated.bind(this));
  }

  onCartUpdated(): void {
    // Update cart immediately when cart is updated
    this.getcartproducts();
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
