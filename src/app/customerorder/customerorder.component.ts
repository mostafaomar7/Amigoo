import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../sharedservice/category.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customerorder',
  templateUrl: './customerorder.component.html',
  styleUrls: ['./customerorder.component.css']
})
export class CustomerorderComponent implements OnInit {

  allresponse={};
    constructor(private catserv:CategoryService , private router: Router) { }
    getorder(){
      this.catserv.getorderForm().subscribe(res=>{
        this.allresponse=res;
        this.allresponse = Object.values(this.allresponse);
        console.log(this.allresponse);
      })
    }
    deleteresponse(id: string) {
      console.log('Deleting Order ID:', id); // تحقق من الـ ID قبل الإرسال
    
      if (confirm('Are you sure you want to delete this response?')) {
        this.catserv.deleteorder(id).subscribe({
          next: () => {
            console.log('Order deleted successfully');
            this.allresponse[0] = this.allresponse[0].filter(c => c._id !== id);
          },
          error: (error) => console.error('Error deleting order:', error)
        });
      }
      
    }
    logout() {
        localStorage.removeItem('jwt'); // مسح التوكن
        localStorage.removeItem('user'); // لو كنت تخزن بيانات أخرى للمستخدم
      
        this.router.navigate(['/login']); // توجيه المستخدم لصفحة تسجيل الدخول
      }
    ngOnInit(): void {
      this.getorder();
    }
}
