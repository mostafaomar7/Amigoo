import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  amount : Number = 1;
  cartproduct :any [] = [];
  total:any = 0;
  constructor() { }
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
  ngOnInit(): void {
    this.getcartproducts()
    
  }

}
