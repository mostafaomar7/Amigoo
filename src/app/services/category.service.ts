import { CategoryResponse , Categoryinfo, Contact, Order, Productinfo } from '../website/models/category';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories/`; // غيّرها حسب الـ API الحقيقي

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
    return this.http.delete<void>(`${environment.apiUrl}/categories/${id}`);
  }
  updateCategory(id: string, formData: FormData): Observable<Categoryinfo> {
    return this.http.put<Categoryinfo>(`${environment.apiUrl}/categories/${id}`, formData);
  }
  apiproducturl=`${environment.apiUrl}/product/`
  getProducts(): Observable<Productinfo[]> {
    return this.http.get<Productinfo[]>(this.apiproducturl);
  }
  addProduct(formData: FormData): Observable<any> {
    // قم بتمرير FormData مباشرة في POST
    return this.http.post(this.apiproducturl, formData);
  }
  deleteproduct(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/product/${id}`);
  }
  updateproduct(id: string, newName: string): Observable<Productinfo> {
    return this.http.put<Productinfo>(`${environment.apiUrl}/product/${id}`, { name: newName });
  }
  sendContactForm(contactData: Contact): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/submit/`, contactData);
  }
  getContactForm(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/submit/`);
  }
  deleteresponse(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/submit/${id}`);
  }
  sendorderForm(orderData: Order): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${environment.apiUrl}/order/`, JSON.stringify(orderData), { headers });
  }
  getorderForm(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/order/`);
  }
  deleteorder(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/order/${id}`);
  }
}
