import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { CommonModule, DatePipe } from '@angular/common';
import { ScanLog } from '../../components/scan-log/scan-log';
import { BranchSelector } from '../../components/branch-selector/branch-selector';
import { combineLatest, firstValueFrom } from 'rxjs';
import { RepoDetailsData } from '../../models/repo.model';
import { RepoService } from '../../services/repo.service';

@Component({
  selector: 'app-repo-details',
  imports: [CommonModule, DatePipe, RouterLink, ScanLog, BranchSelector],
  templateUrl: './repo-details.html',
  styleUrl: './repo-details.css',
})
export class RepoDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private repoService = inject(RepoService);

  private cdr = inject(ChangeDetectorRef);

  data: RepoDetailsData | null = null;
  isLoading = true;
  
  ngOnInit() {
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ]).subscribe(([params, queryParams]) => {
      const id = params.get('id');
      const branch = queryParams.get('branch') || 'main';

      if (id) this.fetchRepoDetails(id, branch);
    })
  }

  async fetchRepoDetails(id: string, branch: string) {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      const response = await firstValueFrom(
        this.repoService.getRepoDetail(id, branch)
      );

      this.data = response.data;
    } catch (error) {
      
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // THE FIX: Force Angular to redraw the screen!
    }
  }

  onBranchChange(branchName: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {branch: branchName},
      queryParamsHandling: 'merge'
    })
  }

}
