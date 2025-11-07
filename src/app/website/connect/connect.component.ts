import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApifunctionService } from '../../services/apifunction.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Contact } from '../models/category';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connect',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.css']
})
export class ConnectComponent implements OnInit {
  contactData: Contact = {
    name: '',
    email: '',
    phone: '',
    termsAccepted: false,
    message: ''
  };

  successMessage = '';
  errorMessage = '';
  postForm: FormGroup;
  sentData: Contact | null = null; // لحفظ البيانات المرسلة

  constructor(private fb: FormBuilder, private serv: ApifunctionService, private catserv:CategoryService , private http :HttpClient) {

  }
  submitForm() {
    this.catserv.sendContactForm(this.contactData).subscribe({
      next: (response) => {
        this.successMessage = 'Your Data Send Success We wii Contact With You Soon';
        this.errorMessage = '';
        this.sentData = { ...this.contactData }; // حفظ البيانات المرسلة
      },
      error: (error) => {
        this.errorMessage = 'Please Fill All Data and Check The box';
        this.successMessage = '';
        console.error('Error:', error);
      }
    });
  }
  ngOnInit(): void {}

  // دالة إرسال البيانات
  onsubmit(data) {
    this.http.post(`${environment.apiUrl}/submit/` , data).subscribe((res)=>{
    })
  }
}
