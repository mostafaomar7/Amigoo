import { Categoryinfo, Productinfo } from './../models/category';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApifunctionService } from '../sharedservice/apifunction.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CategoryService } from '../sharedservice/category.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-adminproduct',
  templateUrl: './adminproduct.component.html',
  styleUrls: ['./adminproduct.component.css']
})
export class AdminproductComponent implements OnInit {
  alldata = {};
  allcategory = {};
  constructor(private serv : ApifunctionService,private catserv : CategoryService , private http : HttpClient , private router: Router) { }
  getallcategory(){
    this.serv.getcatgory().subscribe(data=>{
      this.allcategory=data;
      this.allcategory=Object.values(this.allcategory);
    })
  }
  getallproduct(){
    this.serv.getdata().subscribe(data=>{
      this.alldata = data;
      this.alldata = Object.values(this.alldata);
    })
  }
  deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.catserv.deleteCategory(id).subscribe(() => {
        this.allcategory = this.allcategory[0].filter(c => c.id !== id);
        window.location.reload();
      });
    }
  }
  @ViewChild('fileInput') fileInput!: ElementRef;
selectedCategory!: Categoryinfo;
selectedCategoryName!: string;

editCategory(category: Categoryinfo) {
  const newName = prompt('Enter new category name:', category.name);
  if (!newName) return;

  this.selectedCategory = category; // حفظ الفئة المختارة
  this.selectedCategoryName = newName;
  
  this.fileInput.nativeElement.click(); // فتح نافذة اختيار الملف
}

onFileSelected(event: any) {
  const file = event.target.files[0];

  if (file) {
    const formData = new FormData();
    formData.append('name', this.selectedCategoryName);
    formData.append('image', file);

    // ✅ Console log للتحقق من البيانات قبل الإرسال
    console.log('🔹 FormData Content:');
    formData.forEach((value, key) => console.log(`${key}:`, value));

    this.catserv.updateCategory(this.selectedCategory._id, formData).subscribe({
      next: (updatedCategory) => {
        this.selectedCategory.name = updatedCategory.name;
        this.selectedCategory.image = updatedCategory.image;
        alert('تم التعديل بنجاح');
        window.location.reload();
      },
      error: (err) => console.error('❌ Upload failed:', err)
    });
  }
}

  

  deleteproduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.catserv.deleteproduct(id).subscribe(() => {
        this.alldata = this.alldata[0].filter(c => c.id !== id);
        window.location.reload();
      });
    }
  }
  editproduct(product: Productinfo) {
    const newNamee = prompt('Enter new product namee:', product.title);
    if (newNamee && newNamee !== product.title) {
      this.catserv.updateproduct(product._id, newNamee  ).subscribe(() => {
        product.title = newNamee; // تحديث مباشر بدون إعادة جلب البيانات
      });
    }
  }
  logout() {
    localStorage.removeItem('jwt'); // مسح التوكن
    localStorage.removeItem('user'); // لو كنت تخزن بيانات أخرى للمستخدم
  
    this.router.navigate(['/login']); // توجيه المستخدم لصفحة تسجيل الدخول
  }
  ngOnInit(): void {
    this.getallproduct()
    this.getallcategory()
  }

}
