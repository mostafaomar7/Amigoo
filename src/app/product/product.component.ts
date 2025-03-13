import { Component, OnInit } from '@angular/core';
import { ApifunctionService } from '../sharedservice/apifunction.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {

  // product: any;  // لتخزين تفاصيل المنتج
  // productId: string = '';
  id:any ;
  data= {};
  constructor(
    private route: ActivatedRoute,
    private serv: ApifunctionService  // خدمة لجلب تفاصيل المنتج
  ) {
    this.id = this.route.snapshot.paramMap.get('_id');
    console.log(this.id);
    
  }
  cardproduct : any[]=[];
  quantity;
  amount : Number = 1;
  cartproduct :any [] = [];
  total:any = 0;

  gettotalprice(){
    this.total = 0 ;
    for (let x in this.data){
      this.total += this.data[x].price *  this.data[x].quantity
    }
  }  
  increase(index){
      this.data[index].quantity++;
      localStorage.setItem("cart" , JSON.stringify(this.data));
      this.gettotalprice();
  }
  decrease(index){
    if(this.data[index].quantity>1){
    this.data[index].quantity--;
    localStorage.setItem("cart" , JSON.stringify(this.data))
    this.gettotalprice();
    }
  }
  detectedchange(){
    localStorage.setItem("cart" , JSON.stringify(this.data))
    this.gettotalprice();
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
  buy(product: any , amount :Number ) {
    if (!this.selectedSizes[product._id]) {  
      alert('يرجى اختيار المقاس أولاً!');
      return;
    }
    if("cart" in localStorage){
      this.cardproduct = JSON.parse(localStorage.getItem("cart")!)
      let exist = this.cardproduct.find(itemm => itemm._id == product._id)
      if (exist) {
        alert("Your Product is Already in Cart");
        window.location.href='/checkout'
      } else {
        this.cardproduct.push({ ...product, selectedSize: this.selectedSizes[product._id] });
        localStorage.setItem("cart", JSON.stringify(this.cardproduct));
        window.location.href='/checkout'
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
  ngOnInit(): void {
    // الحصول على الـ ID من الـ URL
    // this.productId = this.route.snapshot.paramMap.get('_id') || '';  // الحصول على الـ ID من الرابط
    // this.getProductDetails();
    // console.log(this.productId);
    this.getcatbyid();
    this.getproductbyid();
  }
  getcatbyid(){
    this.serv.getproductybyid(this.id).subscribe(res =>{
      this.data = res;
      this.data = Object.values(this.data);
    })
  }
  getproductbyid(){
    this.serv.getproductybyidd(this.id).subscribe(res =>{
      this.data = res;
      this.data = Object.values(this.data);
      console.log(this.data);
      
    })
  }
  // دالة لطلب تفاصيل المنتج من الخدمة
  // getProductDetails(): void {
  //   this.serv.getproductybyid(this.productId).subscribe((data) => {
  //     this.product = data;  // حفظ تفاصيل المنتج
  //     console.log(this.product);
      
  //   });
  // }
}  


