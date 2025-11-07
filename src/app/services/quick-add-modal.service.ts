import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface QuickAddModalData {
  product: any;
  onConfirm: (selectedColor: string | null, selectedSize: string | null, quantity: number) => void;
}

@Injectable({
  providedIn: 'root'
})
export class QuickAddModalService {
  private modalSubject = new Subject<QuickAddModalData | null>();
  modal$ = this.modalSubject.asObservable();

  openModal(data: QuickAddModalData): void {
    this.modalSubject.next(data);
  }

  closeModal(): void {
    this.modalSubject.next(null);
  }
}
