import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../sharedservice/category.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customerconnect',
  templateUrl: './customerconnect.component.html',
  styleUrls: ['./customerconnect.component.css']
})
export class CustomerconnectComponent implements OnInit {
  allresponse={};
  constructor(private catserv:CategoryService , private router: Router) { }
  getresponse(){
    this.catserv.getContactForm().subscribe(res=>{
      this.allresponse=res;
      this.allresponse = Object.values(this.allresponse);
      console.log(this.allresponse);
      
    })
  }
  deleteresponse(id: string) {
    if (confirm('Are you sure you want to delete this response?')) {
      this.catserv.deleteresponse(id).subscribe(() => {
        this.allresponse = this.allresponse[0].filter(c => c.id !== id);
        window.location.reload();
      });
    }
  }
  logout() {
    localStorage.removeItem('jwt'); // مسح التوكن
    localStorage.removeItem('user'); // لو كنت تخزن بيانات أخرى للمستخدم
  
    this.router.navigate(['/login']); // توجيه المستخدم لصفحة تسجيل الدخول
  }
  ngOnInit(): void {
    this.getresponse();
  }

}
