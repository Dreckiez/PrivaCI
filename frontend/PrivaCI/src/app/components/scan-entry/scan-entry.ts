import { Component, Input } from '@angular/core';
import { ScanResult } from '../../models/scan.model';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-scan-entry',
  imports: [RouterLink, DatePipe],
  templateUrl: './scan-entry.html',
  styleUrl: './scan-entry.css',
})
export class ScanEntry {
  @Input({ required: true}) scan!: ScanResult;
}
