import { Clientlogin } from './../models/category';
import { Component, OnInit } from '@angular/core';
import { ApifunctionService } from '../sharedservice/apifunction.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  invalidLogin: boolean = false;
  txpassowrd;
  txmail;
  invalidlogin:boolean;
  client: Clientlogin = { email: '', password: '' };
  constructor(private serv:ApifunctionService , private router : Router) {
    this.client = new Clientlogin();
  }
  onsignup() {
    this.serv.login(this.email, this.password).subscribe((success) => {
      if (success) {
        this.router.navigate(['/admin']);
      } else {
        this.invalidLogin = true;
      }
    });
  }
  ngOnInit(): void {
  }

}
