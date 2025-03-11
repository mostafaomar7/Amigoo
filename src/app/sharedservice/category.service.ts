import { CategoryResponse , Categoryinfo, Contact, Order, Productinfo } from './../models/category';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { Category, CategoryResponse } from '../../app/models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://backend:8000/api/v1/categories/'; // غيّرها حسب الـ API الحقيقي

  constructor(private http: HttpClient) {}

  // 🟢 إضافة فئة جديدة مع صورة
  addCategory(name: string, slug: string, image: File): Observable<Categoryinfo> {
    const formData = new FormData();
  formData.append('name', name);
  formData.append('slug', slug);
  formData.append('image', image);

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  return this.http.post<Categoryinfo>(this.apiUrl, formData, { headers });
  }

  // 🔵 جلب جميع الفئات
  getCategories(): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(this.apiUrl);
  }
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`http://backend:8000/api/v1/categories/${id}`);
  }
  updateCategory(id: string, newName: string): Observable<Categoryinfo> {
    return this.http.put<Categoryinfo>(`http://backend:8000/api/v1/categories/${id}`, { name: newName });
  }
  apiproducturl='http://backend:8000/api/v1/product/'
  getProducts(): Observable<Productinfo[]> {
    return this.http.get<Productinfo[]>(this.apiproducturl);
  }
  addProduct(formData: FormData): Observable<any> {
    // قم بتمرير FormData مباشرة في POST
    return this.http.post(this.apiproducturl, formData);
  }
  deleteproduct(id: string): Observable<void> {
    return this.http.delete<void>(`http://backend:8000/api/v1/product/${id}`);
  }
  updateproduct(id: string, newName: string): Observable<Productinfo> {
    return this.http.put<Productinfo>(`http://backend:8000/api/v1/product/${id}`, { name: newName });
  }
  // addProduct(product: Productinfo , headers: HttpHeaders): Observable<Productinfo> {
  //   const token = localStorage.getItem('token');
  //   return this.http.post<Productinfo>(this.apiproducturl, product);
  // }
  sendContactForm(contactData: Contact): Observable<any> {
    return this.http.post<any>('http://backend:8000/api/v1/submit/'
      , contactData);
  }
  getContactForm(): Observable<any> {
    return this.http.get<any>('http://backend:8000/api/v1/submit/');
  }
  deleteresponse(id: string): Observable<void> {
    return this.http.delete<void>(`http://backend:8000/api/v1/submit/${id}`);
  }
  sendorderForm(orderData: Order): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>('http://backend:8000/api/v1/order/', JSON.stringify(orderData), { headers });
  }
  getorderForm(): Observable<any> {
    return this.http.get<any>('http://backend:8000/api/v1/order/');
  }
  deleteorder(id: string): Observable<void> {
    return this.http.delete<void>(`http://backend:8000/api/v1/order/${id}`);
  }
}
  
