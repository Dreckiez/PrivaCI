import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-branch-selector',
  standalone: true,
  templateUrl: './branch-selector.html',
  styleUrl: './branch-selector.css',
})
export class BranchSelector {
  @Input() branches: string[] = [];
  @Input() selectedBranch: string = '';
  @Output() branchChange = new EventEmitter<string>();

  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectBranch(branch: string) {
    this.branchChange.emit(branch);
    this.isOpen = false;
  }
}