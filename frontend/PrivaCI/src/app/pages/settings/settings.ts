import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  config = {
    github: {
      connected: true,
      autoSync: true,
      scanOnPush: true
    },
    ignoreRules: [
      'tests/mocks/*',
      '*.example.json',
      'node_modules/'
    ]
  };

  isSaving = false;
  saveMessage = '';

  toggleBoolean(category: 'github', key: keyof typeof this.config.github) {
    if (key === 'connected') return; // Read-only property
    this.config[category][key] = !this.config[category][key];
  }

  // Remove an array item
  removeRule(index: number) {
    this.config.ignoreRules.splice(index, 1);
  }

  // Add a new array item
  addRule(inputElement: HTMLInputElement) {
    const rule = inputElement.value;
    if (rule && rule.trim() !== '') {
      this.config.ignoreRules.push(rule.trim());
      inputElement.value = ''; // Clear the input after adding
    }
  }

  // Simulate saving the file
  async saveConfig() {
    this.isSaving = true;
    this.saveMessage = '> Writing config.yml...';
    
    // Simulate API network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.saveMessage = '> [OK] 42 lines written to /etc/privaci/config.yml';
    this.isSaving = false;

    // Clear the success message after 3 seconds
    setTimeout(() => this.saveMessage = '', 3000);
  }

  deleteAccount() {
    const confirm = window.confirm('CRITICAL: Are you sure you want to delete your PrivaCI account? This action cannot be undone.');
    if (confirm) {
      alert('Account deletion sequence initiated.');
    }
  }
}
