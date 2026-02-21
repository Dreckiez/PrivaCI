import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { CommonModule, DatePipe } from '@angular/common';
import { ScanService } from '../../services/scan.service';
import { ScanLog } from '../../components/scan-log/scan-log';
import { BranchSelector } from '../../components/branch-selector/branch-selector';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-repo-details',
  imports: [CommonModule, DatePipe, RouterLink, ScanLog, BranchSelector],
  templateUrl: './repo-details.html',
  styleUrl: './repo-details.css',
})
export class RepoDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scanService = inject(ScanService);

  repoStatus = 'Critical';
  commitHash = 'f9e8d7c';
  lastScanned = new Date();

  repoName$ = this.route.paramMap.pipe(
    map(params => params.get('id') || '')
  );

  branch$ = this.route.queryParamMap.pipe(
    map(params => params.get('branch') || 'main')
  );

  logs$ = combineLatest([this.repoName$, this.branch$]).pipe(
    switchMap(([repoName, branch]) => this.scanService.getScanDetails(repoName, branch))
  );

  branches: string[] = ['main', 'develop', 'feature/oauth-secrets', 'legacy-v1'];

  onBranchChange(branchName: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {branch: branchName},
      queryParamsHandling: 'merge'
    })
  }

}
