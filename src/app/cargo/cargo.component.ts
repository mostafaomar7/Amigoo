import { Component, OnInit , Input , Output ,EventEmitter } from '@angular/core';
import { ApifunctionService } from '../sharedservice/apifunction.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CartService } from '../sharedservice/cart.service';
import { OpencartService } from '../sharedservice/opencart.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-cargo',
  templateUrl: './cargo.component.html',
  styleUrls: ['./cargo.component.css']
})
export class CargoComponent implements OnInit {
  selectedCategory: string | null = null;

  alldata ={};
   data:any = {};
   item ;
   cardproduct: any [] =[];
   starproduct: any [] =[];
  addtocart :boolean = false;
  amount : Number = 1;
  // add(){
  //   this.item.emit({item:this.data , quantity: this.amount});
  // }
    constructor(private cdRef: ChangeDetectorRef , private openser:OpencartService, private serv : ApifunctionService , private route : ActivatedRoute,private router: Router, private cartService: CartService ) {
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd && event.url === '/cart') {
          window.location.reload();
        }
      });
    }
    
    getdata(){
      this.serv.getdata().subscribe((data:any)=>{
        this.alldata=data;
        this.alldata = Object.values(this.alldata);        
      }, error=>{
        alert(error)
      })
    }
    addtocartt(event:any){
      console.log(event);
    }
    selectedSizes: { [productId: string]: string } = {}; // تخزين الحجم لكل منتج على حدة
    addToCart(product: any , amount :Number ) {
      if (!this.selectedSizes[product._id]) {  
        alert('يرجى اختيار المقاس أولاً!');
        return;
      }
      if("cart" in localStorage){
        this.cardproduct = JSON.parse(localStorage.getItem("cart")!)
        let exist = this.cardproduct.find(itemm => itemm._id == product._id)
        if (exist) {
          alert("Your Product is Already in Cart");
          window.location.href='/cart'
        } else {
          this.cardproduct.push({ ...product, selectedSize: this.selectedSizes[product._id] });
          localStorage.setItem("cart", JSON.stringify(this.cardproduct));
          alert("تم اضافة المنتج بنجاح");
          window.location.href='/cart'
        }
      } else {
        this.cardproduct.push({ ...product, selectedSize: this.selectedSizes[product._id] });
        localStorage.setItem("cart", JSON.stringify(this.cardproduct));
      }
      if (!this.selectedSizes[product._id]) {  
        alert('يرجى اختيار المقاس أولاً!');
        return;
      }
      
    }
    updateCartUI() {
      if ("cart" in localStorage) {
        this.cardproduct = JSON.parse(localStorage.getItem("cart")!);
      } else {
        this.cardproduct = [];
      }
    
      this.cdRef.detectChanges(); // ✅ إجبار Angular على تحديث الواجهة
    }
    
    addTostar(product: any , amount :Number ) {
      if("star" in localStorage){
        this.starproduct = JSON.parse(localStorage.getItem("star")!)
        let exist = this.starproduct.find(itemm => itemm._id == product._id)
        if(exist){
          alert("Your Product is Already in Favorite")
        }
        else{
          this.starproduct.push(product);
          localStorage.setItem("star",JSON.stringify(this.starproduct));
          alert("تم اضافة المنتج بنجاح")
          window.location.reload();
        }
      }
      else{
        this.starproduct.push(product );
        localStorage.setItem("star",JSON.stringify(this.starproduct));
      }
            
      console.log('العربة بعد الإضافة:', this.starproduct);
    }
    // openCart(product: any) {
    //   this.openser.addToCart(product);
    //   this.openser.toggleCart(); // فتح القائمة بعد الإضافة
    // }
    onCategoryChange(category: string) {
      console.log("Received category in CargoComponent:", category);
      this.selectedCategory = category;
    }
    
  ngOnInit(): void {
    this.getdata();
    this.updateCartUI()
  }


}

