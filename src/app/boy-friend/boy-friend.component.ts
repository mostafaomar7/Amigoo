import { Component, OnInit , Input , Output , EventEmitter , SimpleChanges} from '@angular/core';
import { ApifunctionService } from '../sharedservice/apifunction.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-boy-friend',
  templateUrl: './boy-friend.component.html',
  styleUrls: ['./boy-friend.component.css']
})
export class BoyFriendComponent implements OnInit {
  @Input() data:any = {};
  @Output() item = new EventEmitter();
  addtocart :boolean = false;
  amount : Number = 0;
  
  
  @Input() selectedCategory: string = '';  // استقبال الـ category من الـ parent
  add(){
    this.item.emit({item:this.selectedCategory });
  }
  // هنعرض فيها الـ products
  alldata ={};
  allproduct ={};
  allcategory={};
  cardproduct: any [] =[];
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedCategory']) {
        this.loadProductsForCategory(this.selectedCategory);  // جلب الـ products عندما يتغير الـ category
    }
    console.log(this.selectedCategory);
    
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
  loadProductsForCategory(category: string) {
    // طلب الـ products بناءً على الـ category
    this.serv.getproductybycatgory(category).subscribe((data) => {
      this.alldata = data;  // فرضًا البيانات جاية في شكل array
      this.alldata = Object.values(this.alldata);
      console.log(this.alldata);
    });
  }
      constructor(private serv : ApifunctionService , private route : ActivatedRoute) { }
      // getdata(){
      //   this.serv.getdata().subscribe((data:any)=>{
      //     this.alldata=data;
      //     this.alldata = Object.values(this.alldata);  // تحويل الكائن إلى مصفوفة
          
      //   }, error=>{
      //     alert(error)
      //   })
      // }
      getcategory(){
        this.serv.getcatgory().subscribe(data=>{
          this.allcategory = data;
          this.allcategory = Object.values(this.allcategory);
        })
      }
    ngOnInit(): void {
      // this.getdata()
      // this.getcategory();
    }
  
  
  }
  