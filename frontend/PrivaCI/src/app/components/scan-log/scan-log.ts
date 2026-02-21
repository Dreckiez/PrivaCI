import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-scan-log',
  imports: [DatePipe],
  templateUrl: './scan-log.html',
  styleUrl: './scan-log.css',
})
export class ScanLog {
  @Input({ required: true }) log!: any;
}
