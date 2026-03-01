import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ScanService } from '../../services/scan.service';
import { ScanEntry } from '../../components/scan-entry/scan-entry';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ScanEntry],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private scanService = inject(ScanService);

  dashboardData$ = this.scanService.getDashboardOverview().pipe(
    shareReplay(1) 
  );

  // 2. Extract the stats for the top cards
  stats$ = this.dashboardData$.pipe(map(data => data.stats));

  // 3. Extract the recent scans for the list
  scans$ = this.dashboardData$.pipe(map(data => data.recentScans));
}
