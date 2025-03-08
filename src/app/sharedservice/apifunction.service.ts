import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Clientlogin } from '../models/category';
import { Router } from '@angular/router';
interface LoginResponse {
  token: string;
  user: { _id: string; email: string };
}
@Injectable({
  providedIn: 'root'
})

export class ApifunctionService {
  constructor(private http : HttpClient , private router :Router) { }
  getdata(){         // get all product
    return this.http.get("http://localhost:8000/api/v1/product/")
  }
  getcatgory(){
    return this.http.get("http://localhost:8000/api/v1/categories/")
  }
  getproductybycatgory(id:any){
    return this.http.get(`http://localhost:8000/api/v1/product/category/${id}`)
  }
  getproductybyid(id:any){
    return this.http.get('http://localhost:8000/api/v1/categories/' + id)
  }
  getproductybyidd(id:any){
    return this.http.get('http://localhost:8000/api/v1/product/' + id)
  }
  postform(data){
    return this.http.post("http://localhost:8000/api/v1/submit/",data)
  }
  postcategory(object){
    return this.http.post('http://localhost:8000/api/v1/categories/', object)
  }
  
  private apiUrl = 'http://localhost:8000/api/v1/user';
  login(email: string, password: string): Observable<boolean> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      map(response => {
        if (response?.token) {
          localStorage.setItem('jwt', response.token);
          return true;
        }
        return false;
      }),
      catchError(() => {
        return [false];
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwt');
  }

  logout() {
    localStorage.removeItem('jwt');
  }

  // getproductybycatgory(keyword:string){
  //   return this.http.get("https://fakestoreapi.com/products/category/"+keyword)
  // }
  // // postdata(object){
  // //   return this.http.post("http://localhost:3000/type" , object )
  // // }
  // getproductybyid(id:any){
  //   return this.http.get('https://fakestoreapi.com/products/' + id)
  // }
}
