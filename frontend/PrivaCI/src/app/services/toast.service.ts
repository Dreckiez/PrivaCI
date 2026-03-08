import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastMessage } from '../models/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  
  toastState$ = this.toastSubject.asObservable();

  show(message: string, type: 'error' | 'success' | 'warning' = 'error') {
    this.toastSubject.next({ message, type });
  }
}