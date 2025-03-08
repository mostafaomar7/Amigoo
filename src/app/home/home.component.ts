import { Component, OnInit , Input , Output , EventEmitter } from '@angular/core';
import { ApifunctionService } from '../sharedservice/apifunction.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  alldata = {};
  allproduct= {};
  
  @Input() data:any = {};
  @Output() item = new EventEmitter();
  constructor(private serv : ApifunctionService) { }
  getdata(){  //getallcategory
    this.serv.getcatgory().subscribe((data:any)=>{
      this.alldata=data;
      this.alldata = Object.values(this.alldata);  // تحويل الكائن إلى مصفوفة
      
    }, error=>{
      alert(error)
    })
  }
  @Output() categorySelected = new EventEmitter<string>();
  
  onCategoryChange(category: string) {
    this.categorySelected.emit(category);
    console.log(category);
  }
  loadProductsForCategory(category: string) {
    // طلب الـ products بناءً على الـ category
    this.serv.getproductybycatgory(category).subscribe((data) => {
      this.allproduct = data;  // فرضًا البيانات جاية في شكل array
      this.allproduct = Object.values(this.allproduct);
      
    });
  }
  // getValueAtIndex2(): string {
  //   return this.alldata[2];
  // }
ngOnInit(): void {
  this.getdata()
}

}
