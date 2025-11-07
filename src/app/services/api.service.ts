import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaginatedResponse<T> {
  success?: boolean;
  message?: string;
  data: T[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SingleResponse<T> {
  data: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  keyword?: string;
  status?: string;
  category_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  private getFormHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  constructor(private http: HttpClient) {}

  getPaginated<T>(endpoint: string, params?: PaginationParams, skipGlobalLoading?: boolean): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.fields) httpParams = httpParams.set('fields', params.fields);
      if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.category_id) {
        httpParams = httpParams.set('category_id', params.category_id);
      }
    }
    const fullUrl = `${this.apiUrl}${endpoint}?${httpParams.toString()}`;

    // Add header to skip global loading if requested
    let headers = this.getHeaders();
    if (skipGlobalLoading) {
      headers = headers.set('X-Skip-Global-Loading', 'true');
    }

    return this.http.get<PaginatedResponse<T>>(`${this.apiUrl}${endpoint}`, {
      headers: headers,
      params: httpParams
    });
  }

  getById<T>(endpoint: string, id: string): Observable<SingleResponse<T>> {
    return this.http.get<SingleResponse<T>>(`${this.apiUrl}${endpoint}/${id}`, {
      headers: this.getHeaders()
    });
  }

  getSingle<T>(endpoint: string): Observable<SingleResponse<T>> {
    return this.http.get<SingleResponse<T>>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders()
    });
  }

  post<T>(endpoint: string, data: any): Observable<T | SingleResponse<T>> {
    return this.http.post<T | SingleResponse<T>>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    });
  }

  postFormData<T>(endpoint: string, formData: FormData): Observable<SingleResponse<T>> {
    return this.http.post<SingleResponse<T>>(`${this.apiUrl}${endpoint}`, formData, {
      headers: this.getFormHeaders()
    });
  }

  put<T>(endpoint: string, id: string, data: any): Observable<SingleResponse<T>> {
    return this.http.put<SingleResponse<T>>(`${this.apiUrl}${endpoint}/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  putFormData<T>(endpoint: string, id: string, formData: FormData): Observable<SingleResponse<T>> {
    return this.http.put<SingleResponse<T>>(`${this.apiUrl}${endpoint}/${id}`, formData, {
      headers: this.getFormHeaders()
    });
  }

  delete(endpoint: string, id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${endpoint}/${id}`, {
      headers: this.getHeaders()
    });
  }

  putCustom<T>(endpoint: string, data: any): Observable<T | SingleResponse<T>> {
    return this.http.put<T | SingleResponse<T>>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    });
  }

  postCustom<T>(endpoint: string, data: any): Observable<T | SingleResponse<T>> {
    return this.http.post<T | SingleResponse<T>>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    });
  }
}
