import { Component, OnInit } from '@angular/core';
import { Order } from '../models/category';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})

export class CheckoutComponent implements OnInit {
  orderdata: Order = {
    fullName: '',
    country: '',
    streetAddress: '',
    state: '',
    phone: '',
    email: '',
    shippingAddress: false,
    orderNotes: '',
    localStorge: JSON.parse(localStorage.getItem('cart') || '[]')
  };
  errorMessage;
  successMessage;
  sentData: Order | null = null;
  cartproduct :any [] = [];
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
    this.cartproduct[index].quantity--;
    localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
    this.gettotalprice();
  }
  detectedchange(){
    localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
    this.gettotalprice();
  }
  delete(index){
    this.cartproduct.splice(index , 1)
    localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
    this.gettotalprice();
  }
  ClearAllProducts(){
    this.cartproduct.splice(0,this.cartproduct.length);
    localStorage.setItem("cart" , JSON.stringify(this.cartproduct))
    this.gettotalprice();
  }

  constructor(private catserv :CategoryService) { }
  submitForm() {
    // تحديث بيانات الطلب قبل الإرسال
    this.orderdata.localStorge = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log('Order Data Before Sending:', this.orderdata);
    if (this.orderdata.localStorge.length === 0) {
      this.errorMessage = 'please choose your product';
      this.successMessage = '';
      return; // إيقاف العملية وعدم إرسال الطلب
    }
    this.catserv.sendorderForm(this.orderdata).subscribe({
      next: (response) => {
        this.successMessage = 'Your Data Send Success We will Contact You Soon';
        this.errorMessage = '';

        // تصفية البيانات المرسلة
        this.sentData = { ...this.orderdata };
        console.log(this.orderdata);

        // تنظيف السلة بعد نجاح الطلب
        localStorage.removeItem('cart');
        this.cartproduct = [];
        this.total = 0;
      },
      error: (error) => {
        this.errorMessage = 'Please Fill All Data ';
        this.successMessage = '';
        console.error('Error:', error);
      }
    });
  }

  ngOnInit(): void {
    this.getcartproducts();
  }

}
