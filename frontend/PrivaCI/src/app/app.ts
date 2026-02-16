import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('PrivaCI');

  private router = inject(Router);
  showSidebar = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentUrl = event.urlAfterRedirects;
      
      const isLoginPage = currentUrl.startsWith('/login');
      
      this.showSidebar = !isLoginPage; 
      
      console.log('Current URL:', currentUrl, 'Show Sidebar:', this.showSidebar);
    });
  }
}
