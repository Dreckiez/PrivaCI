import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terminal-window',
  imports: [CommonModule],
  templateUrl: './terminal-window.html',
  styleUrl: './terminal-window.css',
})
export class TerminalWindow {
  @Input() title: string = 'bash';
}
