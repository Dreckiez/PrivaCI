import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { ScanService } from '../../services/scan.service';
import { ScanEntry } from '../../components/scan-entry/scan-entry';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ScanEntry],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private scanService = inject(ScanService);
  private toastService = inject(ToastService);

  dashboardData$ = this.scanService.getDashboardOverview().pipe(
    catchError(err => {
      this.toastService.show("Failed to load dashboard overview.", "error");
      
      return EMPTY; 
    }),
    shareReplay(1) 
  );

  stats$ = this.dashboardData$.pipe(map(data => data.stats));

  scans$ = this.dashboardData$.pipe(map(data => data.recentScans));
}
