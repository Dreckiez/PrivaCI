import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TerminalWindow } from '../../components/terminal-window/terminal-window';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

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
  private authService = inject(AuthService);

  errorMessage: string | null = null;

  async ngOnInit() {
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error) {
      this.errorMessage = error;

      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }

    await this.authService.loadUser();

    if (this.authService.authenticated) this.router.navigate(['/dashboard']);
  }

  formatError(code: string): string {
    const errorMap: Record<string, string> = {
      'invalid_state': 'Security validation failed. Please try logging in again.',
      'access_denied': 'GitHub authorization was denied.',
      'invalid_token': 'Failed to retrieve access token from GitHub.',
      'auth_failed': 'Authentication process failed. Please try again.'
    };
    
    return errorMap[code] || 'An unknown authentication error occurred.';
  }

  login() {
    window.location.href = 'http://localhost:3000/api/auth/login';
  }
}
