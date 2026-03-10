import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SettingService } from '../../services/setting.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  authService = inject(AuthService);
  settingsService = inject(SettingService);
  toastService = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  showDeleteModal = false;
  deleteInput = '';
  isDeleting = false;

  customRules: any[] = [];
  newRule = { name: '', regex: '', severity: 'WARNING' };
  isSavingRule = false;

  ngOnInit() {
    this.fetchRules();
  }

  async fetchRules() {
    try {
      this.customRules = await this.settingsService.getCustomRules();
      this.cdr.detectChanges();
    } catch (err) {
      this.toastService.show("Failed to load custom rules.", "error");
    }
  }

  async addRule() {
    if (!this.newRule.name || !this.newRule.regex) return;
    
    try {
      new RegExp(this.newRule.regex);
    } catch (e) {
      this.toastService.show("Invalid Regex Syntax. Please check again.", "error");
      return; // Stop the execution here!
    }
    
    this.isSavingRule = true;
    try {
      const addedRule = await this.settingsService.addCustomRule(this.newRule);
      this.customRules.unshift(addedRule); 
      this.newRule = { name: '', regex: '', severity: 'WARNING' };

      this.cdr.detectChanges();
      this.toastService.show("Custom rule added successfully.", "success");
    } catch (err) {
      this.toastService.show("Failed to save rule. Please try again.", "error");
    } finally {
      this.isSavingRule = false;
    }
  }

  async removeRule(id: number) {
    try {
      await this.settingsService.deleteCustomRule(id);
      this.customRules = this.customRules.filter(r => r.id !== id);

      this.cdr.detectChanges();
      this.toastService.show("Rule deleted successfully.", "success");
    } catch (err) {
      this.toastService.show("Failed to delete rule. Please try again.", "error");
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
      this.toastService.show("System Error: Could not purge account.", "error");
      this.isDeleting = false;
      this.closeDeleteModal();
    }
  }
}
