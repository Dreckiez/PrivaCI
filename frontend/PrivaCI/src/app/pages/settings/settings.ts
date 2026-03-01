import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  authService = inject(AuthService);

  showDeleteModal = false;
  deleteInput = '';
  isDeleting = false;

  localPrefs = {
    showAuditTrail: true,
    terminalAnimations: true
  };

  togglePref(key: 'showAuditTrail' | 'terminalAnimations') {
    this.localPrefs[key] = !this.localPrefs[key];
  }

  openDeleteModal() {
    this.showDeleteModal = true;
    this.deleteInput = '';
  }

  closeDeleteModal() {
    if (this.isDeleting) return;
    this.showDeleteModal = false;
    this.deleteInput = '';
  }

  async confirmDelete() {
    if (this.deleteInput !== 'DELETE') return;
    
    this.isDeleting = true;
    try {
      await this.authService.deleteAccount();
      // Redirect to login to force session clear
      window.location.href = '/login'; 
    } catch (err) {
      console.error("Delete failed", err);
      alert("System Error: Could not purge account.");
      this.isDeleting = false;
      this.closeDeleteModal();
    }
  }
}
