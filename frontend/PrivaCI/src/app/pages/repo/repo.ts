import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Repository {
  id: string;
  name: string;
  isPrivate: boolean;
  language: string;
  status: 'Safe' | 'Warning' | 'Critical' | 'Unscanned';
  lastScanned: Date | null;
}

@Component({
  selector: 'app-repo',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './repo.html',
  styleUrl: './repo.css',
})
export class Repo {
  repos: Repository[] = [
    { id: 'frontend-dashboard', name: 'frontend-dashboard', isPrivate: true, language: 'TypeScript', status: 'Safe', lastScanned: new Date() },
    { id: 'backend-api', name: 'backend-api', isPrivate: true, language: 'JavaScript', status: 'Critical', lastScanned: new Date(Date.now() - 86400000) },
    { id: 'auth-service', name: 'auth-service', isPrivate: false, language: 'Go', status: 'Warning', lastScanned: new Date() },
    { id: 'personal-blog', name: 'personal-blog', isPrivate: false, language: 'HTML', status: 'Unscanned', lastScanned: null },
    { id: 'legacy-payment-gateway', name: 'legacy-payment-gateway', isPrivate: true, language: 'Java', status: 'Unscanned', lastScanned: null }
  ];
}
