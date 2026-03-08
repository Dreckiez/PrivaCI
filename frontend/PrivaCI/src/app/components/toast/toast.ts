import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast implements OnInit, OnDestroy {
  toastService = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  visible = false;
  message = '';
  type: 'error' | 'success' | 'warning' = 'error';

  private toastTimeout: any;
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.toastService.toastState$.subscribe(toast => {
      this.message = toast.message;
      this.type = toast.type;
      this.visible = true;
      this.cdr.detectChanges();

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      
      this.toastTimeout = setTimeout(() => {
        this.visible = false;
        this.cdr.detectChanges();
      }, 3000);
    })
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }
}
