import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private storageSub = new BehaviorSubject<string | null>(localStorage.getItem('key'));

  get storageChanges() {
    return this.storageSub.asObservable();
  }

  setItem(key: string, value: string) {
    localStorage.setItem(key, value);
    this.storageSub.next(value); // تحديث القيمة وإبلاغ المشتركين
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string) {
    localStorage.removeItem(key);
    this.storageSub.next(null);
  }
}
