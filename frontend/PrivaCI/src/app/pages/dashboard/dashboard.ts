import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  // We fetch the data directly
  scans$ = this.scanService.getRecentScans();

  // We calculate stats "reactively" (automatically updates when data changes)
  stats$ = this.scans$.pipe(
    map(scans => {
      const total = scans.length;
      const critical = scans.filter(s => s.status === 'CRITICAL').length;
      const safe = scans.filter(s => s.status === 'SAFE').length;
      return { total, critical, safe };
    })
  );
}
