import { Component, OnInit } from '@angular/core';
import { ApifunctionService } from '../../services/apifunction.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-shirt',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './shirt.component.html',
  styleUrls: ['./shirt.component.css']
})
export class ShirtComponent implements OnInit {
  alldata ={};
  id : any;
  constructor(private serv : ApifunctionService,private route : ActivatedRoute) {
    this.id = this.route.snapshot.paramMap.get('_id');
  }
  getdata(){
    this.serv.getproductybycatgory(this.id).subscribe((data:any)=>{
      this.alldata=data;
      this.alldata = Object.values(this.alldata);
      console.log(this.alldata);

    }, error=>{
      alert(error)
    })
  }
  cardproduct: any [] =[];
  addtocart :boolean = false;
  amount : Number = 0;
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
  ngOnInit(): void {
    this.getdata()
  }

}
