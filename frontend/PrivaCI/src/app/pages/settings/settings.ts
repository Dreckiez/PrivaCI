import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SettingService } from '../../services/setting.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  authService = inject(AuthService);
  settingsService = inject(SettingService);

  cdr = inject(ChangeDetectorRef);

  showDeleteModal = false;
  deleteInput = '';
  isDeleting = false;

  customRules: any[] = [];
  newRule = { name: '', regex: '', severity: 'WARNING' };
  isSavingRule = false;

  toast = { visible: false, message: '', type: 'error' };
  toastTimeout: any;

  ngOnInit() {
    this.fetchRules();
  }

  showToast(message: string, type: 'error' | 'success' | 'warning' = 'error') {
    this.toast = { visible: true, message, type };
    this.cdr.detectChanges();

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    
    this.toastTimeout = setTimeout(() => {
      this.toast.visible = false;
      this.cdr.detectChanges();
    }, 4000); // Disappears after 4 seconds
  }

  async fetchRules() {
    try {
      this.customRules = await this.settingsService.getCustomRules();
      this.cdr.detectChanges();
    } catch (err) {
      console.error("Failed to load rules", err);
    }
  }

  async addRule() {
    if (!this.newRule.name || !this.newRule.regex) return;
    
    try {
      new RegExp(this.newRule.regex);
    } catch (e) {
      this.showToast("Invalid Regex Syntax. Please check for unclosed brackets.", "error");
      return; // Stop the execution here!
    }
    
    this.isSavingRule = true;
    try {
      const addedRule = await this.settingsService.addCustomRule(this.newRule);
      this.customRules.unshift(addedRule); 
      this.newRule = { name: '', regex: '', severity: 'WARNING' };

      this.cdr.detectChanges();
    } catch (err) {
      alert("Failed to save rule. Check regex format.");
    } finally {
      this.isSavingRule = false;
    }
  }

  async removeRule(id: number) {
    try {
      await this.settingsService.deleteCustomRule(id);
      this.customRules = this.customRules.filter(r => r.id !== id);

      this.cdr.detectChanges();
    } catch (err) {
      console.error("Failed to delete rule", err);
    }
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
