import { Productinfo } from './../models/category';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Addcategory } from '../models/category';
import { ApifunctionService } from '../sharedservice/apifunction.service';
import { CategoryService } from '../sharedservice/category.service';
import { FormGroup, Validators,FormBuilder } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  
  object = new Addcategory;
  allcategory= {};
  categoryName: string = '';
  categorySlug: string = '';
  selectedFile!: File;
  productName: string = '';
  productSlug: string = '';
  selectedFilee!: File;
  productForm: FormGroup;
  
  product: Productinfo = {
    _id: '',
    title: '',
    slug: '',
    description: '',
    price: '',
    priceAfterDiscount: '',
    originalQuantity: '',
    quantity: '',
    imageCover: '',
    images: [],
    size: [], // ✅ حدد أن `size` هو مصفوفة نصوص
    category: { _id: '' }
  };
  successMessage = '';
  errorMessage = '';
  imageCoverFile: File | null = null;
  imagesFiles: File[] = [];
  // توكنك هنا (افترض إنك بتأخذ التوكن من مكان ما)
token = '';

// إعداد الهيدر مع التوكن
headers = new HttpHeaders({
  'Authorization': `Bearer ${this.token}`,
});

  selectedImage: File | null = null;

  constructor(private serv : ApifunctionService , private catserv: CategoryService ,private fb: FormBuilder , private router: Router) {
     }
  addctegories(){
    this.serv.postcategory(this.object).subscribe(data =>{
    })
  }
  getcategory(){
    this.serv.getcatgory().subscribe(data=>{
      this.allcategory = data;
      this.allcategory = Object.values(this.allcategory);
    })
  }
  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }
  submitCategory() {
    if (!this.categoryName || !this.categorySlug || !this.selectedFile) {
      alert('يرجى ملء جميع الحقول!');
      return;
    }

    this.catserv.addCategory(this.categoryName, this.categorySlug, this.selectedFile).subscribe(
      response => {
        console.log('✅ تم إرسال الفئة بنجاح:', response);
        alert('تمت إضافة الفئة بنجاح!');
      },
      error => {
        console.error('❌ حدث خطأ أثناء الإرسال:', error);
        alert('حدث خطأ أثناء الإرسال!');
      }
    );
  }
  //prooooooooooooooooooduct
  onImageCoverChange(event: any): void {
    const file = event.target.files[0];
    if (file && !this.product.imageCover.includes(file)) {
      this.product.imageCover=file;
      this.imageCoverFile = file;
    }
  }
  onImagesChange(event: any): void {
    const files = event.target.files;
    if (files && !this.product.images.includes(files)) {
      this.product.images.push(files)
      this.imagesFiles = Array.from(files);
    }
  }
  @Output() categorySelected = new EventEmitter<string>();
  onCategoryChange(event: any) {
    this.product.category._id = event.target.value; // تحديث الـ ID مباشرة
    console.log('Category ID Selected:', this.product.category._id);
  }

  newSize: string = ''; // قيمة الإدخال المؤقتة للحجم
  
  addSize() {
    if (this.newSize && !this.product.size.includes(this.newSize)) {
      this.product.size.push(this.newSize);
      this.newSize = ''; // تفريغ الإدخال بعد الإضافة
    }
  }
  
  // حذف حجم معين
  removeSize(size: string) {
    this.product.size = this.product.size.filter(s => s !== size);
  }
  submitProduct(): void {
    if (this.product && this.imageCoverFile) {
      const formData = new FormData();
      
      // إضافة البيانات النصية
      formData.append('title', this.product.title);
      formData.append('slug', this.product.slug);
      formData.append('description', this.product.description);
      formData.append('price', this.product.price.toString());
      this.product.size.forEach(size => {
        formData.append('size', size);
      });      formData.append('priceAfterDiscount', this.product.priceAfterDiscount.toString());
      formData.append('originalQuantity', this.product.originalQuantity.toString());
      formData.append('quantity', this.product.quantity.toString());
      formData.append('category', this.product.category._id);

      // إضافة الصورة الغلاف
      formData.append('imageCover', this.imageCoverFile);

      // إضافة الصور الأخرى
      this.imagesFiles.forEach(image => {
        formData.append('images', image);
      });
    console.log(this.product);
    
      // إرسال البيانات باستخدام الخدمة
      this.catserv.addProduct(formData).subscribe(response => {
        alert('تمت إضافة الفئة بنجاح!');
      }, error => {
        alert('حدث خطأ اثناء الارسال');
      });
    }
  }
  logout() {
    localStorage.removeItem('jwt'); // مسح التوكن
  
    this.router.navigate(['/login']); // توجيه المستخدم لصفحة تسجيل الدخول
  }
  // onSubmit() {
  //   this.catserv.addProduct(this.product).subscribe(
  //     response => {
  //       console.log('Product added successfully', response);
  //     },
  //     error => {
  //       console.error('Error adding product', error);
  //     }
  //   );
  // }

  
 

  ngOnInit(): void {
    this.getcategory();
  }

}
