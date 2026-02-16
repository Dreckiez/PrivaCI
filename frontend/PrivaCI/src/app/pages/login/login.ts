import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TerminalWindow } from '../../components/terminal-window/terminal-window';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TerminalWindow],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      
      const token = params['token'];
      const username = params['username'];

      if (token) {
        
        localStorage.setItem('auth_token', token);
        if (username) localStorage.setItem('username', username);

        this.router.navigate(['/dashboard'], { replaceUrl: true });
      }
    });
  }

  login() {
    window.location.href = 'http://localhost:3000/api/auth/login';
  }
}
