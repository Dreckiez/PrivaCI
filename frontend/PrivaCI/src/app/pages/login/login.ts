import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TerminalWindow } from '../../components/terminal-window/terminal-window';

@Component({
  selector: 'app-login',
  imports: [TerminalWindow],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);

  login() {
    console.log('Attempting login...');
    
    // 1. Fake a successful login by saving a "token" to browser storage
    localStorage.setItem('auth_token', 'mock-token-123');
    
    // 2. Redirect the user to the dashboard
    this.router.navigate(['/dashboard']);
  }
}
