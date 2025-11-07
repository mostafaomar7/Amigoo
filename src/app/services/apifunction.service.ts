import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApifunctionService {
  constructor(private http : HttpClient) { }
  getdata(){         // get all product
    return this.http.get(`${environment.apiUrl}/product/`)
  }
  getcatgory(){
    // Pass a large limit to get all categories
    return this.http.get(`${environment.apiUrl}/categories/?limit=1000`)
  }
  getproductybycatgory(id:any){
    return this.http.get(`${environment.apiUrl}/product/category/${id}`)
  }
  getproductybyid(id:any){
    return this.http.get(`${environment.apiUrl}/categories/` + id)
  }
  getproductybyidd(id:any){
    return this.http.get(`${environment.apiUrl}/product/` + id)
  }
  postform(data){
    return this.http.post(`${environment.apiUrl}/submit/`,data)
  }
  postcategory(object){
    return this.http.post(`${environment.apiUrl}/categories/`, object)
  }
}
