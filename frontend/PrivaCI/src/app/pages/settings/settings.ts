import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
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

  newIgnore = { value: '', type: 'FOLDER' };
  ignoreRules: any[] = [];
  isSavingIgnoreRule = false;

  private generateIgnoreRegex(value: string, type: string): string {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    switch (type) {
      case 'FOLDER':
        return `(?:^|.*/)${escapedValue}/.*`;
      
      case 'FILE':
        return `(?:^|.*/)${escapedValue}$`;
      
      case 'EXTENSION':
        const ext = escapedValue.startsWith('\\.') ? escapedValue : `\\.${escapedValue}`;
        return `.*${ext}$`;
      
      default:
        return escapedValue;
    }
  }

  ngOnInit() {
    this.fetchRules();
    this.fetchIgnoreRules();
  }

  async fetchRules() {
    try {
      this.customRules = await this.settingsService.getCustomRules();
      this.cdr.detectChanges();
    } catch (err) {
      this.toastService.show("Failed to load custom rules.", "error");
    }
  }

  async fetchIgnoreRules() {
    try {
      this.ignoreRules = await this.settingsService.getIgnoreRules();
      this.cdr.detectChanges();
    } catch (err) {
      this.toastService.show("Failed to load ignore list.", "error");
    }
  }

  async addRule() {
    if (!this.newRule.name || !this.newRule.regex) return;
    
    try {
      new RegExp(this.newRule.regex);
    } catch (e) {
      this.toastService.show("Invalid Regex Syntax. Please check again.", "error");
      return;
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

  async addIgnoreRule() {
    if (!this.newIgnore.value.trim()) return;

    const generatedRegex = this.generateIgnoreRegex(this.newIgnore.value.trim(), this.newIgnore.type);
    this.isSavingIgnoreRule = true;

    try {
      const addedRule = await this.settingsService.addIgnoreRule({ path: generatedRegex });
      this.ignoreRules.unshift(addedRule);
      
      this.newIgnore = { value: '', type: 'FOLDER' };
      
      this.cdr.detectChanges();
      this.toastService.show("Ignore path added successfully.", "success");
    } catch (e) {
      this.toastService.show("Failed to save ignore path.", "error");
    } finally {
      this.isSavingIgnoreRule = false;
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

  async removeIgnoreRule(id: number) {
    try {
      await this.settingsService.deleteIgnoreRule(id);
      this.ignoreRules = this.ignoreRules.filter(r => r.id !== id);

      this.cdr.detectChanges();
      this.toastService.show("Ignore path deleted successfully.", "success");
    } catch (err) {
      this.toastService.show("Failed to delete ignore path. Please try again.", "error");
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
      window.location.href = '/login';
    } catch (err) {
      this.toastService.show("System Error: Could not purge account.", "error");
      this.isDeleting = false;
      this.closeDeleteModal();
    }
  }
}
