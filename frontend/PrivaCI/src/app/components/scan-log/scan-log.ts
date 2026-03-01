import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ScanService } from '../../services/scan.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-scan-log',
  imports: [DatePipe],
  templateUrl: './scan-log.html',
  styleUrl: './scan-log.css',
})
export class ScanLog {
  @Input({ required: true }) log!: any;
  @Output() statusChanged = new EventEmitter<void>();

  private scanService = inject(ScanService);
  isUpdating = false;

  async onToggleIgnore() {
    if (!this.log.id || this.isUpdating) return;
    this.isUpdating = true;

    const targetStatus = this.log.status === 'IGNORED' ? 'OPEN' : 'IGNORED';

    try {
      await firstValueFrom(this.scanService.updateFindingStatus(this.log.id, targetStatus));
      
      this.statusChanged.emit(); 
    } catch (err) {
      console.error('Failed to ignore warning', err);
      this.isUpdating = false; 
    }
  }
}
